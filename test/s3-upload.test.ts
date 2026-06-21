import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ObjectStorageClient, StoredObject } from "../src/s3-upload.js";
import { resolveS3UploadEnv, syncOriginalsToS3 } from "../src/s3-upload.js";
import { writeFixtureImage } from "./fixtures.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

class MemoryStorageClient implements ObjectStorageClient {
  readonly deleted: string[] = [];
  readonly objects = new Set<string>();
  readonly uploaded: string[] = [];

  constructor(keys: string[] = []) {
    keys.forEach((key) => this.objects.add(key));
  }

  deleteObject(key: string): Promise<void> {
    this.deleted.push(key);
    this.objects.delete(key);
    return Promise.resolve();
  }

  headObject(key: string): Promise<StoredObject | undefined> {
    return Promise.resolve(this.objects.has(key) ? { key } : undefined);
  }

  listObjects(prefix: string): Promise<StoredObject[]> {
    return Promise.resolve(
      [...this.objects]
        .filter((key) => key.startsWith(prefix))
        .sort()
        .map((key) => ({ key }))
    );
  }

  putObject(input: { key: string }): Promise<void> {
    this.uploaded.push(input.key);
    this.objects.add(input.key);
    return Promise.resolve();
  }
}

describe("syncOriginalsToS3", () => {
  it("uploads local originals with content-addressed S3 keys", async () => {
    const sourceDir = await mkdtemp(join(tmpdir(), "gallery-upload-"));
    tempDirs.push(sourceDir);
    await writeFixtureImage(join(sourceDir, "test.jpg"));
    await writeFile(join(sourceDir, "test.yml"), "# title:\n", "utf8");
    const storage = new MemoryStorageClient();

    const result = await syncOriginalsToS3({
      bucketName: "gallery-originals",
      client: storage,
      originalPrefix: "originals",
      sourceDir
    });

    expect(result).toMatchObject({ deleted: 0, skipped: 0, uploaded: 1 });
    expect(storage.uploaded).toHaveLength(1);
    expect(storage.uploaded[0]).toMatch(/^originals\/test-[a-f0-9]{64}\.jpg$/u);
  });

  it("skips existing objects and prunes stale originals when requested", async () => {
    const sourceDir = await mkdtemp(join(tmpdir(), "gallery-upload-"));
    tempDirs.push(sourceDir);
    await writeFixtureImage(join(sourceDir, "test.jpg"));
    await writeFile(join(sourceDir, "test.yml"), "# title:\n", "utf8");
    const firstStorage = new MemoryStorageClient();
    const first = await syncOriginalsToS3({
      bucketName: "gallery-originals",
      client: firstStorage,
      originalPrefix: "originals",
      sourceDir
    });
    const existingKey = first.objects[0]?.key;
    expect(existingKey).toBeDefined();
    const storage = new MemoryStorageClient([existingKey ?? "", "originals/stale.jpg"]);

    const result = await syncOriginalsToS3({
      bucketName: "gallery-originals",
      client: storage,
      originalPrefix: "originals",
      prune: true,
      sourceDir
    });

    expect(result).toMatchObject({ deleted: 1, skipped: 1, uploaded: 0 });
    expect(storage.deleted).toEqual(["originals/stale.jpg"]);
  });

  it("reports progress after each original is processed", async () => {
    const sourceDir = await mkdtemp(join(tmpdir(), "gallery-upload-"));
    tempDirs.push(sourceDir);
    await writeFixtureImage(join(sourceDir, "first.jpg"));
    await writeFixtureImage(join(sourceDir, "second.jpg"));
    await writeFile(join(sourceDir, "first.yml"), "# title:\n", "utf8");
    await writeFile(join(sourceDir, "second.yml"), "# title:\n", "utf8");
    const storage = new MemoryStorageClient();
    const progress: Array<{ completed: number; skipped: number; total: number; uploaded: number }> =
      [];

    await syncOriginalsToS3({
      bucketName: "gallery-originals",
      client: storage,
      onProgress: (event) => {
        progress.push({
          completed: event.completed,
          skipped: event.skipped,
          total: event.total,
          uploaded: event.uploaded
        });
      },
      originalPrefix: "originals",
      sourceDir
    });

    expect(progress).toEqual([
      { completed: 1, skipped: 0, total: 2, uploaded: 1 },
      { completed: 2, skipped: 0, total: 2, uploaded: 2 }
    ]);
  });
});

describe("resolveS3UploadEnv", () => {
  it("reads neutral S3-compatible upload settings", () => {
    expect(
      resolveS3UploadEnv({
        S3_ACCESS_KEY_ID: "access-key",
        S3_BUCKET: "gallery-originals",
        S3_ENDPOINT: "https://account-id.r2.cloudflarestorage.com",
        S3_SECRET_ACCESS_KEY: "secret-key"
      })
    ).toEqual({
      accessKeyId: "access-key",
      bucketName: "gallery-originals",
      endpoint: "https://account-id.r2.cloudflarestorage.com",
      secretAccessKey: "secret-key"
    });
  });

  it("requires an explicit endpoint", () => {
    expect(() =>
      resolveS3UploadEnv({
        S3_ACCESS_KEY_ID: "access-key",
        S3_BUCKET: "gallery-originals",
        S3_SECRET_ACCESS_KEY: "secret-key"
      })
    ).toThrow("Missing S3 endpoint");
  });

  it("does not read ambient AWS credentials", () => {
    expect(() =>
      resolveS3UploadEnv({
        AWS_ACCESS_KEY_ID: "access-key",
        AWS_SECRET_ACCESS_KEY: "secret-key",
        S3_BUCKET: "gallery-originals",
        S3_ENDPOINT: "https://account-id.r2.cloudflarestorage.com"
      })
    ).toThrow("Missing S3 access key id");
  });
});

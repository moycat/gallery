import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadEnvFiles } from "../src/env.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe("loadEnvFiles", () => {
  it("loads .envs values without overriding explicit environment values", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gallery-env-"));
    tempDirs.push(dir);
    await writeFile(
      join(dir, ".envs"),
      ["S3_BUCKET=from-file", "S3_PUBLIC_BASE_URL=https://media.example.com", ""].join("\n"),
      "utf8"
    );

    const env = loadEnvFiles({
      cwd: dir,
      env: {
        S3_BUCKET: "from-env"
      }
    });

    expect(env.S3_BUCKET).toBe("from-env");
    expect(env.S3_PUBLIC_BASE_URL).toBe("https://media.example.com");
  });
});

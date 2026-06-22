import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

import { afterEach, expect, test } from "vitest";

const execFile = promisify(execFileCallback);

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

test("hydrates pointer files from the local photo content cache", async () => {
  const repository = await makeTemporaryDirectory();
  const cacheRoot = join(repository, ".photos-cache", "photos");
  const photoPath = join(repository, "photos", "example.jpg");
  const originalContent = "cached lfs photo content";
  const originalHash = createHash("sha256").update(originalContent).digest("hex");
  const scriptPath = resolve("scripts/hydrate-lfs-photos.ts");
  const tsxPath = resolve("node_modules", ".bin", "tsx");

  await execFile("git", ["init"], { cwd: repository });
  await execFile("git", ["lfs", "install", "--local"], { cwd: repository });
  await execFile("git", ["lfs", "track", "photos/*.jpg"], { cwd: repository });
  await mkdir(dirname(photoPath), { recursive: true });
  await writeFile(photoPath, originalContent);
  await execFile("git", ["add", ".gitattributes", "photos/example.jpg"], { cwd: repository });
  await execFile(
    "git",
    ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "add photo"],
    { cwd: repository }
  );

  await mkdir(dirname(join(cacheRoot, "example.jpg")), { recursive: true });
  await copyFile(photoPath, join(cacheRoot, "example.jpg"));
  await writeFile(
    photoPath,
    `version https://git-lfs.github.com/spec/v1\noid sha256:${originalHash}\nsize ${originalContent.length}\n`
  );

  const { stdout } = await execFile(tsxPath, [scriptPath], {
    cwd: repository,
    env: {
      ...process.env,
      PHOTO_CACHE_DIR: cacheRoot
    }
  });

  expect(stdout).toContain("1 from cache");
  expect(await readFile(photoPath, "utf8")).toBe(originalContent);
});

async function makeTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "gallery-hydrate-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

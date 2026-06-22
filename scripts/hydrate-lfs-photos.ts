import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, link, mkdir, readdir, rm, rmdir, stat } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { execFile as execFileCallback, spawn } from "node:child_process";

const execFile = promisify(execFileCallback);

const sourceRoot = "photos";
const defaultCacheRoot = ".photos-cache/photos";
const batchSize = 20;

interface GitLfsListResult {
  files?: GitLfsFile[];
}

interface GitLfsFile {
  name?: string;
  oid?: string;
  oid_type?: string;
}

interface PhotoEntry {
  oid: string;
  relativePath: string;
  sourcePath: string;
}

interface HydrateStats {
  downloaded: number;
  pruned: number;
  reused: number;
  seeded: number;
}

async function main(): Promise<void> {
  const cacheRoot = process.env.PHOTO_CACHE_DIR ?? defaultCacheRoot;
  const entries = await listLfsPhotos();
  const stats: HydrateStats = {
    downloaded: 0,
    pruned: 0,
    reused: 0,
    seeded: 0
  };

  await mkdir(cacheRoot, { recursive: true });
  stats.pruned = await pruneCache(cacheRoot, new Set(entries.map((entry) => entry.relativePath)));

  const missing: PhotoEntry[] = [];

  for (const entry of entries) {
    const cachePath = toCachePath(cacheRoot, entry.relativePath);

    if (await fileMatchesHash(cachePath, entry.oid)) {
      await replaceWithLinkOrCopy(cachePath, entry.sourcePath);
      stats.reused += 1;
      continue;
    }

    if (await fileMatchesHash(entry.sourcePath, entry.oid)) {
      await copyToCache(entry.sourcePath, cachePath);
      stats.seeded += 1;
      continue;
    }

    missing.push(entry);
  }

  if (missing.length > 0) {
    for (const batch of chunk(missing, batchSize)) {
      await pullLfsBatch(batch.map((entry) => entry.sourcePath));

      for (const entry of batch) {
        if (!(await fileMatchesHash(entry.sourcePath, entry.oid))) {
          throw new Error(
            `Git LFS did not hydrate ${entry.sourcePath} to expected SHA-256 ${entry.oid}`
          );
        }

        await copyToCache(entry.sourcePath, toCachePath(cacheRoot, entry.relativePath));
        stats.downloaded += 1;
      }
    }
  }

  console.log(
    `Hydrated ${entries.length} LFS photos: ${stats.reused} from cache, ${stats.seeded} from workspace, ${stats.downloaded} downloaded, ${stats.pruned} stale cache files removed.`
  );
}

async function listLfsPhotos(): Promise<PhotoEntry[]> {
  const { stdout } = await execFile(
    "git",
    ["lfs", "ls-files", "--json", `--include=${sourceRoot}/**`],
    {
      maxBuffer: 1024 * 1024 * 20
    }
  );
  const result = JSON.parse(stdout) as GitLfsListResult;
  const files = result.files ?? [];

  return files.flatMap((file) => {
    if (file.name === undefined || file.oid === undefined || file.oid_type !== "sha256") {
      return [];
    }

    const sourcePath = file.name;

    if (!sourcePath.startsWith(`${sourceRoot}/`)) {
      return [];
    }

    const relativePath = sourcePath.slice(sourceRoot.length + 1);
    assertSafeRelativePath(relativePath);

    return [
      {
        oid: file.oid,
        relativePath,
        sourcePath
      }
    ];
  });
}

async function pruneCache(cacheRoot: string, expectedFiles: Set<string>): Promise<number> {
  let removed = 0;

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(fullPath);
        await removeDirectoryIfEmpty(fullPath);
        continue;
      }

      const cacheRelativePath = toPosixPath(relative(cacheRoot, fullPath));

      if (!expectedFiles.has(cacheRelativePath)) {
        await rm(fullPath);
        removed += 1;
      }
    }
  }

  await visit(cacheRoot);
  await removeDirectoryIfEmpty(cacheRoot);
  await mkdir(cacheRoot, { recursive: true });

  return removed;
}

async function removeDirectoryIfEmpty(directory: string): Promise<void> {
  try {
    await rmdir(directory);
  } catch (error) {
    if (
      isNodeError(error) &&
      error.code !== undefined &&
      ["ENOTEMPTY", "ENOENT"].includes(error.code)
    ) {
      return;
    }

    throw error;
  }
}

async function fileMatchesHash(path: string, expectedHash: string): Promise<boolean> {
  if (!(await fileExists(path))) {
    return false;
  }

  return (await hashFile(path)) === expectedHash;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function hashFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}

async function copyToCache(sourcePath: string, cachePath: string): Promise<void> {
  await mkdir(dirname(cachePath), { recursive: true });
  await copyFile(sourcePath, cachePath);
}

async function replaceWithLinkOrCopy(sourcePath: string, targetPath: string): Promise<void> {
  await mkdir(dirname(targetPath), { recursive: true });
  await rm(targetPath, { force: true });

  try {
    await link(sourcePath, targetPath);
  } catch (error) {
    if (
      isNodeError(error) &&
      error.code !== undefined &&
      ["EEXIST", "EXDEV", "EPERM"].includes(error.code)
    ) {
      await copyFile(sourcePath, targetPath);
      return;
    }

    throw error;
  }
}

async function pullLfsBatch(paths: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("git", ["lfs", "pull", `--include=${paths.join(",")}`], {
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`git lfs pull exited with code ${code ?? "unknown"}`));
    });
  });
}

function toCachePath(cacheRoot: string, relativePath: string): string {
  return join(cacheRoot, ...relativePath.split("/"));
}

function assertSafeRelativePath(relativePath: string): void {
  if (
    relativePath === "" ||
    relativePath.startsWith("/") ||
    relativePath.split("/").includes("..")
  ) {
    throw new Error(`Unsafe Git LFS photo path: ${relativePath}`);
  }
}

function toPosixPath(path: string): string {
  return path.split(sep).join("/");
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

await main();

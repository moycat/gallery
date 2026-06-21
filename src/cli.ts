#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { lookup as lookupMimeType } from "mime-types";

import { loadEnvFiles } from "./env.js";
import { buildGallery } from "./gallery-build.js";
import { loadProjectConfig } from "./project-config.js";
import { uploadOriginalsToS3, type SyncOriginalsToS3Progress } from "./s3-upload.js";
import { updateGallerySource } from "./source.js";

interface BuildArgs {
  description?: string;
  outDir?: string;
  sourceDir?: string;
  title?: string;
}

interface DevArgs {
  outDir?: string;
  port: number;
  sourceDir?: string;
  title?: string;
}

interface UpdateArgs {
  sourceDir?: string;
}

interface UploadArgs {
  prune: boolean;
  sourceDir?: string;
}

export async function runCli(args = process.argv.slice(2)): Promise<void> {
  const [command = "help", ...rest] = args;

  switch (command) {
    case "build": {
      const options = parseBuildArgs(rest);
      const env = loadEnvFiles();
      const config = loadProjectConfig({ env });
      const description = options.description ?? config.description;
      await buildGallery({
        ...(description === undefined ? {} : { description }),
        outputDir: options.outDir ?? config.outputDir,
        storage: config.storage,
        sourceDir: options.sourceDir ?? config.sourceDir,
        title: options.title ?? config.title
      });
      console.log(`Wrote gallery site to ${options.outDir ?? config.outputDir}`);
      return;
    }
    case "dev": {
      const options = parseDevArgs(rest);
      const env = loadEnvFiles();
      const config = loadProjectConfig({ env });
      const outputDir = options.outDir ?? config.outputDir;
      await buildGallery({
        ...(config.description === undefined ? {} : { description: config.description }),
        outputDir,
        sourceDir: options.sourceDir ?? config.sourceDir,
        title: options.title ?? config.title,
        useLocalOriginals: true
      });
      await serveStaticSite(outputDir, options.port);
      return;
    }
    case "update": {
      const options = parseUpdateArgs(rest);
      const env = loadEnvFiles();
      const config = loadProjectConfig({ env });
      const sourceDir = options.sourceDir ?? config.sourceDir;
      const result = await updateGallerySource({ sourceDir });
      console.log(
        `Updated ${sourceDir}: ${result.albums} albums, ${result.photos} photos, ${result.created.length} metadata files created`
      );
      return;
    }
    case "upload": {
      const options = parseUploadArgs(rest);
      const progress = createUploadProgressReporter(process.stderr);
      const result = await uploadOriginalsToS3({
        onProgress: progress.update,
        prune: options.prune,
        sourceDir: options.sourceDir
      }).finally(progress.finish);
      console.log(
        `Synced originals to S3-compatible bucket ${result.bucketName}: ${result.uploaded} uploaded, ${result.skipped} skipped, ${result.deleted} deleted`
      );
      return;
    }
    case "help":
    case "--help":
    case "-h":
      printHelp();
      return;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

function parseBuildArgs(args: string[]): BuildArgs {
  const options: BuildArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--description":
        options.description = readFlagValue(arg, next);
        index += 1;
        break;
      case "--outDir":
        options.outDir = readFlagValue(arg, next);
        index += 1;
        break;
      case "--sourceDir":
        options.sourceDir = readFlagValue(arg, next);
        index += 1;
        break;
      case "--title":
        options.title = readFlagValue(arg, next);
        index += 1;
        break;
      default:
        throw new Error(`Unknown build option: ${arg}`);
    }
  }

  return options;
}

function parseDevArgs(args: string[]): DevArgs {
  const options: DevArgs = {
    port: 8788
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--outDir":
        options.outDir = readFlagValue(arg, next);
        index += 1;
        break;
      case "--port":
        options.port = Number.parseInt(readFlagValue(arg, next), 10);
        index += 1;
        break;
      case "--sourceDir":
        options.sourceDir = readFlagValue(arg, next);
        index += 1;
        break;
      case "--title":
        options.title = readFlagValue(arg, next);
        index += 1;
        break;
      default:
        throw new Error(`Unknown dev option: ${arg}`);
    }
  }

  if (!Number.isInteger(options.port) || options.port <= 0) {
    throw new Error("--port must be a positive integer.");
  }

  return options;
}

function parseUpdateArgs(args: string[]): UpdateArgs {
  const options: UpdateArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--sourceDir":
        options.sourceDir = readFlagValue(arg, next);
        index += 1;
        break;
      default:
        throw new Error(`Unknown update option: ${arg}`);
    }
  }

  return options;
}

function parseUploadArgs(args: string[]): UploadArgs {
  const options: UploadArgs = {
    prune: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--prune":
        options.prune = true;
        break;
      case "--sourceDir":
        options.sourceDir = readFlagValue(arg, next);
        index += 1;
        break;
      default:
        throw new Error(`Unknown upload option: ${arg}`);
    }
  }

  return options;
}

function readFlagValue(flag: string, value: string | undefined): string {
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function printHelp(): void {
  console.log(`Usage:
  gallery build [--sourceDir photos] [--outDir dist] [--title 末影画廊] [--description text]
  gallery dev [--sourceDir photos] [--outDir dist] [--port 8788]
  gallery update [--sourceDir photos]
  gallery upload [--sourceDir photos] [--prune]

Commands:
  build   Update metadata, generate thumbnails, and write the static site
  dev     Build with local originals and serve dist without upload or deploy
  update  Create missing metadata placeholders and validate existing metadata
  upload  Sync local originals to the configured S3-compatible bucket
  help    Show this help message
`);
}

interface ProgressStream {
  clearLine?: ((direction: -1 | 0 | 1, callback?: () => void) => boolean) | undefined;
  columns?: number | undefined;
  cursorTo?: ((x: number, y?: number, callback?: () => void) => boolean) | undefined;
  isTTY?: boolean | undefined;
  write(chunk: string): boolean;
}

function createUploadProgressReporter(stream: ProgressStream): {
  finish: () => void;
  update: (progress: SyncOriginalsToS3Progress) => void;
} {
  let rendered = false;

  return {
    finish: () => {
      if (stream.isTTY === true && rendered) {
        stream.write("\n");
      }
    },
    update: (progress) => {
      if (stream.isTTY !== true) {
        return;
      }

      const line = renderUploadProgress(progress, stream.columns ?? 80);

      if (stream.clearLine !== undefined && stream.cursorTo !== undefined) {
        stream.clearLine(0);
        stream.cursorTo(0);
        stream.write(line);
      } else {
        stream.write(`\r${line}`);
      }

      rendered = true;
    }
  };
}

function renderUploadProgress(progress: SyncOriginalsToS3Progress, columns: number): string {
  const ratio = progress.total === 0 ? 1 : Math.min(progress.completed / progress.total, 1);
  const barWidth = Math.max(10, Math.min(30, columns - 58));
  const filled = Math.round(barWidth * ratio);
  const empty = barWidth - filled;
  const percent = `${Math.round(ratio * 100)
    .toString()
    .padStart(3, " ")}%`;
  const bar = `[${"#".repeat(filled)}${"-".repeat(empty)}]`;

  return `Uploading originals ${bar} ${percent} ${progress.completed}/${progress.total} (${progress.uploaded} uploaded, ${progress.skipped} skipped)`;
}

async function serveStaticSite(outputDir: string, port: number): Promise<void> {
  const root = resolve(outputDir);
  const server = createServer((request, response) => {
    void handleStaticRequest(root, request, response);
  });

  await new Promise<void>((resolveListen) => {
    server.listen(port, resolveListen);
  });
  console.log(`Serving ${outputDir} at http://localhost:${port}`);
  await new Promise(() => undefined);
}

async function handleStaticRequest(
  root: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const filePath = resolveStaticFilePath(root, url.pathname);

  if (filePath === undefined) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Length": fileStat.size,
      "Content-Type": lookupMimeType(extname(filePath)) || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(500);
    response.end("Internal server error");
  }
}

export function resolveStaticFilePath(root: string, pathname: string): string | undefined {
  const decodedPathname = decodeURIComponent(pathname);
  const requestedPath =
    decodedPathname === "/"
      ? "/index.html"
      : decodedPathname.endsWith("/")
        ? `${decodedPathname}index.html`
        : extname(decodedPathname) === ""
          ? `${decodedPathname}/index.html`
          : decodedPathname;
  const resolvedRoot = resolve(root);
  const filePath = resolve(join(resolvedRoot, requestedPath));

  if (filePath !== resolvedRoot && !filePath.startsWith(`${resolvedRoot}${sep}`)) {
    return undefined;
  }

  return filePath;
}

const entryPoint = process.argv[1];

if (entryPoint !== undefined && import.meta.url === pathToFileURL(entryPoint).href) {
  runCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}

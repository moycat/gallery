#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { buildGallery } from "./gallery-build.js";
import { updateGallerySource } from "./source.js";

interface BuildArgs {
  description?: string;
  outDir: string;
  sourceDir: string;
  title: string;
}

interface UpdateArgs {
  sourceDir: string;
}

export async function runCli(args = process.argv.slice(2)): Promise<void> {
  const [command = "help", ...rest] = args;

  switch (command) {
    case "build": {
      const options = parseBuildArgs(rest);
      await buildGallery({
        ...(options.description === undefined ? {} : { description: options.description }),
        outputDir: options.outDir,
        sourceDir: options.sourceDir,
        title: options.title
      });
      console.log(`Wrote gallery site to ${options.outDir}`);
      return;
    }
    case "update": {
      const options = parseUpdateArgs(rest);
      const result = await updateGallerySource({ sourceDir: options.sourceDir });
      console.log(
        `Updated ${options.sourceDir}: ${result.albums} albums, ${result.photos} photos, ${result.created.length} metadata files created`
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
  const options: BuildArgs = {
    outDir: "dist",
    sourceDir: "photos",
    title: "Gallery"
  };

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

function parseUpdateArgs(args: string[]): UpdateArgs {
  const options: UpdateArgs = {
    sourceDir: "photos"
  };

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

function readFlagValue(flag: string, value: string | undefined): string {
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function printHelp(): void {
  console.log(`Usage:
  gallery build [--sourceDir photos] [--outDir dist] [--title Gallery] [--description text]
  gallery update [--sourceDir photos]

Commands:
  build   Update metadata, generate thumbnails, copy originals, and write the static site
  update  Create missing metadata placeholders and validate existing metadata
  help   Show this help message
`);
}

const entryPoint = process.argv[1];

if (entryPoint !== undefined && import.meta.url === pathToFileURL(entryPoint).href) {
  runCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}

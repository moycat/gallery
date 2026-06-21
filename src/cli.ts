#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { buildStaticSite } from "./site.js";

interface BuildArgs {
  description?: string;
  outDir: string;
  title: string;
}

export async function runCli(args = process.argv.slice(2)): Promise<void> {
  const [command = "help", ...rest] = args;

  switch (command) {
    case "build": {
      const options = parseBuildArgs(rest);
      const buildInput = {
        outputDir: options.outDir,
        title: options.title
      };

      await buildStaticSite(
        options.description === undefined
          ? buildInput
          : { ...buildInput, description: options.description }
      );
      console.log(`Wrote static gallery scaffold to ${options.outDir}`);
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

function readFlagValue(flag: string, value: string | undefined): string {
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function printHelp(): void {
  console.log(`Usage:
  gallery build [--outDir dist] [--title Gallery] [--description text]

Commands:
  build  Write the current static gallery scaffold
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

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse as parseDotenv } from "dotenv";

export type Environment = Record<string, string | undefined>;

export interface LoadEnvFilesOptions {
  cwd?: string | undefined;
  env?: Environment | undefined;
}

export function loadEnvFiles(options: LoadEnvFilesOptions = {}): Environment {
  const cwd = options.cwd ?? process.cwd();
  const baseEnv = { ...(options.env ?? process.env) };
  const envPath = join(cwd, ".envs");

  if (!existsSync(envPath)) {
    return baseEnv;
  }

  const parsed = parseDotenv(readFileSync(envPath, "utf8"));

  for (const [key, value] of Object.entries(parsed)) {
    if (baseEnv[key] === undefined) {
      baseEnv[key] = value;
    }
  }

  return baseEnv;
}

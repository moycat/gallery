import type { Environment } from "./env.js";

export interface ProjectConfig {
  outputDir: string;
  storage: {
    originalPrefix: string;
    publicBaseUrl?: string;
  };
  sourceDir: string;
  title: string;
  description?: string;
}

export interface LoadProjectConfigOptions {
  env?: Environment | undefined;
}

export function loadProjectConfig(options: LoadProjectConfigOptions = {}): ProjectConfig {
  const env = options.env ?? process.env;
  const description = readEnvValue(env.GALLERY_DESCRIPTION);
  const publicBaseUrl = readEnvValue(env.S3_PUBLIC_BASE_URL);

  return {
    ...(description === undefined ? {} : { description }),
    outputDir: readEnvValue(env.GALLERY_OUTPUT_DIR) ?? "dist",
    storage: {
      originalPrefix: readEnvValue(env.S3_ORIGINAL_PREFIX) ?? "originals",
      ...(publicBaseUrl === undefined ? {} : { publicBaseUrl })
    },
    sourceDir: readEnvValue(env.GALLERY_SOURCE_DIR) ?? "photos",
    title: readEnvValue(env.GALLERY_TITLE) ?? "末影画廊"
  };
}

function readEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}

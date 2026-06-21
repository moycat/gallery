import { describe, expect, it } from "vitest";

import { loadProjectConfig } from "../src/project-config.js";

describe("loadProjectConfig", () => {
  it("uses defaults when project environment variables are unset", () => {
    const config = loadProjectConfig({ env: {} });

    expect(config).toEqual({
      outputDir: "dist",
      storage: {
        originalPrefix: "originals"
      },
      sourceDir: "photos",
      title: "Gallery"
    });
  });

  it("loads gallery settings and storage public URL from environment variables", () => {
    const config = loadProjectConfig({
      env: {
        GALLERY_DESCRIPTION: "Seasonal field notes",
        GALLERY_OUTPUT_DIR: "public",
        GALLERY_SOURCE_DIR: "custom-photos",
        GALLERY_TITLE: "Field Gallery",
        S3_ORIGINAL_PREFIX: "archive",
        S3_PUBLIC_BASE_URL: "https://media.example.com"
      }
    });

    expect(config).toEqual({
      description: "Seasonal field notes",
      outputDir: "public",
      storage: {
        originalPrefix: "archive",
        publicBaseUrl: "https://media.example.com"
      },
      sourceDir: "custom-photos",
      title: "Field Gallery"
    });
  });
});

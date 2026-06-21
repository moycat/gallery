import { describe, expect, it } from "vitest";

import { defineGalleryConfig } from "../src/config.js";

describe("defineGalleryConfig", () => {
  it("fills deployment-friendly defaults for a photo gallery", () => {
    const config = defineGalleryConfig({ title: "Field Notes" });

    expect(config).toMatchObject({
      contentDir: "photos",
      outputDir: "dist",
      thumbnailDir: "assets/photos",
      title: "Field Notes"
    });
    expect(config.thumbnailSizes.map((size) => size.name)).toEqual(["small", "medium", "large"]);
  });

  it("rejects duplicate thumbnail size names", () => {
    expect(() =>
      defineGalleryConfig({
        title: "Duplicates",
        thumbnailSizes: [
          { name: "small", width: 320 },
          { name: "small", width: 640 }
        ]
      })
    ).toThrow("Thumbnail size names must be unique.");
  });
});

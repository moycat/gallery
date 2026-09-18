import { describe, expect, it } from "vitest";

import { versionedAssetPath } from "../src/asset-version.js";

describe("versionedAssetPath", () => {
  it.each(["css", "js"])("keeps the same %s URL for unchanged content", (extension) => {
    const path = `assets/gallery.${extension}`;
    const first = versionedAssetPath(path, "original content");

    expect(first).toMatch(new RegExp(`^assets/gallery\\.[a-f0-9]{16}\\.${extension}$`));
    expect(versionedAssetPath(path, "original content")).toBe(first);
  });

  it.each(["css", "js"])("changes the %s URL when its content changes", (extension) => {
    const path = `assets/gallery.${extension}`;

    expect(versionedAssetPath(path, "updated content")).not.toBe(
      versionedAssetPath(path, "original content")
    );
  });
});

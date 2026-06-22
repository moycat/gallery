import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { renderLineProgress, resolveStaticFilePath } from "../src/cli.js";

describe("resolveStaticFilePath", () => {
  const root = resolve("/tmp/gallery-dist");

  it("maps static page routes to index documents", () => {
    expect(resolveStaticFilePath(root, "/")).toBe(join(root, "index.html"));
    expect(resolveStaticFilePath(root, "/albums/")).toBe(join(root, "albums", "index.html"));
    expect(resolveStaticFilePath(root, "/albums")).toBe(join(root, "albums", "index.html"));
  });

  it("keeps asset file routes unchanged", () => {
    expect(resolveStaticFilePath(root, "/assets/gallery.css")).toBe(
      join(root, "assets", "gallery.css")
    );
  });

  it("rejects requests outside the static root", () => {
    expect(resolveStaticFilePath(root, "/../secret.txt")).toBeUndefined();
  });
});

describe("renderLineProgress", () => {
  it("renders stage-start placeholders", () => {
    expect(renderLineProgress({ completed: 0, label: "Indexing metadata", total: 2 }, 80)).toBe(
      "Indexing metadata [------------------------------]   0% 0/2"
    );
  });

  it("drops the current filename on completed lines", () => {
    expect(
      renderLineProgress(
        {
          completed: 1,
          current: "first",
          label: "Generating thumbnails",
          total: 2
        },
        80
      )
    ).toBe("Generating thumbnails [###############---------------]  50% 1/2 first");

    expect(
      renderLineProgress(
        {
          completed: 2,
          current: "second",
          label: "Generating thumbnails",
          total: 2
        },
        80
      )
    ).toBe("Generating thumbnails [##############################] 100% 2/2");
  });
});

import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveStaticFilePath } from "../src/cli.js";

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

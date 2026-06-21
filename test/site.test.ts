import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { buildStaticSite } from "../src/site.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe("buildStaticSite", () => {
  it("writes a Cloudflare Pages-ready index document", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "gallery-site-"));
    tempDirs.push(outputDir);

    await buildStaticSite({
      description: "Camera exports with <metadata>.",
      outputDir,
      title: "Moycat & Friends"
    });

    const html = await readFile(join(outputDir, "index.html"), "utf8");

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Moycat &amp; Friends</title>");
    expect(html).toContain("Camera exports with &lt;metadata&gt;.");
    expect(html).toContain('data-gallery-root="true"');
  });
});

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

import { buildGallery } from "../src/gallery-build.js";
import { writeFixtureImage } from "./fixtures.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function createTempWorkspace(): Promise<{ outputDir: string; sourceDir: string }> {
  const workspace = await mkdtemp(join(tmpdir(), "gallery-build-"));
  tempDirs.push(workspace);
  return {
    outputDir: join(workspace, "dist"),
    sourceDir: join(workspace, "photos")
  };
}

describe("buildGallery", () => {
  it("updates metadata, generates 1080px WebP thumbnails, copies originals, and renders album UI", async () => {
    const { outputDir, sourceDir } = await createTempWorkspace();
    await writeFixtureImage(join(sourceDir, "test.jpg"), { width: 1600, height: 900 });
    await writeFixtureImage(join(sourceDir, "abc", "haha.png"), {
      format: "png",
      width: 1200,
      height: 1200
    });
    await writeFile(join(sourceDir, "abc.yml"), "title: Album ABC\nweight: 1\n", "utf8");
    await writeFile(
      join(sourceDir, "abc", "haha.yml"),
      "title: Square Photo\ndescription: Album item\n",
      "utf8"
    );

    const result = await buildGallery({ outputDir, sourceDir, title: "Field Gallery" });

    expect(result.photos.map((photo) => photo.id)).toEqual(["abc-haha", "test"]);
    await expect(readFile(join(sourceDir, "test.yml"), "utf8")).resolves.toContain("# title:");

    const thumbnail = await sharp(join(outputDir, "assets", "photos", "abc-haha.webp")).metadata();
    expect(thumbnail).toMatchObject({ format: "webp", width: 1080, height: 1080 });

    const html = await readFile(join(outputDir, "index.html"), "utf8");
    expect(html).toContain("<title>Field Gallery</title>");
    expect(html).toContain("Album ABC");
    expect(html).toContain("Square Photo");
    expect(html).toContain("Album item");
    expect(html).toContain('href="assets/originals/abc-haha.png"');
    expect(html).toContain('src="assets/photos/abc-haha.webp"');
  });

  it("links originals to configured storage public URLs without copying originals into Pages output", async () => {
    const { outputDir, sourceDir } = await createTempWorkspace();
    await writeFixtureImage(join(sourceDir, "test.jpg"), { width: 1600, height: 900 });
    await writeFile(join(sourceDir, "test.yml"), "title: Root Photo\n", "utf8");

    await buildGallery({
      outputDir,
      storage: {
        originalPrefix: "published",
        publicBaseUrl: "https://media.example.com"
      },
      sourceDir,
      title: "Field Gallery"
    });

    const html = await readFile(join(outputDir, "index.html"), "utf8");
    expect(html).toContain("https://media.example.com/published/test-");
    await expect(
      readFile(join(outputDir, "assets", "originals", "test.jpg"), "utf8")
    ).rejects.toThrow("ENOENT");
  });
});

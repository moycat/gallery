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
  it("updates metadata, generates thumbnails, copies originals, and renders album routes", async () => {
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
    expect(html).toContain('href="/assets/originals/abc-haha.png"');
    expect(html).toContain('src="/assets/photos/abc-haha-medium.webp"');
    await expect(readFile(join(outputDir, "albums", "index.html"), "utf8")).resolves.toContain(
      "Album ABC"
    );
    await expect(
      readFile(join(outputDir, "albums", "abc", "index.html"), "utf8")
    ).resolves.toContain("Square Photo");
    expect(html).toContain('id="about"');
    expect(html).toContain('href="#about"');
    await expect(readFile(join(outputDir, "about", "index.html"), "utf8")).rejects.toThrow(
      "ENOENT"
    );
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

  it("copies shared static assets for the generated site", async () => {
    const { outputDir, sourceDir } = await createTempWorkspace();
    await writeFixtureImage(join(sourceDir, "test.jpg"));
    await writeFile(
      join(sourceDir, "test.yml"),
      "exif:\n  capturedAt: '2024-01-01T00:00:00Z'\n",
      "utf8"
    );

    await buildGallery({ outputDir, sourceDir, title: "Moycat Gallery" });

    await expect(readFile(join(outputDir, "assets", "gallery.css"), "utf8")).resolves.toContain(
      "font-family"
    );
    await expect(readFile(join(outputDir, "assets", "gallery.js"), "utf8")).resolves.toContain(
      "gallery-photo-data"
    );
    await expect(readFile(join(outputDir, "favicon.ico"))).resolves.toBeInstanceOf(Buffer);
    await expect(
      readFile(join(outputDir, "assets", "images", "avatar.webp"))
    ).resolves.toBeInstanceOf(Buffer);
    await expect(
      readFile(join(outputDir, "assets", "vendor", "fontawesome", "webfonts", "fa-solid-900.woff2"))
    ).resolves.toBeInstanceOf(Buffer);

    const manifest = JSON.parse(await readFile(join(outputDir, "site.webmanifest"), "utf8")) as {
      icons: { src: string }[];
    };

    for (const icon of manifest.icons) {
      await expect(readFile(join(outputDir, icon.src))).resolves.toBeInstanceOf(Buffer);
    }
  });

  it("sorts built photos by capture time descending and warns when capture time is missing", async () => {
    const { outputDir, sourceDir } = await createTempWorkspace();
    const warnings: string[] = [];
    await writeFixtureImage(join(sourceDir, "old.jpg"));
    await writeFixtureImage(join(sourceDir, "new.jpg"));
    await writeFixtureImage(join(sourceDir, "missing.jpg"));
    await writeFile(
      join(sourceDir, "old.yml"),
      "exif:\n  capturedAt: '2023-01-01T00:00:00Z'\n",
      "utf8"
    );
    await writeFile(
      join(sourceDir, "new.yml"),
      "exif:\n  capturedAt: '2024-01-01T00:00:00Z'\n",
      "utf8"
    );
    await writeFile(join(sourceDir, "missing.yml"), "title: Missing Date\n", "utf8");

    const result = await buildGallery({
      logger: { warn: (message) => warnings.push(message) },
      outputDir,
      sourceDir,
      title: "Moycat Gallery"
    });

    expect(result.photos.map((photo) => photo.id)).toEqual(["new", "old", "missing"]);
    expect(warnings).toEqual([expect.stringContaining("Missing EXIF capture time: missing")]);
  });

  it("generates thumbnail variants and records their dimensions", async () => {
    const { outputDir, sourceDir } = await createTempWorkspace();
    await writeFixtureImage(join(sourceDir, "wide.jpg"), { height: 900, width: 1600 });
    await writeFile(
      join(sourceDir, "wide.yml"),
      "exif:\n  capturedAt: '2024-01-01T00:00:00Z'\n",
      "utf8"
    );

    const result = await buildGallery({ outputDir, sourceDir, title: "Moycat Gallery" });
    const wide = result.photos[0];

    expect(wide?.thumbnails.map((thumbnail) => thumbnail.name)).toEqual([
      "small",
      "medium",
      "large"
    ]);
    expect(wide?.renderedWidth).toBeGreaterThan(wide?.renderedHeight ?? 0);
    await expect(
      readFile(join(outputDir, "assets", "photos", "wide-small.webp"))
    ).resolves.toBeInstanceOf(Buffer);
    await expect(
      readFile(join(outputDir, "assets", "photos", "wide-medium.webp"))
    ).resolves.toBeInstanceOf(Buffer);
    await expect(
      readFile(join(outputDir, "assets", "photos", "wide-large.webp"))
    ).resolves.toBeInstanceOf(Buffer);
  });

  it("validates configured album covers and falls back to the oldest album photo", async () => {
    const { outputDir, sourceDir } = await createTempWorkspace();
    await writeFixtureImage(join(sourceDir, "cats", "old.jpg"));
    await writeFixtureImage(join(sourceDir, "cats", "new.jpg"));
    await writeFile(join(sourceDir, "cats.yml"), "title: Cats\n", "utf8");
    await writeFile(
      join(sourceDir, "cats", "old.yml"),
      "exif:\n  capturedAt: '2022-01-01T00:00:00Z'\n",
      "utf8"
    );
    await writeFile(
      join(sourceDir, "cats", "new.yml"),
      "exif:\n  capturedAt: '2024-01-01T00:00:00Z'\n",
      "utf8"
    );

    const result = await buildGallery({ outputDir, sourceDir, title: "Moycat Gallery" });

    expect(result.albums[0]).toEqual(expect.objectContaining({ coverPhotoId: "cats-old" }));
  });

  it("rejects album covers that do not belong to the album", async () => {
    const { outputDir, sourceDir } = await createTempWorkspace();
    await writeFixtureImage(join(sourceDir, "cats", "miso.jpg"));
    await writeFixtureImage(join(sourceDir, "dogs", "momo.jpg"));
    await writeFile(join(sourceDir, "cats.yml"), "title: Cats\ncoverPhotoId: dogs-momo\n", "utf8");
    await writeFile(join(sourceDir, "dogs.yml"), "title: Dogs\n", "utf8");
    await writeFile(join(sourceDir, "cats", "miso.yml"), "title: Miso\n", "utf8");
    await writeFile(join(sourceDir, "dogs", "momo.yml"), "title: Momo\n", "utf8");

    await expect(buildGallery({ outputDir, sourceDir, title: "Moycat Gallery" })).rejects.toThrow(
      "Album cover photo dogs-momo is not in album cats"
    );
  });
});

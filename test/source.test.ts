import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { readGallerySource, updateGallerySource } from "../src/source.js";
import { writeFixtureImage } from "./fixtures.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function createTempSource(): Promise<string> {
  const sourceDir = await mkdtemp(join(tmpdir(), "gallery-source-"));
  tempDirs.push(sourceDir);
  return sourceDir;
}

describe("updateGallerySource", () => {
  it("creates missing album and photo metadata placeholders", async () => {
    const sourceDir = await createTempSource();
    await writeFixtureImage(join(sourceDir, "test.jpg"));
    await writeFixtureImage(join(sourceDir, "abc", "haha.png"), { format: "png" });

    const result = await updateGallerySource({ sourceDir });

    expect(result.created).toEqual([
      join(sourceDir, "abc.yml"),
      join(sourceDir, "abc", "haha.yml"),
      join(sourceDir, "test.yml")
    ]);
    await expect(readFile(join(sourceDir, "abc.yml"), "utf8")).resolves.toContain("title: abc");
    await expect(readFile(join(sourceDir, "abc.yml"), "utf8")).resolves.toContain(
      "# coverPhotoId: abc-haha"
    );
    await expect(readFile(join(sourceDir, "abc", "haha.yml"), "utf8")).resolves.toContain(
      "# title:"
    );
    await expect(readFile(join(sourceDir, "test.yml"), "utf8")).resolves.toContain("# exif:");
  });

  it("rejects metadata files that do not match an album or photo", async () => {
    const sourceDir = await createTempSource();
    await writeFile(join(sourceDir, "orphan.yml"), "title: Orphan\n", "utf8");

    await expect(updateGallerySource({ sourceDir })).rejects.toThrow(
      "Metadata file has no matching album or photo"
    );
  });

  it("rejects invalid album metadata", async () => {
    const sourceDir = await createTempSource();
    await writeFixtureImage(join(sourceDir, "abc", "haha.jpg"));
    await writeFile(join(sourceDir, "abc.yml"), "description: Missing title\n", "utf8");

    await expect(updateGallerySource({ sourceDir })).rejects.toThrow("Invalid album metadata");
  });

  it("creates album metadata placeholders with a documented cover field", async () => {
    const sourceDir = await createTempSource();
    await writeFixtureImage(join(sourceDir, "iphone", "IMG_0001.jpeg"));

    await updateGallerySource({ sourceDir });

    await expect(readFile(join(sourceDir, "iphone.yml"), "utf8")).resolves.toContain(
      "# coverPhotoId: iphone-IMG_0001"
    );
  });
});

describe("readGallerySource", () => {
  it("reads albums, photos, ids, sort order, and metadata", async () => {
    const sourceDir = await createTempSource();
    await writeFixtureImage(join(sourceDir, "test.jpg"));
    await writeFixtureImage(join(sourceDir, "abc", "haha.png"), { format: "png" });
    await writeFixtureImage(join(sourceDir, "later", "second.jpg"));
    await writeFile(
      join(sourceDir, "abc.yml"),
      ["title: Album ABC", "description: First album", "weight: 1", ""].join("\n"),
      "utf8"
    );
    await writeFile(join(sourceDir, "later.yml"), "title: Later Album\n", "utf8");
    await writeFile(
      join(sourceDir, "abc", "haha.yml"),
      [
        "title: Album Photo",
        "description: From an album",
        "exif:",
        "  capturedAt: '2024-05-01T12:00:00Z'",
        "  camera: X100VI",
        "  lens: 23mm",
        "  aperture: 2.8",
        "  shutterSpeed: 1/250",
        "  iso: 400",
        "  focalLengthMm: 23",
        "  location: Studio",
        "  latitude: 37.5",
        "  longitude: -122.5",
        ""
      ].join("\n"),
      "utf8"
    );
    await writeFile(join(sourceDir, "test.yml"), "title: Root Photo\n", "utf8");
    await writeFile(join(sourceDir, "later", "second.yml"), "# title:\n", "utf8");

    const gallery = await readGallerySource({ sourceDir });

    expect(gallery.albums.map((album) => album.id)).toEqual(["abc", "later"]);
    expect(gallery.photos.map((photo) => photo.id)).toEqual(["abc-haha", "later-second", "test"]);
    expect(gallery.photos.find((photo) => photo.id === "abc-haha")).toMatchObject({
      albumId: "abc",
      title: "Album Photo",
      exif: {
        camera: "X100VI",
        capturedAt: "2024-05-01T12:00:00Z",
        latitude: 37.5,
        location: "Studio"
      }
    });
    const rootPhoto = gallery.photos.find((photo) => photo.id === "test");
    expect(rootPhoto).toMatchObject({ title: "Root Photo" });
    expect(rootPhoto).not.toHaveProperty("albumId");
  });

  it("reads optional album cover photo ids", async () => {
    const sourceDir = await createTempSource();
    await writeFixtureImage(join(sourceDir, "cats", "miso.jpg"));
    await writeFile(
      join(sourceDir, "cats.yml"),
      ["title: Cats", "description: Cats at home", "coverPhotoId: cats-miso", ""].join("\n"),
      "utf8"
    );
    await writeFile(join(sourceDir, "cats", "miso.yml"), "title: Miso\n", "utf8");

    const gallery = await readGallerySource({ sourceDir });

    expect(gallery.albums).toEqual([
      expect.objectContaining({
        coverPhotoId: "cats-miso",
        description: "Cats at home",
        id: "cats",
        title: "Cats"
      })
    ]);
  });
});

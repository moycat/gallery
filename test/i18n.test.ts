import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildGallery } from "../src/gallery-build.js";
import { readGallerySource } from "../src/source.js";
import { localizeGallery, formatDate } from "../src/i18n.js";
import { loadProjectConfig } from "../src/project-config.js";
import { galleryCssPath, galleryJsPath } from "../src/site-assets.js";
import { writeFixtureImage } from "./fixtures.js";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.map((path) => rm(path, { recursive: true, force: true })));
  directories.length = 0;
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "gallery-i18n-"));
  directories.push(root);
  const sourceDir = join(root, "photos");
  await writeFixtureImage(join(sourceDir, "cats", "window.jpg"), { width: 16, height: 12 });
  await writeFile(
    join(sourceDir, "cats.yml"),
    "title: 猫\ndescription: 家里的猫\ntranslations:\n  ca:\n    title: Gats\n    description: Els gats de casa\n"
  );
  await writeFile(
    join(sourceDir, "cats", "window.yml"),
    'title: 窗边\ndescription: 午后的阳光\nexif:\n  capturedAt: "2024-05-01T12:00:00Z"\n  location: 家里\ntranslations:\n  ca:\n    title: A la finestra\n    description: La llum del sol a la tarda\n    location: A casa\n'
  );
  return { sourceDir, outputDir: join(root, "dist"), cacheDir: join(root, "cache") };
}

describe("bilingual gallery", () => {
  it("builds paired localized routes with shared photos, assets, and album identities", async () => {
    const options = await fixture();
    const gallery = await buildGallery(options);
    const localized = localizeGallery(gallery, "ca");
    expect(gallery.albums[0]?.title).toBe("猫");
    expect(localized.albums[0]?.title).toBe("Gats");
    expect(localized.photos.map((photo) => photo.id)).toEqual(
      gallery.photos.map((photo) => photo.id)
    );
    expect(localized.photos[0]?.thumbnails).toEqual(gallery.photos[0]?.thumbnails);
    expect(localized.photos[0]?.originalPath).toBe(gallery.photos[0]?.originalPath);
    for (const path of ["", "albums/", "albums/cats/"]) {
      const zh = await readFile(join(options.outputDir, path, "index.html"), "utf8");
      const ca = await readFile(join(options.outputDir, "ca", path, "index.html"), "utf8");
      expect(zh).toContain('<html lang="zh-Hans">');
      expect(ca).toContain('<html lang="ca">');
      expect(ca).toContain('name="robots" content="noindex, follow"');
      expect(zh).not.toContain('content="noindex, follow"');
      expect(ca).toContain(`href="/${path}" lang="zh-Hans"`);
      expect(zh).toContain(`href="/ca/${path}" lang="ca"`);
      expect(ca).toContain('href="https://blog.moy.cat/ca/"');
      expect(ca).toContain('href="/ca/albums/"');
      expect(ca).toContain("/ca/albums/cats/");
      expect(ca).toContain("Gats");
      expect(ca).not.toContain("家里的猫");
      expect(ca).not.toContain("窗边");
      expect(ca).not.toContain("午后的阳光");
      for (const html of [zh, ca]) {
        expect(html).toContain(`href="/${galleryCssPath}"`);
        expect(html).toContain(`src="/${galleryJsPath}"`);
        expect(html).toContain("/assets/photos/cats-window-");
      }
    }
    const ca = await readFile(join(options.outputDir, "ca/albums/cats/index.html"), "utf8");
    expect(ca).toContain("A la finestra");
    expect(ca).toContain("La llum del sol a la tarda");
    expect(ca).toContain("A casa");
    expect(ca).toContain("1 de maig del 2024");
    expect(ca.match(/<dialog[\s\S]*?<\/dialog>/)?.[0]).toContain('class="language-switch"');
    expect(await readdir(join(options.outputDir, "ca"))).toEqual(
      expect.not.arrayContaining(["assets"])
    );
    expect(await readFile(join(options.outputDir, "robots.txt"), "utf8")).toBe(
      "User-agent: *\nDisallow: /ca/\nDisallow: /ca$\n"
    );
  });
  it("validates translated metadata keys and nonempty strings", async () => {
    const options = await fixture();
    for (const invalid of [
      'translations:\n  ca:\n    title: ""\n',
      "translations:\n  ca:\n    typo: bad\n"
    ]) {
      await writeFile(join(options.sourceDir, "cats", "window.yml"), invalid);
      await expect(readGallerySource(options)).rejects.toThrow("Invalid photo metadata");
    }
  });
  it("supports customized Catalan project text and stable date formatting", () => {
    expect(
      loadProjectConfig({
        env: { GALLERY_TITLE_CA: "Les meves fotos", GALLERY_DESCRIPTION_CA: "Records" }
      }).translations
    ).toEqual({ ca: { title: "Les meves fotos", description: "Records" } });
    expect(formatDate(undefined, "ca")).toBeUndefined();
    expect(formatDate("invalid", "ca")).toBeUndefined();
    expect(formatDate("2024-05-01T23:00:00Z", "ca")).toBe("1 de maig del 2024");
  });
});

import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

import { readGallerySource, updateGallerySource } from "./source.js";
import { renderGalleryDocument } from "./site.js";
import type { BuiltGallery, BuiltGalleryPhoto } from "./types.js";

export interface GalleryBuildOptions {
  outputDir?: string;
  sourceDir?: string;
  title?: string;
  description?: string;
}

export async function buildGallery(options: GalleryBuildOptions = {}): Promise<BuiltGallery> {
  const outputDir = options.outputDir ?? "dist";
  const sourceDir = options.sourceDir ?? "photos";
  const title = options.title ?? "Gallery";

  await updateGallerySource({ sourceDir });

  const source = await readGallerySource({ sourceDir });
  const thumbnailDir = join(outputDir, "assets", "photos");
  const originalDir = join(outputDir, "assets", "originals");

  await mkdir(thumbnailDir, { recursive: true });
  await mkdir(originalDir, { recursive: true });

  const photos = await Promise.all(
    source.photos.map(async (photo): Promise<BuiltGalleryPhoto> => {
      const thumbnailPath = `assets/photos/${photo.id}.webp`;
      const originalPath = `assets/originals/${photo.id}.${photo.originalExtension}`;

      await sharp(photo.sourcePath)
        .rotate()
        .resize({ width: 1080, height: 1080, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(join(outputDir, thumbnailPath));
      await copyFile(photo.sourcePath, join(outputDir, originalPath));

      return {
        ...photo,
        originalPath,
        thumbnailPath
      };
    })
  );

  const gallery: BuiltGallery = {
    albums: source.albums,
    photos,
    title,
    unalbumedPhotoIds: source.unalbumedPhotoIds,
    ...(options.description === undefined ? {} : { description: options.description })
  };

  await writeFile(join(outputDir, "index.html"), renderGalleryDocument(gallery), "utf8");

  return gallery;
}

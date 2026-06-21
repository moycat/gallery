import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import sharp, { type OutputInfo, type Sharp } from "sharp";

import { writeStaticAssets } from "./assets.js";
import { defaultThumbnailSizes } from "./config.js";
import {
  comparePhotosByCapturedAtDescending,
  mergePhotoExif,
  readImageExif,
  selectOldestPhoto
} from "./exif.js";
import { getOriginalObjectInfo } from "./originals.js";
import { readGallerySource, updateGallerySource } from "./source.js";
import { renderAlbumDocument, renderAlbumsDocument, renderGalleryDocument } from "./site.js";
import type {
  BuiltGallery,
  BuiltGalleryAlbum,
  BuiltGalleryPhoto,
  BuiltGalleryThumbnail,
  GallerySourcePhoto,
  ThumbnailSize
} from "./types.js";

interface GalleryBuildLogger {
  warn(message: string): void;
}

export interface GalleryBuildOptions {
  description?: string;
  logger?: GalleryBuildLogger;
  outputDir?: string;
  storage?: {
    originalPrefix: string;
    publicBaseUrl?: string | undefined;
  };
  sourceDir?: string;
  title?: string;
  useLocalOriginals?: boolean;
}

export async function buildGallery(options: GalleryBuildOptions = {}): Promise<BuiltGallery> {
  const outputDir = options.outputDir ?? "dist";
  const sourceDir = options.sourceDir ?? "photos";
  const title = options.title ?? "末影画廊";
  const logger = options.logger ?? console;

  await updateGallerySource({ sourceDir });

  const source = await readGallerySource({ sourceDir });
  const thumbnailDir = join(outputDir, "assets", "photos");
  const originalDir = join(outputDir, "assets", "originals");
  const remoteOriginals =
    options.useLocalOriginals !== true && options.storage?.publicBaseUrl !== undefined
      ? {
          originalPrefix: options.storage.originalPrefix,
          publicBaseUrl: options.storage.publicBaseUrl
        }
      : undefined;

  await mkdir(thumbnailDir, { recursive: true });

  if (remoteOriginals === undefined) {
    await mkdir(originalDir, { recursive: true });
  }

  await writeStaticAssets(outputDir);

  const photos = (
    await Promise.all(
      source.photos.map((photo) =>
        enrichPhoto(photo, {
          logger,
          outputDir,
          remoteOriginals
        })
      )
    )
  ).sort(comparePhotosByCapturedAtDescending);
  const photoById = new Map(photos.map((photo) => [photo.id, photo]));
  const albums = source.albums.map((album): BuiltGalleryAlbum => {
    const albumPhotos = album.photoIds
      .map((photoId) => photoById.get(photoId))
      .filter((photo): photo is BuiltGalleryPhoto => photo !== undefined);
    const fallbackCover = selectOldestPhoto(albumPhotos)?.id;
    const coverPhotoId = album.coverPhotoId ?? fallbackCover;

    if (album.coverPhotoId !== undefined && !album.photoIds.includes(album.coverPhotoId)) {
      throw new Error(`Album cover photo ${album.coverPhotoId} is not in album ${album.id}`);
    }

    return {
      ...album,
      pagePath: `albums/${album.id}/`,
      ...(coverPhotoId === undefined ? {} : { coverPhotoId })
    };
  });

  const gallery: BuiltGallery = {
    albums,
    photos,
    title,
    unalbumedPhotoIds: source.unalbumedPhotoIds,
    ...(options.description === undefined ? {} : { description: options.description })
  };

  await writeFile(join(outputDir, "index.html"), renderGalleryDocument(gallery), "utf8");
  await mkdir(join(outputDir, "albums"), { recursive: true });
  await writeFile(join(outputDir, "albums", "index.html"), renderAlbumsDocument(gallery), "utf8");

  for (const album of gallery.albums) {
    const albumDir = join(outputDir, "albums", album.id);
    await mkdir(albumDir, { recursive: true });
    await writeFile(join(albumDir, "index.html"), renderAlbumDocument(gallery, album), "utf8");
  }

  return gallery;
}

async function enrichPhoto(
  photo: GallerySourcePhoto,
  options: {
    logger: GalleryBuildLogger;
    outputDir: string;
    remoteOriginals:
      | {
          originalPrefix: string;
          publicBaseUrl: string;
        }
      | undefined;
  }
): Promise<BuiltGalleryPhoto> {
  const fileExif = await readImageExif(photo.sourcePath);
  const exif = mergePhotoExif(fileExif, photo.exif);
  const capturedAt = exif.capturedAt;
  const captureTimestamp = capturedAt === undefined ? undefined : Date.parse(capturedAt);
  const captureFields =
    capturedAt === undefined || captureTimestamp === undefined || !Number.isFinite(captureTimestamp)
      ? {}
      : { capturedAt, captureTimestamp };
  const thumbnails = await generateThumbnails(photo, options.outputDir);
  const largestThumbnail =
    thumbnails.find((thumbnail) => thumbnail.name === "large") ?? thumbnails.at(-1);
  const thumbnailPath = `assets/photos/${photo.id}.webp`;
  const localOriginalPath = `assets/originals/${photo.id}.${photo.originalExtension}`;
  const finalOriginalPath =
    options.remoteOriginals === undefined
      ? localOriginalPath
      : ((await getOriginalObjectInfo(photo, options.remoteOriginals)).url ?? localOriginalPath);

  await sharp(photo.sourcePath)
    .rotate()
    .resize({ fit: "inside", height: 1080, width: 1080, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(join(options.outputDir, thumbnailPath));

  if (options.remoteOriginals === undefined) {
    await copyFile(photo.sourcePath, join(options.outputDir, localOriginalPath));
  }

  if (
    capturedAt === undefined ||
    captureTimestamp === undefined ||
    !Number.isFinite(captureTimestamp)
  ) {
    options.logger.warn(`Missing EXIF capture time: ${photo.id}`);
  }

  return {
    ...photo,
    exif,
    originalPath: finalOriginalPath,
    ...captureFields,
    ...(largestThumbnail === undefined
      ? {}
      : {
          renderedHeight: largestThumbnail.height,
          renderedWidth: largestThumbnail.width
        }),
    thumbnailPath,
    thumbnails
  };
}

async function generateThumbnails(
  photo: GallerySourcePhoto,
  outputDir: string
): Promise<BuiltGalleryThumbnail[]> {
  const thumbnails: BuiltGalleryThumbnail[] = [];

  for (const size of defaultThumbnailSizes) {
    const path = `assets/photos/${photo.id}-${size.name}.${size.format}`;
    const image = sharp(photo.sourcePath).rotate().resize({
      fit: "inside",
      height: size.height,
      width: size.width,
      withoutEnlargement: true
    });
    const info = await writeThumbnail(image, join(outputDir, path), size.format);

    thumbnails.push({
      format: size.format,
      height: info.height,
      name: size.name,
      path,
      width: info.width
    });
  }

  return thumbnails;
}

function writeThumbnail(
  image: Sharp,
  path: string,
  format: ThumbnailSize["format"]
): Promise<OutputInfo> {
  switch (format) {
    case "avif":
      return image.avif({ quality: 72 }).toFile(path);
    case "jpeg":
      return image.jpeg({ quality: 84 }).toFile(path);
    case "webp":
      return image.webp({ quality: 82 }).toFile(path);
  }
}

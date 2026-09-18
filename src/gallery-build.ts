import { createHash, randomUUID } from "node:crypto";
import { access, copyFile, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import sharp, { type Sharp } from "sharp";

import { writeStaticAssets } from "./assets.js";
import { defaultThumbnailSizes } from "./config.js";
import {
  comparePhotosByCapturedAtDescending,
  mergePhotoExif,
  readImageExif,
  selectOldestPhoto
} from "./exif.js";
import { getOriginalObjectInfo, hashFile } from "./originals.js";
import { readGallerySource, updateGallerySource, type GallerySourceProgress } from "./source.js";
import { renderAlbumDocument, renderAlbumsDocument, renderGalleryDocument } from "./site.js";
import type {
  ContentTranslations,
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
  translations?: ContentTranslations;
  cacheDir?: string;
  description?: string;
  logger?: GalleryBuildLogger;
  onProgress?: ((progress: GalleryBuildProgress) => void) | undefined;
  outputDir?: string;
  storage?: {
    originalPrefix: string;
    publicBaseUrl?: string | undefined;
  };
  sourceDir?: string;
  title?: string;
  useLocalOriginals?: boolean;
}

export interface GalleryBuildProgress {
  completed: number;
  stage: "metadata" | "photos";
  total: number;
  current?: string;
}

export async function buildGallery(options: GalleryBuildOptions = {}): Promise<BuiltGallery> {
  const cacheDir = options.cacheDir ?? ".gallery-cache";
  const outputDir = options.outputDir ?? "dist";
  const sourceDir = options.sourceDir ?? "photos";
  const title = options.title ?? "末影画廊";
  const logger = options.logger ?? console;

  await updateGallerySource({ sourceDir });

  const source = await readGallerySource({
    onProgress: (progress) => emitBuildProgress(options.onProgress, "metadata", progress),
    sourceDir
  });
  emitBuildProgress(options.onProgress, "photos", { completed: 0, total: source.photos.length });
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

  let completedPhotos = 0;
  const totalPhotos = source.photos.length;
  const photos = (
    await Promise.all(
      source.photos.map(async (photo) => {
        const builtPhoto = await enrichPhoto(photo, {
          cacheDir,
          logger,
          outputDir,
          remoteOriginals
        });
        completedPhotos += 1;
        emitBuildProgress(options.onProgress, "photos", {
          completed: completedPhotos,
          current: photo.id,
          total: totalPhotos
        });
        return builtPhoto;
      })
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
    ...(options.translations === undefined ? {} : { translations: options.translations }),
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

  await mkdir(join(outputDir, "ca", "albums"), { recursive: true });
  await writeFile(
    join(outputDir, "ca", "index.html"),
    renderGalleryDocument(gallery, "ca"),
    "utf8"
  );
  await writeFile(
    join(outputDir, "ca", "albums", "index.html"),
    renderAlbumsDocument(gallery, "ca"),
    "utf8"
  );
  for (const album of gallery.albums) {
    const albumDir = join(outputDir, "ca", "albums", album.id);
    await mkdir(albumDir, { recursive: true });
    await writeFile(
      join(albumDir, "index.html"),
      renderAlbumDocument(gallery, album, "ca"),
      "utf8"
    );
  }
  await writeFile(
    join(outputDir, "robots.txt"),
    "User-agent: *\nDisallow: /ca/\nDisallow: /ca$\n",
    "utf8"
  );

  return gallery;
}

function emitBuildProgress(
  onProgress: ((progress: GalleryBuildProgress) => void) | undefined,
  stage: GalleryBuildProgress["stage"],
  progress: GallerySourceProgress
): void {
  onProgress?.({
    completed: progress.completed,
    stage,
    total: progress.total,
    ...(progress.current === undefined ? {} : { current: progress.current })
  });
}

async function enrichPhoto(
  photo: GallerySourcePhoto,
  options: {
    cacheDir: string;
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
  const sourceHash = await hashFile(photo.sourcePath);
  const thumbnails = await generateThumbnails(photo, {
    cacheDir: options.cacheDir,
    outputDir: options.outputDir,
    sourceHash
  });
  const largestThumbnail =
    thumbnails.find((thumbnail) => thumbnail.name === "large") ?? thumbnails.at(-1);
  const thumbnailPath = `assets/photos/${photo.id}.webp`;
  const localOriginalPath = `assets/originals/${photo.id}.${photo.originalExtension}`;
  const finalOriginalPath =
    options.remoteOriginals === undefined
      ? localOriginalPath
      : ((await getOriginalObjectInfo(photo, options.remoteOriginals, sourceHash)).url ??
        localOriginalPath);

  await writeCachedThumbnail(
    sharp(photo.sourcePath)
      .rotate()
      .resize({ fit: "inside", height: 1080, width: 1080, withoutEnlargement: true }),
    {
      cacheDir: options.cacheDir,
      format: "webp",
      height: 1080,
      outputDir: options.outputDir,
      path: thumbnailPath,
      photoId: photo.id,
      quality: 82,
      sourceHash,
      variant: "main",
      width: 1080
    }
  );

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
  options: {
    cacheDir: string;
    outputDir: string;
    sourceHash: string;
  }
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
    const quality = thumbnailQuality(size.format);
    const info = await writeCachedThumbnail(image, {
      cacheDir: options.cacheDir,
      format: size.format,
      ...(size.height === undefined ? {} : { height: size.height }),
      outputDir: options.outputDir,
      path,
      photoId: photo.id,
      quality,
      sourceHash: options.sourceHash,
      variant: size.name,
      width: size.width
    });

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

interface CachedThumbnailOptions {
  cacheDir: string;
  format: ThumbnailSize["format"];
  outputDir: string;
  path: string;
  photoId: string;
  quality: number;
  sourceHash: string;
  variant: string;
  width: number;
  height?: number;
}

interface ThumbnailDimensions {
  height: number;
  width: number;
}

async function writeCachedThumbnail(
  image: Sharp,
  options: CachedThumbnailOptions
): Promise<ThumbnailDimensions> {
  const cachePath = buildThumbnailCachePath(options);
  const outputPath = join(options.outputDir, options.path);

  await mkdir(dirname(cachePath), { recursive: true });
  await mkdir(dirname(outputPath), { recursive: true });

  const cachedDimensions = await readCachedThumbnailDimensions(cachePath);

  if (cachedDimensions !== undefined) {
    await copyFile(cachePath, outputPath);
    return cachedDimensions;
  }

  const temporaryCachePath = `${cachePath}.${process.pid}.${randomUUID()}.tmp`;
  let info;

  try {
    info = await writeThumbnail(image, temporaryCachePath, options.format, options.quality);
    await rename(temporaryCachePath, cachePath);
  } catch (error) {
    await rm(temporaryCachePath, { force: true });
    throw error;
  }

  await copyFile(cachePath, outputPath);

  return {
    height: info.height,
    width: info.width
  };
}

function buildThumbnailCachePath(options: CachedThumbnailOptions): string {
  const label = sanitizeCacheLabel(`${options.photoId}-${options.variant}`);
  const transformHash = createHash("sha256")
    .update(
      JSON.stringify({
        version: 1,
        fit: "inside",
        format: options.format,
        height: options.height ?? null,
        quality: options.quality,
        rotate: true,
        sourceHash: options.sourceHash,
        width: options.width,
        withoutEnlargement: true
      })
    )
    .digest("hex");
  const filename = [label, options.sourceHash, transformHash].join("-");

  return join(options.cacheDir, "thumbnails", `${filename}.${options.format}`);
}

function sanitizeCacheLabel(value: string): string {
  return value.replace(/[^a-z0-9._-]+/giu, "_");
}

async function readThumbnailDimensions(path: string): Promise<ThumbnailDimensions> {
  const metadata = await sharp(path).metadata();

  if (metadata.height === undefined || metadata.width === undefined) {
    throw new Error(`Cached thumbnail has no dimensions: ${path}`);
  }

  return {
    height: metadata.height,
    width: metadata.width
  };
}

async function readCachedThumbnailDimensions(
  path: string
): Promise<ThumbnailDimensions | undefined> {
  if (!(await fileExists(path))) {
    return undefined;
  }

  try {
    return await readThumbnailDimensions(path);
  } catch {
    await rm(path, { force: true });
    return undefined;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function writeThumbnail(
  image: Sharp,
  path: string,
  format: ThumbnailSize["format"],
  quality: number
) {
  switch (format) {
    case "avif":
      return image.avif({ quality }).toFile(path);
    case "jpeg":
      return image.jpeg({ quality }).toFile(path);
    case "webp":
      return image.webp({ quality }).toFile(path);
  }
}

function thumbnailQuality(format: ThumbnailSize["format"]): number {
  switch (format) {
    case "avif":
      return 72;
    case "jpeg":
      return 84;
    case "webp":
      return 82;
  }
}

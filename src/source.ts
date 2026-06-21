import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";

import { parse as parseYaml } from "yaml";
import { z } from "zod";

import type { GallerySource, GallerySourceAlbum, GallerySourcePhoto, PhotoExif } from "./types.js";

export interface GallerySourceOptions {
  sourceDir?: string;
}

export interface GallerySourceUpdateResult {
  albums: number;
  created: string[];
  photos: number;
}

interface SourceInventory {
  albumDirs: AlbumDirectory[];
  albumMetadataPaths: Set<string>;
  albumPhotoMetadataPaths: Set<string>;
  photos: SourcePhotoFile[];
  rootMetadataFiles: string[];
  rootPhotoMetadataPaths: Set<string>;
}

interface AlbumDirectory {
  id: string;
  metadataPath: string;
  sourceDir: string;
}

interface SourcePhotoFile {
  id: string;
  metadataPath: string;
  originalExtension: "jpg" | "jpeg" | "png";
  originalFilename: string;
  sourcePath: string;
  albumId?: string;
}

const defaultSourceDir = "photos";
const imageExtensions = new Set([".jpg", ".jpeg", ".png"]);
const metadataExtension = ".yml";

const nonEmptyStringSchema = z.string().trim().min(1);
const optionalTextSchema = nonEmptyStringSchema.optional();

const exifSchema = z
  .object({
    aperture: z.number().positive().optional(),
    camera: optionalTextSchema,
    capturedAt: optionalTextSchema,
    focalLengthMm: z.number().positive().optional(),
    iso: z.number().int().positive().optional(),
    latitude: z.number().gte(-90).lte(90).optional(),
    lens: optionalTextSchema,
    location: optionalTextSchema,
    longitude: z.number().gte(-180).lte(180).optional(),
    shutterSpeed: optionalTextSchema
  })
  .strict();

const albumMetadataSchema = z
  .object({
    coverPhotoId: optionalTextSchema,
    description: optionalTextSchema,
    title: nonEmptyStringSchema,
    weight: z.number().finite().optional()
  })
  .strict();

const photoMetadataSchema = z
  .object({
    description: optionalTextSchema,
    exif: exifSchema.optional(),
    title: optionalTextSchema
  })
  .strict();

type PhotoMetadataInput = {
  description?: string;
  exif?: PhotoExif;
  title?: string;
};

type AlbumMetadataInput = {
  coverPhotoId?: string;
  description?: string;
  title: string;
  weight?: number;
};

export async function updateGallerySource(
  options: GallerySourceOptions = {}
): Promise<GallerySourceUpdateResult> {
  const sourceDir = options.sourceDir ?? defaultSourceDir;
  const inventory = await collectInventory(sourceDir);
  const expectedMetadataPaths = [
    ...inventory.albumMetadataPaths,
    ...inventory.albumPhotoMetadataPaths,
    ...inventory.rootPhotoMetadataPaths
  ].sort();
  const created: string[] = [];

  for (const metadataPath of expectedMetadataPaths) {
    if (!(await fileExists(metadataPath))) {
      const album = inventory.albumDirs.find((item) => item.metadataPath === metadataPath);
      const coverPhotoId =
        album === undefined
          ? undefined
          : inventory.photos
              .filter((photo) => photo.albumId === album.id)
              .map((photo) => photo.id)
              .sort(compareText)[0];
      const content =
        album === undefined
          ? createPhotoMetadataPlaceholder()
          : createAlbumMetadataPlaceholder(album.id, coverPhotoId);

      await writeFile(metadataPath, content, "utf8");
      created.push(metadataPath);
    }
  }

  await validateMetadataFiles(inventory);

  return {
    albums: inventory.albumDirs.length,
    created,
    photos: inventory.photos.length
  };
}

export async function readGallerySource(
  options: GallerySourceOptions = {}
): Promise<GallerySource> {
  const sourceDir = options.sourceDir ?? defaultSourceDir;
  const inventory = await collectInventory(sourceDir);
  await validateMetadataFiles(inventory);

  const albums = await Promise.all(
    inventory.albumDirs.map(async (album): Promise<GallerySourceAlbum> => {
      const metadata = await readAlbumMetadata(album.metadataPath);
      const photoIds = inventory.photos
        .filter((photo) => photo.albumId === album.id)
        .map((photo) => photo.id)
        .sort(compareText);

      return {
        id: album.id,
        metadataPath: album.metadataPath,
        photoIds,
        sourceDir: album.sourceDir,
        title: metadata.title,
        ...(metadata.coverPhotoId === undefined ? {} : { coverPhotoId: metadata.coverPhotoId }),
        ...(metadata.description === undefined ? {} : { description: metadata.description }),
        ...(metadata.weight === undefined ? {} : { weight: metadata.weight })
      };
    })
  );

  const photos = await Promise.all(
    inventory.photos.map(async (photo): Promise<GallerySourcePhoto> => {
      const metadata = await readPhotoMetadata(photo.metadataPath);

      return {
        id: photo.id,
        metadataPath: photo.metadataPath,
        originalExtension: photo.originalExtension,
        originalFilename: photo.originalFilename,
        sourcePath: photo.sourcePath,
        ...(photo.albumId === undefined ? {} : { albumId: photo.albumId }),
        ...(metadata.description === undefined ? {} : { description: metadata.description }),
        ...(metadata.exif === undefined ? {} : { exif: metadata.exif }),
        ...(metadata.title === undefined ? {} : { title: metadata.title })
      };
    })
  );

  return {
    albums: albums.sort(compareAlbums),
    photos: photos.sort((left, right) => compareText(left.id, right.id)),
    unalbumedPhotoIds: photos
      .filter((photo) => photo.albumId === undefined)
      .map((photo) => photo.id)
      .sort(compareText)
  };
}

async function collectInventory(sourceDir: string): Promise<SourceInventory> {
  await mkdir(sourceDir, { recursive: true });

  const albumDirs: AlbumDirectory[] = [];
  const albumMetadataPaths = new Set<string>();
  const albumPhotoMetadataPaths = new Set<string>();
  const photos: SourcePhotoFile[] = [];
  const rootMetadataFiles: string[] = [];
  const rootPhotoMetadataPaths = new Set<string>();
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = join(sourceDir, entry.name);

    if (entry.isDirectory()) {
      const albumId = entry.name;
      const metadataPath = join(sourceDir, `${albumId}${metadataExtension}`);
      const album = { id: albumId, metadataPath, sourceDir: entryPath };
      albumDirs.push(album);
      albumMetadataPaths.add(metadataPath);
      photos.push(...(await collectAlbumPhotos(album)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (isYamlFile(entry.name)) {
      rootMetadataFiles.push(entryPath);
      continue;
    }

    if (isImageFile(entry.name)) {
      const photo = createPhotoFile(entryPath);
      photos.push(photo);
      rootPhotoMetadataPaths.add(photo.metadataPath);
    }
  }

  for (const photo of photos) {
    if (photo.albumId !== undefined) {
      albumPhotoMetadataPaths.add(photo.metadataPath);
    }
  }

  assertUniquePhotoIds(photos);

  return {
    albumDirs: albumDirs.sort((left, right) => compareText(left.id, right.id)),
    albumMetadataPaths,
    albumPhotoMetadataPaths,
    photos: photos.sort((left, right) => compareText(left.id, right.id)),
    rootMetadataFiles: rootMetadataFiles.sort(compareText),
    rootPhotoMetadataPaths
  };
}

async function collectAlbumPhotos(album: AlbumDirectory): Promise<SourcePhotoFile[]> {
  const entries = await readdir(album.sourceDir, { withFileTypes: true });
  const photos: SourcePhotoFile[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith(".") || !isImageFile(entry.name)) {
      continue;
    }

    photos.push(createPhotoFile(join(album.sourceDir, entry.name), album.id));
  }

  return photos;
}

function createPhotoFile(sourcePath: string, albumId?: string): SourcePhotoFile {
  const originalFilename = basename(sourcePath);
  const stem = basename(originalFilename, extname(originalFilename));
  const extension = extname(originalFilename).slice(1).toLowerCase() as "jpg" | "jpeg" | "png";
  const id = albumId === undefined ? stem : `${albumId}-${stem}`;

  return {
    id,
    metadataPath: join(sourcePath, "..", `${stem}${metadataExtension}`),
    originalExtension: extension,
    originalFilename,
    sourcePath,
    ...(albumId === undefined ? {} : { albumId })
  };
}

async function validateMetadataFiles(inventory: SourceInventory): Promise<void> {
  const rootExpected = new Set([
    ...inventory.albumMetadataPaths,
    ...inventory.rootPhotoMetadataPaths
  ]);

  for (const metadataPath of inventory.rootMetadataFiles) {
    if (!rootExpected.has(metadataPath)) {
      throw new Error(`Metadata file has no matching album or photo: ${metadataPath}`);
    }
  }

  for (const album of inventory.albumDirs) {
    const entries = await readdir(album.sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !isYamlFile(entry.name)) {
        continue;
      }

      const metadataPath = join(album.sourceDir, entry.name);

      if (!inventory.albumPhotoMetadataPaths.has(metadataPath)) {
        throw new Error(`Metadata file has no matching album or photo: ${metadataPath}`);
      }
    }
  }

  await Promise.all([...inventory.albumMetadataPaths].map((path) => readAlbumMetadata(path)));
  await Promise.all(
    [...inventory.rootPhotoMetadataPaths, ...inventory.albumPhotoMetadataPaths].map((path) =>
      readPhotoMetadata(path)
    )
  );
}

async function readAlbumMetadata(path: string): Promise<AlbumMetadataInput> {
  const value = await readYamlFile(path, "album");
  const parsed = albumMetadataSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error(`Invalid album metadata: ${relative(process.cwd(), path)}`);
  }

  return {
    ...(parsed.data.coverPhotoId === undefined ? {} : { coverPhotoId: parsed.data.coverPhotoId }),
    title: parsed.data.title,
    ...(parsed.data.description === undefined ? {} : { description: parsed.data.description }),
    ...(parsed.data.weight === undefined ? {} : { weight: parsed.data.weight })
  };
}

async function readPhotoMetadata(path: string): Promise<PhotoMetadataInput> {
  const value = await readYamlFile(path, "photo");
  const parsed = photoMetadataSchema.safeParse(value ?? {});

  if (!parsed.success) {
    throw new Error(`Invalid photo metadata: ${relative(process.cwd(), path)}`);
  }

  return {
    ...(parsed.data.description === undefined ? {} : { description: parsed.data.description }),
    ...(parsed.data.exif === undefined ? {} : { exif: normalizeExif(parsed.data.exif) }),
    ...(parsed.data.title === undefined ? {} : { title: parsed.data.title })
  };
}

function normalizeExif(exif: z.infer<typeof exifSchema>): PhotoExif {
  return {
    ...(exif.aperture === undefined ? {} : { aperture: exif.aperture }),
    ...(exif.camera === undefined ? {} : { camera: exif.camera }),
    ...(exif.capturedAt === undefined ? {} : { capturedAt: exif.capturedAt }),
    ...(exif.focalLengthMm === undefined ? {} : { focalLengthMm: exif.focalLengthMm }),
    ...(exif.iso === undefined ? {} : { iso: exif.iso }),
    ...(exif.latitude === undefined ? {} : { latitude: exif.latitude }),
    ...(exif.lens === undefined ? {} : { lens: exif.lens }),
    ...(exif.location === undefined ? {} : { location: exif.location }),
    ...(exif.longitude === undefined ? {} : { longitude: exif.longitude }),
    ...(exif.shutterSpeed === undefined ? {} : { shutterSpeed: exif.shutterSpeed })
  };
}

async function readYamlFile(path: string, kind: "album" | "photo"): Promise<unknown> {
  let source: string;

  try {
    source = await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      if (kind === "photo") {
        return {};
      }
    }

    throw error;
  }

  try {
    return parseYaml(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${kind} metadata YAML: ${relative(process.cwd(), path)}: ${message}`, {
      cause: error
    });
  }
}

function createAlbumMetadataPlaceholder(albumId: string, coverPhotoId?: string): string {
  return [
    `title: ${albumId}`,
    "# description: Album description",
    coverPhotoId === undefined
      ? "# coverPhotoId: album-photo-id"
      : `# coverPhotoId: ${coverPhotoId}`,
    "# weight: 0",
    ""
  ].join("\n");
}

function createPhotoMetadataPlaceholder(): string {
  return [
    "# title: Photo title",
    "# description: Photo description",
    "# exif:",
    "#   capturedAt: '2024-01-01T00:00:00Z'",
    "#   camera: Camera body",
    "#   lens: Lens",
    "#   aperture: 2.8",
    "#   shutterSpeed: 1/250",
    "#   iso: 400",
    "#   focalLengthMm: 35",
    "#   location: Location name",
    "#   latitude: 0",
    "#   longitude: 0",
    ""
  ].join("\n");
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function assertUniquePhotoIds(photos: SourcePhotoFile[]): void {
  const seen = new Set<string>();

  for (const photo of photos) {
    if (seen.has(photo.id)) {
      throw new Error(`Duplicate photo id: ${photo.id}`);
    }

    seen.add(photo.id);
  }
}

function isImageFile(name: string): boolean {
  return imageExtensions.has(extname(name).toLowerCase());
}

function isYamlFile(name: string): boolean {
  return extname(name).toLowerCase() === metadataExtension;
}

function compareAlbums(left: GallerySourceAlbum, right: GallerySourceAlbum): number {
  if (left.weight !== undefined && right.weight !== undefined && left.weight !== right.weight) {
    return left.weight - right.weight;
  }

  if (left.weight !== undefined && right.weight === undefined) {
    return -1;
  }

  if (left.weight === undefined && right.weight !== undefined) {
    return 1;
  }

  return compareText(left.title, right.title);
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "en");
}

import { z } from "zod";

import type { GalleryConfig, GalleryConfigInput, ThumbnailSize } from "./types.js";

type ThumbnailSizeInput = Omit<ThumbnailSize, "format"> & {
  format?: ThumbnailSize["format"];
};

export type GalleryConfigDefinition = Omit<GalleryConfigInput, "thumbnailSizes"> & {
  thumbnailSizes?: ThumbnailSizeInput[];
};

export const defaultThumbnailSizes: ThumbnailSize[] = [
  { name: "small", width: 480, format: "webp" },
  { name: "medium", width: 960, format: "webp" },
  { name: "large", width: 1600, format: "webp" }
];

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*$/u);
const textSchema = z.string().trim().min(1);

const thumbnailSizeSchema = z.object({
  name: slugSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive().optional(),
  format: z.enum(["avif", "jpeg", "webp"]).default("webp")
});

const photoExifSchema = z.object({
  aperture: z.number().positive().optional(),
  camera: textSchema.optional(),
  capturedAt: textSchema.optional(),
  focalLengthMm: z.number().positive().optional(),
  iso: z.number().int().positive().optional(),
  latitude: z.number().gte(-90).lte(90).optional(),
  lens: textSchema.optional(),
  longitude: z.number().gte(-180).lte(180).optional(),
  shutterSpeed: textSchema.optional()
});

const photoMetadataSchema = z.object({
  id: slugSchema,
  source: textSchema,
  albumIds: z.array(slugSchema).default([]),
  description: textSchema.optional(),
  exif: photoExifSchema.optional(),
  takenAt: textSchema.optional(),
  title: textSchema.optional()
});

const albumMetadataSchema = z.object({
  id: slugSchema,
  title: textSchema,
  coverPhotoId: slugSchema.optional(),
  description: textSchema.optional(),
  photoIds: z.array(slugSchema).default([])
});

const galleryConfigSchema = z.object({
  translations: z
    .object({
      ca: z
        .object({ title: textSchema.optional(), description: textSchema.optional() })
        .strict()
        .optional()
    })
    .strict()
    .optional(),
  title: textSchema,
  albums: z.array(albumMetadataSchema).default([]),
  contentDir: textSchema.default("photos"),
  description: textSchema.optional(),
  outputDir: textSchema.default("dist"),
  photos: z.array(photoMetadataSchema).default([]),
  thumbnailDir: textSchema.default("assets/photos"),
  thumbnailSizes: z.array(thumbnailSizeSchema).default(defaultThumbnailSizes)
});

export function defineGalleryConfig(input: GalleryConfigDefinition): GalleryConfig {
  const config = galleryConfigSchema.parse(input) as GalleryConfig;

  assertUnique(config.thumbnailSizes, "Thumbnail size names must be unique.");
  assertUnique(config.photos, "Photo ids must be unique.");
  assertUnique(config.albums, "Album ids must be unique.");

  return config;
}

function assertUnique(items: readonly { name?: string; id?: string }[], message: string): void {
  const seen = new Set<string>();

  for (const item of items) {
    const key = item.name ?? item.id;

    if (key === undefined) {
      continue;
    }

    if (seen.has(key)) {
      throw new Error(message);
    }

    seen.add(key);
  }
}

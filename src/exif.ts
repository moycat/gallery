import exifr from "exifr";

import type { BuiltGalleryPhoto, PhotoExif } from "./types.js";

const exifPick = [
  "DateTimeOriginal",
  "CreateDate",
  "Make",
  "Model",
  "LensModel",
  "FNumber",
  "ExposureTime",
  "ISO",
  "FocalLength",
  "GPSLatitude",
  "GPSLatitudeRef",
  "GPSLongitude",
  "GPSLongitudeRef"
];

interface RatioLike {
  denominator?: number;
  numerator?: number;
}

export async function readImageExif(sourcePath: string): Promise<PhotoExif> {
  let raw: Record<string, unknown> | undefined;

  try {
    raw = (await exifr.parse(sourcePath, { pick: exifPick, reviveValues: false })) as
      | Record<string, unknown>
      | undefined;
  } catch {
    raw = undefined;
  }

  if (raw === undefined) {
    return {};
  }

  const aperture = normalizeExifNumber(raw.FNumber);
  const camera = [raw.Make, raw.Model].filter(isNonEmptyString).join(" ").trim();
  const capturedAt = normalizeExifDate(raw.DateTimeOriginal ?? raw.CreateDate);
  const exposureSeconds = normalizeExifNumber(raw.ExposureTime);
  const focalLengthMm = normalizeExifNumber(raw.FocalLength);
  const iso = normalizeExifNumber(raw.ISO);
  const latitude = normalizeExifCoordinate(raw.latitude ?? raw.GPSLatitude, raw.GPSLatitudeRef);
  const longitude = normalizeExifCoordinate(raw.longitude ?? raw.GPSLongitude, raw.GPSLongitudeRef);

  return {
    ...(aperture === undefined ? {} : { aperture }),
    ...(camera.length === 0 ? {} : { camera }),
    ...(capturedAt === undefined ? {} : { capturedAt }),
    ...(focalLengthMm === undefined ? {} : { focalLengthMm }),
    ...(iso === undefined ? {} : { iso: Math.round(iso) }),
    ...(latitude === undefined ? {} : { latitude }),
    ...(isNonEmptyString(raw.LensModel) ? { lens: raw.LensModel } : {}),
    ...(longitude === undefined ? {} : { longitude }),
    ...(exposureSeconds === undefined ? {} : { shutterSpeed: formatShutterSpeed(exposureSeconds) })
  };
}

export function mergePhotoExif(
  fileExif: PhotoExif,
  metadataExif: PhotoExif | undefined
): PhotoExif {
  return {
    ...metadataExif,
    ...fileExif,
    ...(metadataExif?.location === undefined ? {} : { location: metadataExif.location })
  };
}

export function normalizeExifDate(value: unknown): string | undefined {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const normalized = value.trim().replace(/^(\d{4}):(\d{2}):(\d{2}) /u, "$1-$2-$3T");
  const timestamp = Date.parse(normalized.endsWith("Z") ? normalized : `${normalized}Z`);

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

export function normalizeExifNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    const ratio = value as RatioLike;

    if (
      typeof ratio.numerator === "number" &&
      typeof ratio.denominator === "number" &&
      ratio.denominator !== 0
    ) {
      return ratio.numerator / ratio.denominator;
    }
  }

  return undefined;
}

function normalizeExifCoordinate(value: unknown, reference: unknown): number | undefined {
  const numberValue = normalizeExifNumber(value);
  const unsigned =
    numberValue ??
    (Array.isArray(value)
      ? value.reduce<number | undefined>((total, item, index) => {
          const part = normalizeExifNumber(item);

          if (part === undefined || total === undefined) {
            return undefined;
          }

          return total + part / 60 ** index;
        }, 0)
      : undefined);

  if (unsigned === undefined) {
    return undefined;
  }

  return reference === "S" || reference === "W" ? -unsigned : unsigned;
}

export function comparePhotosByCapturedAtDescending(
  left: BuiltGalleryPhoto,
  right: BuiltGalleryPhoto
): number {
  const leftTimestamp = left.captureTimestamp ?? Number.NEGATIVE_INFINITY;
  const rightTimestamp = right.captureTimestamp ?? Number.NEGATIVE_INFINITY;

  if (leftTimestamp !== rightTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  return left.id.localeCompare(right.id, "en");
}

export function selectOldestPhoto(photos: BuiltGalleryPhoto[]): BuiltGalleryPhoto | undefined {
  return [...photos].sort((left, right) => {
    const leftTimestamp = left.captureTimestamp ?? Number.NEGATIVE_INFINITY;
    const rightTimestamp = right.captureTimestamp ?? Number.NEGATIVE_INFINITY;

    if (leftTimestamp !== rightTimestamp) {
      return leftTimestamp - rightTimestamp;
    }

    return left.id.localeCompare(right.id, "en");
  })[0];
}

export function formatChineseDate(capturedAt: string | undefined): string {
  if (capturedAt === undefined) {
    return "时间未知";
  }

  const date = new Date(capturedAt);

  if (!Number.isFinite(date.getTime())) {
    return "时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric"
  }).format(date);
}

function formatShutterSpeed(seconds: number): string {
  if (seconds > 0 && seconds < 1) {
    return `1/${Math.round(1 / seconds)}`;
  }

  return `${seconds}s`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

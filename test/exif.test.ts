import exifr from "exifr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  comparePhotosByCapturedAtDescending,
  formatChineseDate,
  mergePhotoExif,
  normalizeExifDate,
  normalizeExifNumber,
  readImageExif,
  selectOldestPhoto
} from "../src/exif.js";
import type { BuiltGalleryPhoto } from "../src/types.js";

vi.mock("exifr", () => ({
  default: {
    parse: vi.fn()
  }
}));

const parseExif = vi.mocked(exifr.parse);

function photo(id: string, capturedAt?: string): BuiltGalleryPhoto {
  return {
    id,
    metadataPath: `photos/${id}.yml`,
    originalExtension: "jpg",
    originalFilename: `${id}.jpg`,
    originalPath: `assets/originals/${id}.jpg`,
    sourcePath: `photos/${id}.jpg`,
    thumbnailPath: `assets/photos/${id}.webp`,
    thumbnails: [],
    ...(capturedAt === undefined
      ? {}
      : {
          capturedAt,
          captureTimestamp: Date.parse(capturedAt),
          exif: { capturedAt }
        })
  };
}

describe("EXIF helpers", () => {
  beforeEach(() => {
    parseExif.mockReset();
  });

  it("reads file EXIF from raw strings without build-machine timezone revival", async () => {
    parseExif.mockResolvedValue({
      DateTimeOriginal: "2024:05:01 12:00:00",
      ExposureTime: { denominator: 250, numerator: 1 },
      FNumber: 2.8,
      FocalLength: 23,
      GPSLatitude: [37, 30, 0],
      GPSLatitudeRef: "N",
      GPSLongitude: [122, 30, 0],
      GPSLongitudeRef: "W",
      ISO: 400,
      LensModel: "XF23mmF2",
      Make: "FUJIFILM",
      Model: "X100VI"
    });

    await expect(readImageExif("photos/test.jpg")).resolves.toEqual({
      aperture: 2.8,
      camera: "FUJIFILM X100VI",
      capturedAt: "2024-05-01T12:00:00.000Z",
      focalLengthMm: 23,
      iso: 400,
      latitude: 37.5,
      lens: "XF23mmF2",
      longitude: -122.5,
      shutterSpeed: "1/250"
    });
    const parseOptions = parseExif.mock.calls[0]?.[1] as
      | { pick?: unknown; reviveValues?: unknown }
      | undefined;
    expect(parseExif.mock.calls[0]?.[0]).toBe("photos/test.jpg");
    expect(parseOptions?.pick).toEqual(
      expect.arrayContaining(["DateTimeOriginal", "GPSLatitudeRef", "GPSLongitudeRef"])
    );
    expect(parseOptions?.reviveValues).toBe(false);
  });

  it("normalizes common EXIF date values to ISO strings", () => {
    expect(normalizeExifDate(new Date("2024-05-01T12:00:00Z"))).toBe("2024-05-01T12:00:00.000Z");
    expect(normalizeExifDate("2024:05:01 12:00:00")).toBe("2024-05-01T12:00:00.000Z");
    expect(normalizeExifDate("not a date")).toBeUndefined();
  });

  it("normalizes numeric EXIF values", () => {
    expect(normalizeExifNumber(2.8)).toBe(2.8);
    expect(normalizeExifNumber({ numerator: 1, denominator: 250 })).toBe(0.004);
    expect(normalizeExifNumber(undefined)).toBeUndefined();
  });

  it("prefers file EXIF while preserving manual location labels", () => {
    expect(
      mergePhotoExif(
        {
          camera: "FUJIFILM X100VI",
          capturedAt: "2024-05-01T12:00:00.000Z"
        },
        {
          camera: "Manual Camera",
          capturedAt: "2022-01-01T12:00:00.000Z",
          location: "Bellevue"
        }
      )
    ).toEqual({
      camera: "FUJIFILM X100VI",
      capturedAt: "2024-05-01T12:00:00.000Z",
      location: "Bellevue"
    });
  });

  it("sorts missing capture times as oldest", () => {
    const sorted = [
      photo("missing"),
      photo("newer", "2024-05-01T12:00:00.000Z"),
      photo("older", "2022-01-01T12:00:00.000Z")
    ].sort(comparePhotosByCapturedAtDescending);

    expect(sorted.map((item) => item.id)).toEqual(["newer", "older", "missing"]);
  });

  it("selects the oldest photo for fallback album covers", () => {
    expect(
      selectOldestPhoto([
        photo("newer", "2024-05-01T12:00:00.000Z"),
        photo("missing"),
        photo("older", "2022-01-01T12:00:00.000Z")
      ])?.id
    ).toBe("missing");
  });

  it("formats dates as Chinese UI copy", () => {
    expect(formatChineseDate("2024-05-01T12:00:00.000Z")).toBe("2024年5月1日");
    expect(formatChineseDate(undefined)).toBe("时间未知");
  });
});

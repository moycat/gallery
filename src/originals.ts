import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { basename, extname } from "node:path";
import { pipeline } from "node:stream/promises";

import { lookup as lookupMimeType } from "mime-types";

import type { GallerySourcePhoto } from "./types.js";

export interface OriginalObjectInfo {
  contentType: string;
  hash: string;
  key: string;
  url?: string;
}

export async function getOriginalObjectInfo(
  photo: GallerySourcePhoto,
  options: { originalPrefix: string; publicBaseUrl?: string }
): Promise<OriginalObjectInfo> {
  const hash = await hashFile(photo.sourcePath);
  const key = buildOriginalObjectKey(photo, hash, options.originalPrefix);
  const contentType = lookupMimeType(photo.sourcePath) || "application/octet-stream";

  return {
    contentType,
    hash,
    key,
    ...(options.publicBaseUrl === undefined
      ? {}
      : { url: buildPublicUrl(options.publicBaseUrl, key) })
  };
}

export function buildOriginalObjectKey(
  photo: Pick<GallerySourcePhoto, "id" | "sourcePath">,
  hash: string,
  prefix: string
): string {
  const extension = extname(basename(photo.sourcePath)).slice(1).toLowerCase();
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/gu, "");

  return `${normalizedPrefix}/${photo.id}-${hash}.${extension}`;
}

function buildPublicUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/+$/u, "")}/${key}`;
}

async function hashFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}

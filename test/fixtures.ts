import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import sharp from "sharp";

export async function writeFixtureImage(
  path: string,
  options: { width?: number; height?: number; format?: "jpeg" | "png" } = {}
): Promise<void> {
  const width = options.width ?? 1200;
  const height = options.height ?? 800;
  const format = options.format ?? "jpeg";

  await mkdir(dirname(path), { recursive: true });

  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 96, g: 142, b: 180 }
    }
  });

  if (format === "png") {
    await image.png().toFile(path);
    return;
  }

  await image.jpeg({ quality: 82 }).toFile(path);
}

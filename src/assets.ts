import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { galleryClientJs, galleryCss, galleryCssPath, galleryJsPath } from "./site-assets.js";

const brandAssets = [
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "apple-touch-icon.png",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon.ico",
  "site.webmanifest"
] as const;

export async function writeStaticAssets(outputDir: string): Promise<void> {
  const root = process.cwd();

  await mkdir(join(outputDir, "assets"), { recursive: true });
  await writeFile(join(outputDir, galleryCssPath), galleryCss, "utf8");
  await writeFile(join(outputDir, galleryJsPath), galleryClientJs, "utf8");

  for (const asset of brandAssets) {
    await copyFile(join(root, "assets", "brand", asset), join(outputDir, asset));
  }

  await mkdir(join(outputDir, "assets", "images"), { recursive: true });
  await copyFile(
    join(root, "assets", "brand", "avatar.webp"),
    join(outputDir, "assets", "images", "avatar.webp")
  );
  await copyFile(
    join(root, "assets", "brand", "cover.webp"),
    join(outputDir, "assets", "images", "cover.webp")
  );

  await copyFontAwesome(outputDir);
}

async function copyFontAwesome(outputDir: string): Promise<void> {
  const cssPath = fileURLToPath(
    import.meta.resolve("@fortawesome/fontawesome-free/css/all.min.css")
  );
  const solidFontPath = fileURLToPath(
    import.meta.resolve("@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2")
  );
  const webfontsDir = dirname(solidFontPath);
  const vendorCss = join(outputDir, "assets", "vendor", "fontawesome", "css", "all.min.css");
  const vendorFonts = join(outputDir, "assets", "vendor", "fontawesome", "webfonts");

  await mkdir(dirname(vendorCss), { recursive: true });
  await mkdir(vendorFonts, { recursive: true });
  await copyFile(cssPath, vendorCss);

  for (const file of await readdir(webfontsDir)) {
    if (file.endsWith(".woff2")) {
      await copyFile(join(webfontsDir, file), join(vendorFonts, file));
    }
  }
}

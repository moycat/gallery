import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { defineGalleryConfig, type GalleryConfigDefinition } from "./config.js";
import type { GalleryConfig } from "./types.js";

export async function buildStaticSite(input: GalleryConfigDefinition): Promise<void> {
  const config = defineGalleryConfig(input);

  await mkdir(config.outputDir, { recursive: true });
  await writeFile(join(config.outputDir, "index.html"), renderIndexDocument(config), "utf8");
}

export function renderIndexDocument(config: GalleryConfig): string {
  const description = config.description ?? "A static photo gallery scaffold.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(config.title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <style>
      :root {
        color-scheme: light dark;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        margin: 0;
        background: Canvas;
        color: CanvasText;
      }

      main {
        box-sizing: border-box;
        min-height: 100vh;
        padding: clamp(2rem, 8vw, 6rem);
      }

      h1 {
        font-size: clamp(2.25rem, 7vw, 5rem);
        line-height: 1;
        margin: 0 0 1rem;
      }

      p {
        font-size: 1rem;
        line-height: 1.7;
        max-width: 42rem;
      }
    </style>
  </head>
  <body data-gallery-root="true">
    <main>
      <h1>${escapeHtml(config.title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p>Gallery framework initialized. Photo ingestion, EXIF extraction, album views, and responsive thumbnails will be added as the product design is finalized.</p>
    </main>
  </body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

import { defineGalleryConfig, type GalleryConfigDefinition } from "./config.js";
import { buildGallery } from "./gallery-build.js";
import type { BuiltGallery, BuiltGalleryPhoto, GalleryConfig } from "./types.js";

export async function buildStaticSite(input: GalleryConfigDefinition): Promise<void> {
  const config = defineGalleryConfig(input);

  await buildGallery({
    ...(config.description === undefined ? {} : { description: config.description }),
    outputDir: config.outputDir,
    sourceDir: config.contentDir,
    title: config.title
  });
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

export function renderGalleryDocument(gallery: BuiltGallery): string {
  const description =
    gallery.description ?? "A static photo gallery generated from local photos and metadata.";
  const photoById = new Map(gallery.photos.map((photo) => [photo.id, photo]));
  const unalbumedPhotos = gallery.unalbumedPhotoIds
    .map((photoId) => photoById.get(photoId))
    .filter((photo): photo is BuiltGalleryPhoto => photo !== undefined);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(gallery.title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <style>
      :root {
        color-scheme: light dark;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: Canvas;
        color: CanvasText;
      }

      body {
        margin: 0;
      }

      a {
        color: inherit;
      }

      .shell {
        box-sizing: border-box;
        display: grid;
        gap: 2rem;
        margin: 0 auto;
        max-width: 1280px;
        padding: clamp(1.25rem, 4vw, 3rem);
      }

      header {
        border-bottom: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
        padding-bottom: 1.5rem;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        font-size: clamp(2rem, 5vw, 4rem);
        line-height: 1;
      }

      h2 {
        font-size: clamp(1.35rem, 3vw, 2rem);
        line-height: 1.15;
      }

      h3 {
        font-size: 1rem;
        line-height: 1.3;
      }

      .lede,
      .description,
      .meta {
        color: color-mix(in srgb, CanvasText 72%, transparent);
        line-height: 1.6;
      }

      .lede {
        margin-top: 0.75rem;
        max-width: 48rem;
      }

      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      nav a {
        border: 1px solid color-mix(in srgb, CanvasText 20%, transparent);
        border-radius: 999px;
        padding: 0.45rem 0.8rem;
        text-decoration: none;
      }

      section {
        display: grid;
        gap: 1rem;
      }

      .section-heading {
        display: grid;
        gap: 0.35rem;
      }

      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
      }

      .photo {
        display: grid;
        gap: 0.65rem;
      }

      .photo img {
        aspect-ratio: 1 / 1;
        background: color-mix(in srgb, CanvasText 8%, Canvas);
        display: block;
        height: auto;
        object-fit: cover;
        width: 100%;
      }

      .photo a {
        display: block;
      }

      .photo-text {
        display: grid;
        gap: 0.25rem;
      }
    </style>
  </head>
  <body data-gallery-root="true">
    <main class="shell">
      <header>
        <h1>${escapeHtml(gallery.title)}</h1>
        <p class="lede">${escapeHtml(description)}</p>
      </header>
      ${renderNavigation(gallery, unalbumedPhotos)}
      ${gallery.albums
        .map((album) => {
          const photos = album.photoIds
            .map((photoId) => photoById.get(photoId))
            .filter((photo): photo is BuiltGalleryPhoto => photo !== undefined);
          return renderPhotoSection(album.id, album.title, album.description, photos);
        })
        .join("\n")}
      ${unalbumedPhotos.length > 0 ? renderPhotoSection("photos", "Photos", undefined, unalbumedPhotos) : ""}
    </main>
  </body>
</html>
`;
}

function renderNavigation(gallery: BuiltGallery, unalbumedPhotos: BuiltGalleryPhoto[]): string {
  const albumLinks = gallery.albums
    .map((album) => `<a href="#album-${escapeAttribute(album.id)}">${escapeHtml(album.title)}</a>`)
    .join("\n");
  const photoLink = unalbumedPhotos.length > 0 ? '<a href="#album-photos">Photos</a>' : "";

  if (albumLinks.length === 0 && photoLink.length === 0) {
    return "";
  }

  return `<nav aria-label="Albums">
        ${albumLinks}
        ${photoLink}
      </nav>`;
}

function renderPhotoSection(
  id: string,
  title: string,
  description: string | undefined,
  photos: BuiltGalleryPhoto[]
): string {
  return `<section id="album-${escapeAttribute(id)}">
        <div class="section-heading">
          <h2>${escapeHtml(title)}</h2>
          ${description === undefined ? "" : `<p class="description">${escapeHtml(description)}</p>`}
        </div>
        <div class="grid">
          ${photos.map(renderPhotoCard).join("\n")}
        </div>
      </section>`;
}

function renderPhotoCard(photo: BuiltGalleryPhoto): string {
  const title = photo.title ?? photo.id;
  const description = photo.description;
  const metadata = formatPhotoMetadata(photo);

  return `<article class="photo">
            <a href="${escapeAttribute(photo.originalPath)}">
              <img src="${escapeAttribute(photo.thumbnailPath)}" alt="${escapeAttribute(title)}" loading="lazy">
            </a>
            <div class="photo-text">
              <h3>${escapeHtml(title)}</h3>
              ${description === undefined ? "" : `<p class="description">${escapeHtml(description)}</p>`}
              ${metadata.length === 0 ? "" : `<p class="meta">${escapeHtml(metadata)}</p>`}
            </div>
          </article>`;
}

function formatPhotoMetadata(photo: BuiltGalleryPhoto): string {
  const exif = photo.exif;

  if (exif === undefined) {
    return "";
  }

  const parts = [
    exif.capturedAt,
    exif.camera,
    exif.lens,
    formatExposure(exif),
    exif.location,
    formatCoordinates(exif)
  ].filter((part): part is string => part !== undefined && part.length > 0);

  return parts.join(" · ");
}

function formatExposure(exif: BuiltGalleryPhoto["exif"]): string | undefined {
  if (exif === undefined) {
    return undefined;
  }

  const parts = [
    exif.aperture === undefined ? undefined : `f/${exif.aperture}`,
    exif.shutterSpeed,
    exif.iso === undefined ? undefined : `ISO ${exif.iso}`,
    exif.focalLengthMm === undefined ? undefined : `${exif.focalLengthMm}mm`
  ].filter((part): part is string => part !== undefined);

  return parts.length === 0 ? undefined : parts.join(" ");
}

function formatCoordinates(exif: BuiltGalleryPhoto["exif"]): string | undefined {
  if (exif?.latitude === undefined || exif.longitude === undefined) {
    return undefined;
  }

  return `${exif.latitude}, ${exif.longitude}`;
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

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

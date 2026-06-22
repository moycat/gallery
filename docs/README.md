# Gallery

TypeScript static gallery framework for camera photos, optional photo metadata, albums, EXIF extraction, thumbnail generation, and Cloudflare Pages deployment.

The generated site is pure static HTML/CSS/vanilla JavaScript. It renders a Chinese timeline feed, album index, album detail pages, lazy-loaded responsive thumbnails, and modal photo details with original-photo links.

## Commands

- `npm install` installs dependencies.
- `npm test` runs Vitest.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` runs ESLint.
- `npm run format` formats the repository with Prettier.
- `npm run deadcode` runs Knip.
- `npm run clean` removes generated build output.
- `npm run update` creates missing metadata YAML files and validates existing metadata.
- `npm run upload` syncs source originals to an S3-compatible bucket and shows a progress bar in interactive terminals.
- `npm run upload -- --prune` also deletes remote originals under the configured prefix when they no longer exist locally.
- `npm run build` compiles TypeScript and writes the static site to `dist`.
- `npm run dev` builds a local preview with local original-photo links and serves it without uploading or deploying.
- `npm run preview` serves the existing production-style `dist` with Wrangler Pages.
- `npm run deploy` builds and deploys `dist` to Cloudflare Pages.
- `npm run wrangler:types:check` verifies generated Cloudflare types are current.

## Cloudflare

This project uses `wrangler.jsonc` with `pages_build_output_dir` set to `dist`. Re-check Cloudflare's agent documentation and MCP servers before changing Pages, Wrangler, or binding configuration.

## Source Photos

Put source images in `photos/`. JPG, JPEG, and PNG files under this directory are tracked by Git LFS.

Root-level photos are not part of an album:

```txt
photos/
  test.jpg      # photo id: test
  test.yml      # optional photo metadata
```

Each immediate subdirectory is an album. The album id is the directory name, and photo ids are `[album_id-]photo_name`:

```txt
photos/
  abc/
    haha.jpg    # photo id: abc-haha
    haha.yml    # optional photo metadata
  abc.yml       # album metadata
```

Album metadata is required and uses the directory name plus `.yml`:

```yaml
title: Album ABC
description: Optional album description
coverPhotoId: abc-haha
weight: 1
```

If `coverPhotoId` is set, build validation requires it to reference a photo inside that album. If it is omitted, the build uses the oldest photo in the album based on EXIF capture time; photos without capture time are treated as older than dated photos.

Photo metadata is optional and uses the image filename without the extension plus `.yml`:

```yaml
title: Optional photo title
description: Optional photo description
exif:
  capturedAt: "2024-01-01T00:00:00Z"
  camera: Camera body
  lens: Lens
  aperture: 2.8
  shutterSpeed: 1/250
  iso: 400
  focalLengthMm: 35
  location: Location name
  latitude: 0
  longitude: 0
```

The home feed and album pages sort photos by EXIF capture time in descending order. When a photo has no EXIF capture time, the build prints a warning and treats that photo as the oldest for sorting and fallback album covers.

Run `npm run update` to create missing metadata placeholders and validate existing metadata. `npm run build` runs the same update step before generating responsive WebP thumbnails, copying originals, and writing the static site.

Generated thumbnails are cached under `.gallery-cache/thumbnails` using the original file's SHA-256 content hash plus transform parameters. `npm run clean` does not remove this cache, so unchanged photos reuse thumbnails across builds even when `dist` is regenerated. Delete `.gallery-cache` manually when a full thumbnail rebuild is required.

Generated routes:

- `/` timeline of all photos.
- `/albums/` album index.
- `/albums/<album-id>/` album detail page.

## Environment Configuration

Project-level settings come from environment variables or `.envs`.

```bash
GALLERY_TITLE=末影画廊
GALLERY_DESCRIPTION=Optional gallery description
GALLERY_SOURCE_DIR=photos
GALLERY_OUTPUT_DIR=dist
S3_ORIGINAL_PREFIX=originals
S3_PUBLIC_BASE_URL=https://media.example.com
```

When `S3_PUBLIC_BASE_URL` is set, `npm run build` links originals to remote storage using content-addressed keys such as `https://media.example.com/originals/test-<sha256>.jpg` and does not copy originals into `dist`. Run `npm run upload` before production-style preview or deploy so those remote original links exist. `npm run dev` always builds with local copied originals, so original-photo links work locally even when `S3_PUBLIC_BASE_URL` is configured.

## S3-Compatible Uploads

Copy `.envs.example` to `.envs` and fill in credentials. `.envs` is ignored by git.

Required for upload:

```bash
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_BUCKET=gallery-originals
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
```

Optional:

```bash
S3_PUBLIC_BASE_URL=https://media.example.com
S3_ORIGINAL_PREFIX=originals
```

`npm run upload` uses an S3-compatible API through the AWS SDK. For Cloudflare R2, set `S3_ENDPOINT` to `https://<account-id>.r2.cloudflarestorage.com` and use R2 S3 access key credentials. It does not shell out to Wrangler or use Cloudflare account API tokens for bucket management. Use `npm run upload -- --prune` to remove objects under the configured original prefix when no local photo maps to them anymore.

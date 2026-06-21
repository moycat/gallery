# Gallery

TypeScript static gallery framework scaffold for camera photos, optional photo metadata, albums, EXIF extraction, thumbnail generation, and Cloudflare Pages deployment.

The product design is intentionally minimal for now. The current code establishes the TypeScript toolchain, Cloudflare Pages configuration, and a tiny static output path that later gallery generation work can replace.

## Commands

- `npm install` installs dependencies.
- `npm test` runs Vitest.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` runs ESLint.
- `npm run format` formats the repository with Prettier.
- `npm run deadcode` runs Knip.
- `npm run clean` removes generated build output.
- `npm run update` creates missing metadata YAML files and validates existing metadata.
- `npm run build` compiles TypeScript and writes `dist/index.html`.
- `npm run preview` serves `dist` with Wrangler Pages.
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
weight: 1
```

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

Run `npm run update` to create missing metadata placeholders and validate existing metadata. `npm run build` runs the same update step before generating 1080px WebP thumbnails, copying originals, and writing the static site.

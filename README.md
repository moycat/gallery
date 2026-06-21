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
- `npm run build` compiles TypeScript and writes `dist/index.html`.
- `npm run preview` serves `dist` with Wrangler Pages.
- `npm run deploy` builds and deploys `dist` to Cloudflare Pages.

## Cloudflare

This project uses `wrangler.jsonc` with `pages_build_output_dir` set to `dist`. Re-check Cloudflare's agent documentation and MCP servers before changing Pages, Wrangler, or binding configuration.

# Bilingual gallery content

Chinese pages use `/`, `/albums/`, and `/albums/<id>/`. Their Catalan equivalents use the `/ca/` prefix. Photo IDs, album IDs, ordering, originals, and thumbnails are shared. A photo dialog uses `#photo=<id>` so changing language preserves the selected photograph. The language control is also available inside the dialog.

Keep original Chinese titles/descriptions in the existing YAML fields. Add corresponding Catalan fields to the same metadata file; never duplicate albums or photos to represent another language:

```yaml
title: 猫
description: 家里的猫
translations:
  ca:
    title: Gats
    description: Els gats de casa
```

Photo metadata accepts the same `translations.ca.title` and `translations.ca.description` fields. For a manually entered `exif.location`, use `translations.ca.location`. Camera and lens model names, timestamps, exposure settings, coordinates, IDs, and image paths are shared. Existing photos without authored captions remain untitled.

Always fill in the corresponding Catalan fields when adding Chinese text. Omitted translations currently fall back to the original field for compatibility with existing metadata consumers. Unknown translation keys and empty translated strings fail metadata validation.

The default gallery title and description are localized. Custom project titles/descriptions support `GALLERY_TITLE_CA` and `GALLERY_DESCRIPTION_CA`; programmatic configuration uses `translations.ca.title` and `translations.ca.description`. Keep local deployment settings in ignored configuration files.

Catalan pages link to the Catalan blog. All generated Catalan pages carry a `noindex` meta tag; root `robots.txt` blocks `/ca/` and the exact `/ca` path. There is no separate Catalan search index.

Run `npm run update`, `npm run typecheck`, `npm run lint`, `npm run deadcode`, `npm test`, and `npm run build` after content or renderer changes. Building is local and does not upload originals or deploy the site.

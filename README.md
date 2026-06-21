# gallery

Gallery of [@moycat](https://github.com/moycat).

Hosted at [https://gallery.moy.cat](https://gallery.moy.cat) via Cloudflare Pages.

This repository builds a pure static Chinese photo gallery with a timeline feed, album index,
album detail pages, EXIF-based ordering, responsive thumbnails, and original-photo links.

Generated routes:

- `/` timeline of all photos.
- `/albums/` album index.
- `/albums/<album-id>/` album detail page.
- `/about/` static about page.

Photos are sorted by EXIF capture time in descending order. When a photo has no EXIF capture time,
the build prints a warning and treats that photo as the oldest for sorting and fallback album covers.

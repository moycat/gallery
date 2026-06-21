export const galleryCss = String.raw`
:root {
  --gallery-bg: #fff;
  --gallery-body: #2c3e50;
  --gallery-heading: #34495e;
  --gallery-line: #eef2f8;
  --gallery-link: #349ef3;
  --gallery-muted: #687782;
  --gallery-sidebar: clamp(250px, 39vw, 500px);
  font-family: "Crimson Text", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 10px;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--gallery-bg);
}

body {
  background: var(--gallery-bg);
  color: var(--gallery-body);
  font-family: "Crimson Text", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 1.8rem;
  letter-spacing: 0;
  line-height: 1.8;
  margin: 0;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover {
  color: var(--gallery-link);
}

img {
  max-width: 100%;
}

.gallery-shell {
  display: grid;
  grid-template-columns: var(--gallery-sidebar) minmax(0, 1fr);
  min-height: 100vh;
}

.gallery-sidebar {
  align-items: center;
  background: #fff;
  border-right: 1px solid var(--gallery-line);
  color: #000;
  display: flex;
  min-height: 100vh;
  padding: 4rem 8rem;
  position: sticky;
  top: 0;
}

.gallery-sidebar__inner {
  width: 100%;
}

.gallery-sidebar__profile {
  text-align: center;
}

.gallery-sidebar__avatar {
  border-radius: 999px;
  display: block;
  height: 18rem;
  margin: 0 auto 1.8rem;
  object-fit: cover;
  width: 18rem;
}

.gallery-sidebar__name {
  color: #000;
  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 4.8rem;
  font-weight: 700;
  line-height: 1;
  margin: 0 0 1.4rem;
}

.gallery-sidebar__intro {
  color: #000;
  font-size: 1.7rem;
  margin: 0 0 3rem;
}

.gallery-nav {
  display: grid;
  gap: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
}

.gallery-nav a {
  align-items: center;
  color: #000;
  display: flex;
  font-size: 1.6rem;
  gap: 1.5rem;
  min-height: 4.5rem;
  min-width: 0;
}

.gallery-nav i {
  flex: 0 0 3rem;
  font-size: 1.8rem;
  text-align: center;
}

.gallery-nav span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.gallery-main {
  min-width: 0;
  padding: 5rem;
}

.gallery-page-header {
  margin: 0 0 3rem;
  max-width: 72rem;
}

.gallery-page-title {
  color: var(--gallery-heading);
  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 3.2rem;
  line-height: 1.35;
  margin: 0 0 0.6rem;
}

.gallery-page-description {
  color: var(--gallery-muted);
  margin: 0;
}

.photo-grid {
  align-items: start;
  display: grid;
  gap: 11px;
  grid-auto-rows: 8px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.photo-tile {
  background: #f7f8f8;
  grid-row-end: span var(--row-span, 36);
  min-height: 18rem;
  overflow: hidden;
  position: relative;
}

.photo-tile img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.photo-tile__overlay {
  align-content: end;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.74), transparent 68%);
  color: #fff;
  display: grid;
  inset: 0;
  opacity: 0;
  padding: 1.4rem;
  position: absolute;
  transition: opacity 160ms ease;
}

.photo-tile:hover .photo-tile__overlay,
.photo-tile:focus-within .photo-tile__overlay {
  opacity: 1;
}

.photo-tile__title {
  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 1.7rem;
  line-height: 1.4;
  margin: 0 0 0.2rem;
}

.photo-tile__meta {
  font-size: 1.4rem;
  line-height: 1.5;
  margin: 0;
}

.album-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.album-card {
  color: inherit;
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.album-card img {
  aspect-ratio: 4 / 3;
  display: block;
  object-fit: cover;
  width: 100%;
}

.album-card h2 {
  color: var(--gallery-heading);
  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 2.2rem;
  line-height: 1.35;
  margin: 0;
  overflow-wrap: anywhere;
}

.album-card p {
  color: var(--gallery-muted);
  font-size: 1.6rem;
  margin: 0;
}

.about-copy {
  max-width: 72rem;
}

.about-copy p {
  margin: 0 0 1.5em;
}

.photo-dialog {
  border: 0;
  max-height: min(82vh, 900px);
  max-width: min(1120px, 92vw);
  padding: 0;
  position: relative;
  width: 92vw;
}

.photo-dialog::backdrop {
  background: rgba(0, 0, 0, 0.64);
}

.photo-dialog__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32rem;
}

.photo-dialog__image {
  align-items: center;
  background: #050505;
  display: flex;
  justify-content: center;
  min-height: 40rem;
}

.photo-dialog__image img {
  display: block;
  max-height: 82vh;
  max-width: 100%;
  object-fit: contain;
}

.photo-dialog__details {
  color: #000;
  min-width: 0;
  overflow-wrap: anywhere;
  padding: 2.4rem;
}

.photo-dialog__details h2 {
  color: #000;
  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 2.2rem;
  line-height: 1.35;
  margin: 0;
  padding-right: 2.4rem;
}

.photo-dialog__details dl {
  display: grid;
  gap: 0.8rem 1.2rem;
  grid-template-columns: max-content minmax(0, 1fr);
  margin: 1.6rem 0 0;
}

.photo-dialog__details dt {
  color: var(--gallery-muted);
}

.photo-dialog__details dd {
  margin: 0;
}

.photo-dialog__close {
  background: transparent;
  border: 0;
  color: #000;
  cursor: pointer;
  font: inherit;
  position: absolute;
  right: 1.2rem;
  top: 1rem;
  z-index: 1;
}

.photo-dialog__original {
  border-bottom: 1px solid currentColor;
  color: var(--gallery-link);
  display: inline-block;
  margin-top: 1.6rem;
}

@media (max-width: 900px) {
  .gallery-shell {
    display: block;
  }

  .gallery-sidebar {
    border-bottom: 1px solid var(--gallery-line);
    border-right: 0;
    min-height: 0;
    padding: 1.6rem 2rem;
    position: static;
  }

  .gallery-sidebar__profile {
    align-items: center;
    display: flex;
    text-align: left;
  }

  .gallery-sidebar__avatar {
    flex: 0 0 4.8rem;
    height: 4.8rem;
    margin: 0 1.2rem 0 0;
    width: 4.8rem;
  }

  .gallery-sidebar__name {
    font-size: 2rem;
    margin: 0;
  }

  .gallery-sidebar__intro {
    display: none;
  }

  .gallery-nav {
    display: flex;
    gap: 1.2rem;
    margin-top: 1.2rem;
    overflow-x: auto;
    padding-bottom: 0.2rem;
  }

  .gallery-nav a {
    white-space: nowrap;
  }

  .gallery-main {
    padding: 2.4rem 2rem;
  }

  .photo-grid {
    grid-auto-rows: auto;
    grid-template-columns: 1fr;
  }

  .photo-tile {
    grid-row-end: auto;
    min-height: 0;
  }

  .photo-tile img {
    height: auto;
  }

  .photo-tile__overlay {
    opacity: 1;
  }

  .photo-dialog__layout {
    grid-template-columns: 1fr;
  }

  .photo-dialog__image {
    min-height: 24rem;
  }
}
`;

export const galleryClientJs = String.raw`
(() => {
  const dataElement = document.getElementById("gallery-photo-data");
  const dialog = document.querySelector("[data-photo-dialog]");

  if (!(dataElement instanceof HTMLScriptElement) || !(dialog instanceof HTMLDialogElement)) {
    return;
  }

  const photos = new Map(JSON.parse(dataElement.textContent || "[]").map((photo) => [photo.id, photo]));
  const image = dialog.querySelector("[data-dialog-image]");
  const title = dialog.querySelector("[data-dialog-title]");
  const details = dialog.querySelector("[data-dialog-details]");
  const original = dialog.querySelector("[data-dialog-original]");
  const close = dialog.querySelector("[data-dialog-close]");

  function layoutMasonry() {
    document.querySelectorAll(".photo-tile").forEach((tile) => {
      const img = tile.querySelector("img");

      if (!(img instanceof HTMLImageElement)) {
        return;
      }

      const width = tile.getBoundingClientRect().width;
      const height = img.naturalWidth > 0 ? (width * img.naturalHeight) / img.naturalWidth : width;
      tile.style.setProperty("--row-span", String(Math.max(18, Math.ceil((height + 11) / 8))));
    });
  }

  function openPhoto(id) {
    const photo = photos.get(id);

    if (photo === undefined || !(image instanceof HTMLImageElement)) {
      return;
    }

    image.src = photo.modalSrc;
    image.alt = photo.title;

    if (title !== null) {
      title.textContent = photo.title;
    }

    if (details !== null) {
      details.innerHTML = photo.detailsHtml;
    }

    if (original instanceof HTMLAnchorElement) {
      original.href = photo.originalPath;
    }

    dialog.showModal();
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element ? event.target.closest("[data-photo-id]") : null;

    if (!(trigger instanceof HTMLAnchorElement)) {
      return;
    }

    event.preventDefault();
    openPhoto(trigger.dataset.photoId || "");
  });

  close?.addEventListener("click", () => dialog.close());
  window.addEventListener("resize", layoutMasonry);
  window.addEventListener("load", layoutMasonry);
  document.querySelectorAll(".photo-tile img").forEach((img) => {
    img.addEventListener("load", layoutMasonry, { once: true });
  });
  layoutMasonry();
})();
`;

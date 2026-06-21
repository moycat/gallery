export const galleryCss = String.raw`
:root {
  --gallery-bg: #fff;
  --gallery-body: #2c3e50;
  --gallery-heading: #34495e;
  --gallery-line: #eef2f8;
  --gallery-link: #349ef3;
  --gallery-muted: #687782;
  --gallery-sidebar: 500px;
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

#cover {
  background-image: url('/assets/images/cover.webp');
  background-repeat: no-repeat;
  background-size: cover;
  height: 100%;
  left: 0;
  pointer-events: none;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 0;
}

#header {
  background: #fff;
  border: 1px solid var(--gallery-line);
  color: #88909a;
  display: block;
  height: 55px;
  left: 0;
  position: fixed;
  top: 0;
  transition: transform 250ms ease-in-out;
  width: 100%;
  z-index: 25;
}

#btn-open-sidebar {
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
  left: 20px;
  line-height: 1;
  padding: 0;
  position: absolute;
  top: 20px;
}

.header-title {
  font-size: 1.8rem;
  line-height: 55px;
  margin: 0;
  text-align: center;
}

.header-title-link {
  color: #88909a;
  font-weight: normal;
}

.header-title-link:hover,
.header-title-link:active {
  color: #6b7480;
  text-decoration: none;
}

.gallery-shell {
  align-items: start;
  display: grid;
  grid-template-columns: var(--gallery-sidebar) minmax(0, 1fr);
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.gallery-sidebar {
  background: rgba(17, 26, 35, 0);
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  font-family: "Crimson Text", "Noto Color Emoji", "Noto Serif SC", serif;
  height: 100%;
  justify-content: center;
  overflow: auto;
  padding: 0;
  position: fixed;
  top: 0;
  transition: transform 250ms ease-in-out;
  width: var(--gallery-sidebar);
  z-index: 20;
}

.gallery-sidebar__inner {
  overflow: auto;
  padding: 0 80px;
  position: relative;
  width: 100%;
}

.gallery-sidebar__profile {
  color: white;
  margin-bottom: 15px;
  padding-bottom: 7.5px;
  text-align: center;
}

.gallery-sidebar__avatar {
  border-radius: 180px;
  display: block;
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.1));
  height: 180px;
  margin: 0.4rem auto 5px;
  object-fit: cover;
  transition: all 300ms ease-out;
  width: 180px;
}

.gallery-sidebar__avatar:hover {
  transform: translate(0, -0.4rem);
  transition: all 300ms ease-in;
}

.gallery-sidebar__name {
  color: white;
  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 2.4em;
  font-weight: 700;
  line-height: 1;
  margin: 0.5em 0;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
}

.sidebar-profile-bio {
  color: white;
  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 1.45;
  margin: 1em 0 0.5em;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

.sidebar-buttons {
  display: inline-block;
  list-style: none;
  margin: 0 0 20px;
  padding: 0;
  vertical-align: top;
  width: 49%;
}

.sidebar-button {
  box-sizing: border-box;
  display: block;
  height: 45px;
  line-height: 45px;
  padding-left: 10px;
  text-align: left;
  width: 100%;
}

.sidebar-button:nth-child(odd) {
  padding-right: 10px;
}

.sidebar-button-link {
  color: rgba(255, 255, 255, 0.9);
  display: block;
  height: 100%;
  padding-top: 0;
  text-align: left;
  white-space: nowrap;
  width: auto;
}

.sidebar-button-link:hover,
.sidebar-button-link:active {
  color: white;
  text-decoration: none;
}

.sidebar-button-icon {
  display: inline-block;
  float: left;
  font-size: 1.8rem;
  height: 35px;
  line-height: 35px;
  margin-right: 15px;
  padding-top: 0;
  text-align: center;
  vertical-align: middle;
  width: 30px;
}

.sidebar-button-desc {
  display: block;
  font-size: 1.6rem;
  height: 35px;
  letter-spacing: 0.3px;
  line-height: 38px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  width: auto;
}

.gallery-main {
  background: var(--gallery-bg);
  grid-column: 2;
  min-height: 100vh;
  min-width: 0;
  padding: 5rem;
  transition: transform 250ms ease-in-out;
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
  align-items: stretch;
  column-gap: 11px;
  display: grid;
  grid-auto-rows: 8px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  row-gap: 11px;
}

.photo-tile {
  background: transparent;
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
  font-size: 1.8rem;
  height: 3.2rem;
  line-height: 3.2rem;
  padding: 0;
  position: absolute;
  right: 1.2rem;
  text-align: center;
  top: 1rem;
  width: 3.2rem;
  z-index: 1;
}

.photo-dialog__close:hover {
  color: var(--gallery-link);
}

.photo-dialog__original {
  border-bottom: 1px solid currentColor;
  color: var(--gallery-link);
  display: inline-block;
  margin-top: 1.6rem;
}

#about {
  background: rgba(17, 26, 35, 0.16);
  cursor: pointer;
  display: none;
  height: 100%;
  left: 0;
  line-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  position: fixed;
  text-align: center;
  top: 0;
  width: 100%;
  z-index: 30;
}

#about.is-open {
  display: block;
}

#about-card {
  background: #fff;
  border-radius: 3px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  color: var(--gallery-body);
  cursor: initial;
  display: block;
  line-height: var(--about-line-height, 1.8);
  margin: 15px auto;
  max-width: 400px;
  opacity: 0;
  padding: 30px 0;
  position: relative;
  top: 0;
  transform: translateY(-2.4rem);
  transition:
    opacity 220ms ease,
    transform 220ms ease;
  width: 80%;
}

#about.is-open #about-card {
  opacity: 1;
  transform: translateY(0);
}

#about-btn-close {
  background: transparent;
  border: 0;
  color: #b9c0c8;
  cursor: pointer;
  font: inherit;
  padding: 0;
  position: absolute;
  right: 15px;
  top: 15px;
}

#about-btn-close:hover {
  color: #8e99a3;
}

#about-card-picture {
  border-radius: 64px;
  height: 128px;
  margin-bottom: 15px;
  object-fit: cover;
  width: 128px;
}

#about-card-name {
  color: var(--gallery-heading);
  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 1.8rem;
  line-height: 1.35;
  margin: 0 0 20px;
}

#about-card-bio {
  margin: 0 0 30px;
  padding: 0 30px;
}

#about-card-bio p {
  margin: 0 0 1em;
}

#about-card-bio p:last-child {
  margin-bottom: 0;
}

#about-card-job,
#about-card-location {
  display: inline-block;
  padding: 0 15px;
  vertical-align: top;
  width: calc((100% / 2) - 48px);
}

#about-card-job,
#about-card-location,
#about-card-bio {
  color: var(--gallery-body);
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 1.8;
}

@media (max-width: 1279px) {
  :root {
    --gallery-sidebar: 250px;
  }

  .gallery-sidebar {
    display: block;
    justify-content: flex-start;
  }

  .gallery-sidebar__inner {
    padding: 0;
    position: static;
  }

  .gallery-sidebar__profile {
    height: 160px;
    margin-bottom: 15px;
    padding-bottom: 7.5px;
    padding-top: 40px;
  }

  .gallery-sidebar__avatar {
    border-radius: 120px;
    height: 120px;
    width: 120px;
  }

  .gallery-sidebar__name {
    font-size: 2rem;
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  }

  .sidebar-profile-bio {
    display: none;
  }

  .sidebar-buttons {
    display: block;
    width: 100%;
  }

  .sidebar-button {
    padding-left: 0;
    padding-right: 0;
  }

  .sidebar-button:nth-child(odd) {
    padding-right: 0;
  }

  .sidebar-button-link {
    padding-left: 23px;
    text-align: left;
    width: auto;
  }

  .sidebar-button-icon {
    display: inline-block;
    float: none;
    height: 30px;
    line-height: 30px;
  }

  .sidebar-button-desc {
    display: inline-block;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  }
}

@media (min-width: 768px) {
  #header {
    display: none;
  }
}

@media (max-width: 1023px) {
  :root {
    --gallery-sidebar: 75px;
  }

  .gallery-sidebar__profile {
    height: auto;
    padding-top: 18px;
  }

  .gallery-sidebar__avatar {
    border-radius: 48px;
    height: 48px;
    width: 48px;
  }

  .gallery-sidebar__name {
    display: none;
  }

  .sidebar-button {
    text-align: center;
  }

  .sidebar-button-link {
    padding-left: 0;
    text-align: center;
    width: 100%;
  }

  .sidebar-button-icon {
    margin-right: 0;
  }

  .sidebar-button-desc {
    display: none;
  }
}

@media (max-width: 767px) {
  :root {
    --gallery-sidebar: 250px;
  }

  .gallery-sidebar {
    display: block;
    height: 100%;
    left: -250px;
    min-height: 0;
    overflow: auto;
    position: fixed;
    width: 250px;
  }

  .gallery-sidebar.pushed {
    transform: translate3d(250px, 0, 0);
  }

  .gallery-sidebar__profile {
    display: block;
    height: 160px;
    margin-bottom: 15px;
    padding-bottom: 7.5px;
    padding-top: 40px;
    text-align: center;
  }

  .gallery-sidebar__avatar {
    border-radius: 120px;
    height: 120px;
    margin: 0.4rem auto;
    width: 120px;
  }

  .gallery-sidebar__name {
    display: block;
    font-size: 2rem;
    margin: 0.5em 0;
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  }

  .sidebar-profile-bio {
    display: none;
  }

  .sidebar-buttons {
    display: block;
    width: 100%;
  }

  .sidebar-button {
    display: block;
    height: 45px;
    line-height: 45px;
    padding: 0;
    text-align: left;
    width: 100%;
  }

  .sidebar-button-link {
    padding-left: 23px;
    text-align: left;
    width: auto;
  }

  .sidebar-button-icon {
    float: none;
    margin-right: 15px;
  }

  .sidebar-button-desc {
    display: inline-block;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  }

  .gallery-shell {
    display: block;
  }

  .gallery-main {
    grid-column: auto;
    padding: 7rem 2rem 2.4rem;
    width: 100%;
  }

  #header.pushed,
  .gallery-main.pushed {
    transform: translate3d(250px, 0, 0);
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

  #about-card {
    width: 90%;
  }

  #about-card-picture {
    border-radius: 55px;
    height: 110px;
    width: 110px;
  }

  #about-card-job,
  #about-card-location {
    display: block;
    padding: 0 30px;
    width: calc(100% - 60px);
  }

  #about-card-job {
    margin-bottom: 15px;
  }
}
`;

export const galleryClientJs = String.raw`
(() => {
  const about = document.querySelector("[data-about-modal]");
  const aboutClose = document.querySelector("[data-about-close]");

  function openAbout() {
    if (!(about instanceof HTMLElement)) {
      return;
    }

    about.classList.add("is-open");
    about.setAttribute("aria-hidden", "false");

    if (aboutClose instanceof HTMLElement) {
      aboutClose.focus();
    }
  }

  function closeAbout() {
    if (!(about instanceof HTMLElement)) {
      return;
    }

    about.classList.remove("is-open");
    about.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll('a[href="#about"]').forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openAbout();
    });
  });

  aboutClose?.addEventListener("click", closeAbout);
  about?.addEventListener("click", (event) => {
    if (event.target === about) {
      closeAbout();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAbout();
    }
  });

  const sidebar = document.querySelector("[data-sidebar]");
  const sidebarOpen = document.querySelector("[data-sidebar-open]");
  const sidebarHeader = document.querySelector("#header");
  const galleryMain = document.querySelector("[data-gallery-main]");
  const sidebarPushTargets = [sidebar, sidebarHeader, galleryMain].filter((target) => target instanceof HTMLElement);

  function openSidebar() {
    sidebarPushTargets.forEach((target) => target.classList.add("pushed"));
    document.body.style.overflowX = "hidden";
  }

  function closeSidebar() {
    sidebarPushTargets.forEach((target) => target.classList.remove("pushed"));
    document.body.style.overflowX = "";
  }

  sidebarOpen?.addEventListener("click", (event) => {
    event.stopPropagation();
    openSidebar();
  });
  galleryMain?.addEventListener("click", closeSidebar);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) {
      closeSidebar();
    }
  });

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
      const grid = tile.closest(".photo-grid");

      if (!(img instanceof HTMLImageElement)) {
        return;
      }

      const width = tile.getBoundingClientRect().width;
      const height = img.naturalWidth > 0 ? (width * img.naturalHeight) / img.naturalWidth : width;
      const gridStyle = grid === null ? undefined : getComputedStyle(grid);
      const rowHeight = Number.parseFloat(gridStyle?.gridAutoRows ?? "8") || 8;
      const rowGap = Number.parseFloat(gridStyle?.rowGap ?? "0") || 0;
      const rowStride = rowHeight + rowGap;
      const rowSpan = Math.ceil((height + rowGap) / rowStride);
      tile.style.setProperty("--row-span", String(Math.max(1, rowSpan)));
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
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
  window.addEventListener("resize", layoutMasonry);
  window.addEventListener("load", layoutMasonry);
  document.querySelectorAll(".photo-tile img").forEach((img) => {
    img.addEventListener("load", layoutMasonry, { once: true });
  });
  layoutMasonry();
})();
`;

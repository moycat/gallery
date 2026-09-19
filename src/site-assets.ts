import { versionedAssetPath } from "./asset-version.js";

export const galleryCss = String.raw`
.language-switch {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 15;
  display: flex;
  align-items: center;
  padding: 2px;
  border: 1px solid rgba(255,255,255,.65);
  border-radius: 999px;
  background: rgba(250,250,250,.94);
  box-shadow: 0 6px 24px rgba(4,26,50,.22);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  font-family: system-ui, sans-serif;
}
.language-switch-trigger {
  -webkit-appearance: none;
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #0c4177;
  cursor: pointer;
}
.language-switch-icon { width: 16px; height: 16px; }
.language-switch-options {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 300px;
  margin-left: 4px;
  overflow: hidden;
  opacity: 1;
  visibility: visible;
  transition: max-width .25s ease, margin-left .25s ease, opacity .2s ease, visibility 0s;
}
.language-switch.is-collapsed .language-switch-options {
  max-width: 0;
  margin-left: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: max-width .25s ease, margin-left .25s ease, opacity .2s ease, visibility 0s .25s;
}
.language-switch.is-collapsed:is(:focus-within, .is-open) .language-switch-options {
  max-width: 300px;
  margin-left: 4px;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: max-width .25s ease, margin-left .25s ease, opacity .2s ease, visibility 0s;
}
@media (hover: hover) {
  .language-switch.is-collapsed:hover .language-switch-options {
    max-width: 300px;
    margin-left: 4px;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: max-width .25s ease, margin-left .25s ease, opacity .2s ease, visibility 0s;
  }
}
.language-switch a {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 2px 14px;
  border-radius: 999px;
  color: #0c4177;
  font-size: 14px;
  line-height: 1.25;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  flex: none;
}
.language-switch a:hover { background: #e4ecf3; }
.language-switch a[aria-current="page"] { background: #0c4177; color: #fff; }
.language-switch a:focus-visible, .language-switch-trigger:focus-visible { outline: 2px solid #c44132; outline-offset: 2px; }
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

.main-content-wrap {
  display: block;
  margin: 2rem auto 0 auto;
  max-width: 750px;
  padding-left: 20px;
  padding-right: 20px;
}

#footer {
  color: #95a5a6;
  font-size: 1.5rem;
  height: auto;
  margin-top: 30px;
  padding: 20px 20px;
  text-align: center;
}

#footer img {
  height: 1.8rem;
  vertical-align: sub;
}

#footer a {
  color: var(--gallery-link);
  display: inline-block;
  text-decoration: none;
}

#footer a:hover,
#footer a:active {
  color: var(--gallery-link);
  text-decoration: underline;
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
.photo-tile:focus-visible .photo-tile__overlay {
  opacity: 1;
}

.photo-tile__title {
  display: block;
  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;
  font-size: 1.7rem;
  line-height: 1.4;
  margin: 0 0 0.2rem;
}

.photo-tile__meta {
  display: block;
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
  inset: 0;
  margin: auto;
  max-height: min(82vh, 900px);
  max-width: min(1120px, 92vw);
  padding: 0;
  position: fixed;
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

.photo-dialog__details a {
  color: var(--gallery-link);
}

.photo-dialog__details dl a {
  border-bottom: 0;
}

.photo-dialog__actions {
  align-items: center;
  display: flex;
  gap: 1.6rem;
  justify-content: space-between;
  margin-top: 1.6rem;
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
  margin-top: 0;
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
    height: auto;
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

  .photo-dialog {
    -ms-overflow-style: none;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .photo-dialog::-webkit-scrollbar {
    display: none;
  }

  .photo-dialog__close {
    bottom: auto;
    display: block;
    margin: 0 0 0 auto;
    position: static;
    right: auto;
    top: auto;
  }

  .photo-dialog__layout {
    grid-template-columns: 1fr;
  }

  .photo-dialog__image {
    align-items: stretch;
    background: transparent;
    display: block;
    min-height: 0;
  }

  .photo-dialog__image img {
    height: auto;
    max-height: none;
    max-width: none;
    width: 100%;
  }
}
`;

export const galleryClientJs = String.raw`
(() => {
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

  function toggleSidebar() {
    if (sidebar instanceof HTMLElement && sidebar.classList.contains("pushed")) {
      closeSidebar();
      return;
    }

    openSidebar();
  }

  sidebarOpen?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSidebar();
  });
  galleryMain?.addEventListener("click", closeSidebar);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) {
      closeSidebar();
    }
  });

  const languageSwitches = document.querySelectorAll(".language-switch");

  function syncLanguageSwitch(switcher) {
    const hovered = window.matchMedia("(hover: hover)").matches && switcher.matches(":hover");
    const expanded = !switcher.classList.contains("is-collapsed") ||
      switcher.classList.contains("is-open") || switcher.matches(":focus-within") || hovered;
    switcher.querySelector(".language-switch-trigger")?.setAttribute("aria-expanded", String(expanded));
  }

  function collapseLanguageSwitches() {
    if (window.scrollY <= 0) return;
    languageSwitches.forEach((switcher) => {
      switcher.classList.add("is-collapsed");
      syncLanguageSwitch(switcher);
    });
    window.removeEventListener("scroll", collapseLanguageSwitches);
  }

  languageSwitches.forEach((switcher) => {
    const trigger = switcher.querySelector(".language-switch-trigger");
    switcher.addEventListener("mouseenter", () => syncLanguageSwitch(switcher));
    switcher.addEventListener("mouseleave", () => syncLanguageSwitch(switcher));
    switcher.addEventListener("focusin", () => syncLanguageSwitch(switcher));
    switcher.addEventListener("focusout", () => requestAnimationFrame(() => syncLanguageSwitch(switcher)));
    trigger?.addEventListener("click", (event) => {
      if (!switcher.classList.contains("is-collapsed")) return;
      if (event.detail === 0) {
        syncLanguageSwitch(switcher);
        return;
      }
      if (window.matchMedia("(hover: hover)").matches) {
        switcher.classList.remove("is-open");
        trigger.blur();
        syncLanguageSwitch(switcher);
        return;
      }
      switcher.classList.toggle("is-open");
      trigger.blur();
      syncLanguageSwitch(switcher);
    });
  });

  document.addEventListener("pointerdown", (event) => {
    languageSwitches.forEach((switcher) => {
      if (event.target instanceof Node && !switcher.contains(event.target)) {
        switcher.classList.remove("is-open");
        if (switcher.contains(document.activeElement)) document.activeElement.blur();
        syncLanguageSwitch(switcher);
      }
    });
  });
  window.addEventListener("scroll", collapseLanguageSwitches, { passive: true });
  collapseLanguageSwitches();

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

  function resetDialogScroll() {
    dialog.scrollTop = 0;
    dialog.scrollLeft = 0;
  }

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

    resetDialogScroll();
    image.addEventListener("load", resetDialogScroll, { once: true });
    image.src = photo.modalSrc;
    image.alt = photo.alt;

    if (title !== null) {
      title.textContent = photo.title || "";
      title.hidden = photo.title === undefined;
    }

    if (details !== null) {
      details.innerHTML = photo.detailsHtml;
    }

    if (original instanceof HTMLAnchorElement) {
      original.href = photo.originalPath;
    }

    const photoHash = "#photo=" + encodeURIComponent(id);
    history.replaceState(null, "", photoHash);
    document.querySelectorAll(".language-switch a").forEach(link => {
      link.hash = photoHash;
    });
    dialog.showModal();
    resetDialogScroll();
    requestAnimationFrame(resetDialogScroll);
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element ? event.target.closest("[data-photo-id]") : null;

    if (!(trigger instanceof HTMLAnchorElement)) {
      return;
    }

    event.preventDefault();
    openPhoto(trigger.dataset.photoId || "");
  });

  if (location.hash.startsWith("#photo=")) {
    try { openPhoto(decodeURIComponent(location.hash.slice(7))); } catch { /* Ignore malformed photo links. */ }
  }
  dialog.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.search);
    document.querySelectorAll(".language-switch a").forEach(link => { link.hash = ""; });
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

export const galleryCssPath = versionedAssetPath("assets/gallery.css", galleryCss);
export const galleryJsPath = versionedAssetPath("assets/gallery.js", galleryClientJs);

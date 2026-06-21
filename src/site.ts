import { defineGalleryConfig, type GalleryConfigDefinition } from "./config.js";
import { formatChineseDate } from "./exif.js";
import { buildGallery } from "./gallery-build.js";
import type {
  BuiltGallery,
  BuiltGalleryAlbum,
  BuiltGalleryPhoto,
  BuiltGalleryThumbnail,
  GalleryConfig
} from "./types.js";

interface NavigationItem {
  href: string;
  icon: string;
  label: string;
}

interface ClientPhoto {
  detailsHtml: string;
  id: string;
  modalSrc: string;
  originalPath: string;
  title: string;
}

const sidebarIntro = "Life is strange. So am I.";
const defaultDescription = "Moycat 的照片画廊。";
const aboutBioHtml = `<p>这里是 Moycat 👋<br>
        信仰存在主义与不可知论<br>
        在广袤而浅薄的土地上一路驰骋</p>
        <p>☀ · 🌈 · 🐱 · 🐳 · 🍥</p>`;
const navigationGroups: NavigationItem[][] = [
  [
    { href: "/", icon: "fa fa-home", label: "首页" },
    { href: "/albums/", icon: "fa fa-images", label: "相簿" },
    { href: "#about", icon: "fa fa-question", label: "关于" },
    { href: "https://blog.moy.cat", icon: "fa fa-feather-alt", label: "博客" }
  ],
  [
    { href: "https://t.me/moycat_official", icon: "fa fa-podcast", label: "频道" },
    { href: "https://github.com/moycat", icon: "fab fa-github", label: "GitHub" },
    { href: "https://t.me/moycat", icon: "fa fa-paper-plane", label: "Telegram" },
    { href: "mailto:i@moy.cat", icon: "fa fa-envelope", label: "邮箱" }
  ]
];

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
  return renderDocument({
    content: `<div class="gallery-page-header">
        <h1 class="gallery-page-title">${escapeHtml(config.title)}</h1>
        <p class="gallery-page-description">${escapeHtml(config.description ?? defaultDescription)}</p>
      </div>`,
    description: config.description ?? defaultDescription,
    title: config.title
  });
}

export function renderGalleryDocument(gallery: BuiltGallery): string {
  return renderDocument({
    content: renderPhotoGrid(gallery.photos, gallery),
    description: gallery.description ?? defaultDescription,
    gallery,
    title: gallery.title
  });
}

export function renderAlbumsDocument(gallery: BuiltGallery): string {
  const photoById = createPhotoMap(gallery);

  return renderDocument({
    content: `<div class="gallery-page-header">
        <h1 class="gallery-page-title">相簿</h1>
        <p class="gallery-page-description">按相簿浏览照片。</p>
      </div>
      <div class="album-grid">
        ${gallery.albums
          .map((album) => renderAlbumCard(album, photoById.get(album.coverPhotoId ?? "")))
          .join("\n")}
      </div>`,
    description: gallery.description ?? defaultDescription,
    gallery,
    title: `相簿 - ${gallery.title}`
  });
}

export function renderAlbumDocument(gallery: BuiltGallery, album: BuiltGalleryAlbum): string {
  const photoById = createPhotoMap(gallery);
  const photos = album.photoIds
    .map((photoId) => photoById.get(photoId))
    .filter((photo): photo is BuiltGalleryPhoto => photo !== undefined)
    .sort((left, right) => {
      const leftTimestamp = left.captureTimestamp ?? Number.NEGATIVE_INFINITY;
      const rightTimestamp = right.captureTimestamp ?? Number.NEGATIVE_INFINITY;

      if (leftTimestamp !== rightTimestamp) {
        return rightTimestamp - leftTimestamp;
      }

      return left.id.localeCompare(right.id, "en");
    });

  return renderDocument({
    content: `<div class="gallery-page-header">
        <h1 class="gallery-page-title">${escapeHtml(album.title)}</h1>
        ${
          album.description === undefined
            ? ""
            : `<p class="gallery-page-description">${escapeHtml(album.description)}</p>`
        }
      </div>
      ${renderPhotoGrid(photos, gallery)}`,
    description: album.description ?? gallery.description ?? defaultDescription,
    gallery,
    title: `${album.title} - ${gallery.title}`
  });
}

function renderDocument(options: {
  content: string;
  description: string;
  gallery?: BuiltGallery;
  title: string;
}): string {
  return `<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(options.title)}</title>
    <meta name="description" content="${escapeAttribute(options.description)}">
    <meta name="theme-color" content="#ffffff">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20230120">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=20230120">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=20230120">
    <link rel="shortcut icon" href="/favicon.ico?v=20230120">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Noto+Color+Emoji&family=Noto+Serif+SC:wght@200..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/vendor/fontawesome/css/all.min.css">
    <link rel="stylesheet" href="/assets/gallery.css">
    <script src="/assets/gallery.js" defer></script>
  </head>
  <body data-gallery-root="true">
    ${renderHeader(options.gallery?.title ?? options.title)}
    <div class="gallery-shell">
      ${renderSidebar()}
      <main class="gallery-main" data-gallery-main>
        ${options.content}
      </main>
    </div>
    ${renderAboutModal()}
  </body>
</html>
`;
}

function renderHeader(title: string): string {
  return `<header id="header" data-behavior="1">
      <button id="btn-open-sidebar" type="button" aria-label="打开导航" data-sidebar-open>
        <i class="fa fa-lg fa-bars" aria-hidden="true"></i>
      </button>
      <div class="header-title">
        <a class="header-title-link" href="/" aria-label="首页">${escapeHtml(title)}</a>
      </div>
    </header>`;
}

function renderSidebar(): string {
  return `<nav id="sidebar" class="gallery-sidebar" data-sidebar data-behavior="1" aria-label="主导航">
        <div class="gallery-sidebar__inner sidebar-container">
          <div class="gallery-sidebar__profile sidebar-profile">
            <a href="/" aria-label="首页">
              <img class="gallery-sidebar__avatar sidebar-profile-picture" src="/assets/images/avatar.webp" alt="头像">
            </a>
            <h4 class="gallery-sidebar__name sidebar-profile-name">Moycat</h4>
            <h5 class="gallery-sidebar__intro sidebar-profile-bio">${escapeHtml(sidebarIntro)}</h5>
          </div>
          ${navigationGroups.map(renderNavigationGroup).join("\n")}
        </div>
      </nav>`;
}

function renderNavigationGroup(items: NavigationItem[]): string {
  return `<ul class="sidebar-buttons">
              ${items.map(renderNavigationItem).join("\n")}
            </ul>`;
}

function renderNavigationItem(item: NavigationItem): string {
  const external = item.href.includes(":") && !item.href.startsWith("mailto:");
  const target = external ? ' target="_blank" rel="noopener"' : "";

  return `<li class="sidebar-button">
                <a class="sidebar-button-link" href="${escapeAttribute(item.href)}"${target} title="${escapeAttribute(item.label)}">
                  <i class="sidebar-button-icon ${escapeAttribute(item.icon)}" aria-hidden="true"></i>
                  <span class="sidebar-button-desc">${escapeHtml(item.label)}</span>
                </a>
              </li>`;
}

function renderAboutModal(): string {
  return `<div id="about" role="dialog" aria-modal="true" aria-labelledby="about-card-name" aria-hidden="true" data-about-modal>
      <div id="about-card" role="document">
        <button id="about-btn-close" type="button" aria-label="关闭" data-about-close>
          <i class="fa fa-times" aria-hidden="true"></i>
        </button>
        <img id="about-card-picture" src="/assets/images/avatar.webp" alt="头像">
        <h4 id="about-card-name">Moycat</h4>
        <div id="about-card-bio">${aboutBioHtml}</div>
        <div id="about-card-job">
          <i class="fa fa-briefcase" aria-hidden="true"></i>
          <br>
          ByteDance
        </div>
        <div id="about-card-location">
          <i class="fa fa-map-marker-alt" aria-hidden="true"></i>
          <br>
          Bellevue, WA
        </div>
      </div>
    </div>`;
}

function renderAlbumCard(
  album: BuiltGalleryAlbum,
  coverPhoto: BuiltGalleryPhoto | undefined
): string {
  const cover = coverPhoto === undefined ? "" : renderAlbumCover(coverPhoto);

  return `<a class="album-card" href="/${escapeAttribute(album.pagePath)}">
          ${cover}
          <div>
            <h2>${escapeHtml(album.title)}</h2>
            ${
              album.description === undefined
                ? `<p>${album.photoIds.length.toString()} 张照片</p>`
                : `<p>${escapeHtml(album.description)}</p>`
            }
          </div>
        </a>`;
}

function renderAlbumCover(photo: BuiltGalleryPhoto): string {
  const thumbnail = thumbnailWithName(photo, "large") ?? thumbnailWithName(photo, "medium");

  return `<img src="${escapeAttribute(toSitePath(thumbnail?.path ?? photo.thumbnailPath))}" alt="${escapeAttribute(photo.title ?? photo.id)}" loading="lazy" decoding="async">`;
}

function renderPhotoGrid(photos: BuiltGalleryPhoto[], gallery: BuiltGallery): string {
  return `<div class="photo-grid">
        ${photos.map((photo) => renderPhotoTile(photo, gallery)).join("\n")}
      </div>
      ${renderPhotoDialog()}
      <script type="application/json" id="gallery-photo-data">${escapeScriptJson(
        JSON.stringify(photos.map((photo) => serializePhotoForClient(photo, gallery)))
      )}</script>`;
}

function renderPhotoTile(photo: BuiltGalleryPhoto, gallery: BuiltGallery): string {
  const title = photo.title ?? photo.id;
  const medium = thumbnailWithName(photo, "medium") ?? thumbnailWithName(photo, "large");
  const src = toSitePath(medium?.path ?? photo.thumbnailPath);
  const srcset = photo.thumbnails
    .map((thumbnail) => `${toSitePath(thumbnail.path)} ${thumbnail.width}w`)
    .join(", ");
  const width = photo.renderedWidth === undefined ? "" : ` width="${photo.renderedWidth}"`;
  const height = photo.renderedHeight === undefined ? "" : ` height="${photo.renderedHeight}"`;
  const overlayParts = [
    formatChineseDate(photo.capturedAt),
    photo.exif?.camera,
    albumTitleForPhoto(photo, gallery)
  ].filter((part): part is string => part !== undefined && part.length > 0);

  return `<a class="photo-tile" href="${escapeAttribute(toSitePath(photo.originalPath))}" data-photo-id="${escapeAttribute(photo.id)}">
          <img src="${escapeAttribute(src)}"${srcset.length === 0 ? "" : ` srcset="${escapeAttribute(srcset)}"`} sizes="(max-width: 900px) 100vw, 33vw" alt="${escapeAttribute(title)}" loading="lazy" decoding="async"${width}${height}>
          <span class="photo-tile__overlay">
            <span>
              <span class="photo-tile__title">${escapeHtml(title)}</span>
              <span class="photo-tile__meta">${escapeHtml(overlayParts.join(" · "))}</span>
            </span>
          </span>
        </a>`;
}

function renderPhotoDialog(): string {
  return `<dialog class="photo-dialog" data-photo-dialog aria-label="照片详情">
        <button class="photo-dialog__close" type="button" data-dialog-close aria-label="关闭">
          <i class="fa fa-times" aria-hidden="true"></i>
        </button>
        <div class="photo-dialog__layout">
          <div class="photo-dialog__image">
            <img data-dialog-image alt="">
          </div>
          <aside class="photo-dialog__details">
            <h2 data-dialog-title></h2>
            <dl data-dialog-details></dl>
            <a class="photo-dialog__original" data-dialog-original target="_blank" rel="noopener">查看原图</a>
          </aside>
        </div>
      </dialog>`;
}

function serializePhotoForClient(photo: BuiltGalleryPhoto, gallery: BuiltGallery): ClientPhoto {
  const title = photo.title ?? photo.id;
  const modalThumbnail = thumbnailWithName(photo, "large") ?? thumbnailWithName(photo, "medium");

  return {
    detailsHtml: renderPhotoDetails(photo, gallery),
    id: photo.id,
    modalSrc: toSitePath(modalThumbnail?.path ?? photo.thumbnailPath),
    originalPath: toSitePath(photo.originalPath),
    title
  };
}

function renderPhotoDetails(photo: BuiltGalleryPhoto, gallery: BuiltGallery): string {
  const rows = [
    ["说明", photo.description],
    ["拍摄日期", formatChineseDate(photo.capturedAt)],
    ["拍摄设备", photo.exif?.camera],
    ["镜头", photo.exif?.lens],
    ["曝光", formatExposure(photo)],
    ["相簿", albumTitleForPhoto(photo, gallery)],
    ["文件", photo.originalFilename]
  ].filter((row): row is [string, string] => row[1] !== undefined && row[1].length > 0);

  return rows
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");
}

function formatExposure(photo: BuiltGalleryPhoto): string | undefined {
  const exif = photo.exif;

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

function albumTitleForPhoto(photo: BuiltGalleryPhoto, gallery: BuiltGallery): string | undefined {
  if (photo.albumId === undefined) {
    return undefined;
  }

  return gallery.albums.find((album) => album.id === photo.albumId)?.title;
}

function thumbnailWithName(
  photo: BuiltGalleryPhoto,
  name: BuiltGalleryThumbnail["name"]
): BuiltGalleryThumbnail | undefined {
  return photo.thumbnails.find((thumbnail) => thumbnail.name === name);
}

function createPhotoMap(gallery: BuiltGallery): Map<string, BuiltGalleryPhoto> {
  return new Map(gallery.photos.map((photo) => [photo.id, photo]));
}

function toSitePath(path: string): string {
  if (path.includes(":") || path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
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

function escapeScriptJson(value: string): string {
  return value.replace(/[<\u2028\u2029]/gu, (character) => {
    switch (character) {
      case "<":
        return "\\u003c";
      case "\u2028":
        return "\\u2028";
      case "\u2029":
        return "\\u2029";
      default:
        return character;
    }
  });
}

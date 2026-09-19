import { defineGalleryConfig, type GalleryConfigDefinition } from "./config.js";
import { formatDate, languagePath, localizeGallery, strings, type Language } from "./i18n.js";
import { buildGallery } from "./gallery-build.js";
import { galleryCssPath, galleryJsPath } from "./site-assets.js";
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
  alt: string;
  detailsHtml: string;
  id: string;
  modalSrc: string;
  originalPath: string;
  title?: string;
}

interface PhotoDetailRow {
  label: string;
  valueHtml: string;
}

const defaultDescription = "Moycat 的照片画廊。";
function navigationGroups(language: Language): NavigationItem[][] {
  const t = strings(language);
  return [
    [
      { href: languagePath("/", language), icon: "fa fa-home", label: t.home },
      { href: languagePath("/albums/", language), icon: "fa fa-images", label: t.albums },
      {
        href: language === "ca" ? "https://blog.moy.cat/ca/" : "https://blog.moy.cat",
        icon: "fa fa-pen",
        label: t.blog
      }
    ],
    [
      { href: "https://t.me/moycat_official", icon: "fa fa-podcast", label: t.channel },
      { href: "https://github.com/moycat", icon: "fab fa-github", label: "GitHub" },
      { href: "https://t.me/moycat", icon: "fa fa-paper-plane", label: "Telegram" },
      { href: "mailto:i@moy.cat", icon: "fa fa-envelope", label: t.email }
    ]
  ];
}

export async function buildStaticSite(input: GalleryConfigDefinition): Promise<void> {
  const config = defineGalleryConfig(input);

  await buildGallery({
    ...(config.description === undefined ? {} : { description: config.description }),
    ...(config.translations === undefined ? {} : { translations: config.translations }),
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

export function renderGalleryDocument(source: BuiltGallery, language: Language = "zh"): string {
  const gallery = localizeGallery(source, language);
  return renderDocument({
    language,
    pagePath: "/",
    content: renderPhotoGrid(gallery.photos, gallery, language),
    description: gallery.description ?? defaultDescription,
    gallery,
    title: gallery.title
  });
}

export function renderAlbumsDocument(source: BuiltGallery, language: Language = "zh"): string {
  const gallery = localizeGallery(source, language);
  const photoById = createPhotoMap(gallery);

  return renderDocument({
    language,
    pagePath: "/albums/",
    content: `<div class="gallery-page-header">
        <h1 class="gallery-page-title">${strings(language).albums}</h1>
      </div>
      <div class="album-grid">
        ${gallery.albums
          .map((album) => renderAlbumCard(album, photoById.get(album.coverPhotoId ?? ""), language))
          .join("\n")}
      </div>`,
    description: gallery.description ?? defaultDescription,
    gallery,
    title: `${strings(language).albums} - ${gallery.title}`
  });
}

export function renderAlbumDocument(
  source: BuiltGallery,
  sourceAlbum: BuiltGalleryAlbum,
  language: Language = "zh"
): string {
  const gallery = localizeGallery(source, language);
  const photoById = createPhotoMap(gallery);
  const album = gallery.albums.find((item) => item.id === sourceAlbum.id)!;
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
    language,
    pagePath: `/${sourceAlbum.pagePath}`,
    content: `<div class="gallery-page-header">
        <h1 class="gallery-page-title">${escapeHtml(album.title)}</h1>
        ${
          album.description === undefined
            ? ""
            : `<p class="gallery-page-description">${escapeHtml(album.description)}</p>`
        }
      </div>
      ${renderPhotoGrid(photos, gallery, language, `/${sourceAlbum.pagePath}`)}`,
    description: album.description ?? gallery.description ?? defaultDescription,
    gallery,
    title: `${album.title} - ${gallery.title}`
  });
}

function renderDocument(options: {
  language?: Language;
  pagePath?: string;
  content: string;
  description: string;
  gallery?: BuiltGallery;
  title: string;
}): string {
  const language = options.language ?? "zh";
  const pagePath = options.pagePath ?? "/";
  return `<!doctype html>
<html lang="${language === "ca" ? "ca" : "zh-Hans"}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(options.title)}</title>
    <meta name="description" content="${escapeAttribute(options.description)}">
    ${language === "ca" ? '<meta name="robots" content="noindex, follow">' : ""}
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
    <link rel="stylesheet" href="/${galleryCssPath}">
    <script src="/${galleryJsPath}" defer></script>
  </head>
  <body data-gallery-root="true">
    ${renderHeader(options.gallery?.title ?? options.title, language)}
    ${renderCover()}
    <div class="gallery-shell">
      ${renderSidebar(language)}
      <main class="gallery-main" data-gallery-main>
        ${options.content}
        ${renderFooter(language)}
      </main>
    </div>
    ${renderLanguageSwitch(pagePath, language)}
  </body>
</html>
`;
}

function renderCover(): string {
  return `<div id="cover" style="background-image:url('/assets/images/cover.webp');"></div>`;
}

function renderFooter(language: Language): string {
  const t = strings(language);
  return `<footer id="footer" class="main-content-wrap">
    <span class="copyrights" xmlns:cc="https://creativecommons.org/ns#">
        ${t.licenseBefore}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.${t.licenseLanguage}" target="_blank" rel="license noopener noreferrer">
            CC BY-NC 4.0
        </a>
        <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg">
        <img src="https://mirrors.creativecommons.org/presskit/icons/by.svg">
        <img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg">
        ${t.licenseAfter}
    </span>
</footer>`;
}

function renderHeader(title: string, language: Language): string {
  const t = strings(language);
  return `<header id="header" data-behavior="1">
      <button id="btn-open-sidebar" type="button" aria-label="${t.openNavigation}" data-sidebar-open>
        <i class="fa fa-lg fa-bars" aria-hidden="true"></i>
      </button>
      <div class="header-title">
        <a class="header-title-link" href="${languagePath("/", language)}" aria-label="${t.home}">${escapeHtml(title)}</a>
      </div>
    </header>`;
}

function renderSidebar(language: Language): string {
  const t = strings(language);
  return `<nav id="sidebar" class="gallery-sidebar" data-sidebar data-behavior="1" aria-label="${t.navigation}">
        <div class="gallery-sidebar__inner sidebar-container">
          <div class="gallery-sidebar__profile sidebar-profile">
            <a href="${languagePath("/", language)}" aria-label="${t.home}">
              <img class="gallery-sidebar__avatar sidebar-profile-picture" src="/assets/images/avatar.webp" alt="${t.avatar}">
            </a>
            <h4 class="gallery-sidebar__name sidebar-profile-name">Moycat</h4>
            <h5 class="gallery-sidebar__intro sidebar-profile-bio">${escapeHtml(t.intro)}</h5>
          </div>
          ${navigationGroups(language).map(renderNavigationGroup).join("\n")}
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

function renderAlbumCard(
  album: BuiltGalleryAlbum,
  coverPhoto: BuiltGalleryPhoto | undefined,
  language: Language
): string {
  const cover = coverPhoto === undefined ? "" : renderAlbumCover(coverPhoto);

  return `<a class="album-card" href="/${escapeAttribute(album.pagePath)}">
          ${cover}
          <div>
            <h2>${escapeHtml(album.title)}</h2>
            ${
              album.description === undefined
                ? `<p>${album.photoIds.length.toString()} ${strings(language).photos}</p>`
                : `<p>${escapeHtml(album.description)}</p>`
            }
          </div>
        </a>`;
}

function renderAlbumCover(photo: BuiltGalleryPhoto): string {
  const thumbnail = thumbnailWithName(photo, "large") ?? thumbnailWithName(photo, "medium");

  return `<img src="${escapeAttribute(toSitePath(thumbnail?.path ?? photo.thumbnailPath))}" alt="${escapeAttribute(photo.title ?? photo.id)}" loading="lazy" decoding="async">`;
}

function renderPhotoGrid(
  photos: BuiltGalleryPhoto[],
  gallery: BuiltGallery,
  language: Language,
  pagePath = "/"
): string {
  return `<div class="photo-grid">
        ${photos.map((photo) => renderPhotoTile(photo, gallery, language)).join("\n")}
      </div>
      ${renderPhotoDialog(language, pagePath)}
      <script type="application/json" id="gallery-photo-data">${escapeScriptJson(
        JSON.stringify(photos.map((photo) => serializePhotoForClient(photo, gallery, language)))
      )}</script>`;
}

function renderPhotoTile(
  photo: BuiltGalleryPhoto,
  gallery: BuiltGallery,
  language: Language
): string {
  const album = albumForPhoto(photo, gallery);
  const medium = thumbnailWithName(photo, "medium") ?? thumbnailWithName(photo, "large");
  const src = toSitePath(medium?.path ?? photo.thumbnailPath);
  const srcset = photo.thumbnails
    .map((thumbnail) => `${toSitePath(thumbnail.path)} ${thumbnail.width}w`)
    .join(", ");
  const width = photo.renderedWidth === undefined ? "" : ` width="${photo.renderedWidth}"`;
  const height = photo.renderedHeight === undefined ? "" : ` height="${photo.renderedHeight}"`;
  const cameraLine = [photo.exif?.camera, album?.title].filter(isNonEmptyString).join(" · ");
  const overlayLines = [formatDate(photo.capturedAt, language), cameraLine].filter(
    isNonEmptyString
  );
  const titleLine =
    photo.title === undefined
      ? ""
      : `<span class="photo-tile__title">${escapeHtml(photo.title)}</span>`;

  return `<a class="photo-tile" href="${escapeAttribute(toSitePath(photo.originalPath))}" data-photo-id="${escapeAttribute(photo.id)}">
          <img src="${escapeAttribute(src)}"${srcset.length === 0 ? "" : ` srcset="${escapeAttribute(srcset)}"`} sizes="(max-width: 900px) 100vw, 33vw" alt="${escapeAttribute(photo.title ?? photo.id)}" loading="lazy" decoding="async"${width}${height}>
          <span class="photo-tile__overlay">
            <span>
              ${titleLine}
              ${overlayLines.map((line) => `<span class="photo-tile__meta">${escapeHtml(line)}</span>`).join("\n              ")}
            </span>
          </span>
        </a>`;
}

function renderPhotoDialog(language: Language, pagePath: string): string {
  const t = strings(language);
  return `<dialog class="photo-dialog" data-photo-dialog aria-label="${t.photoDetails}">
        <div class="photo-dialog__layout">
          <div class="photo-dialog__image">
            <img data-dialog-image alt="">
          </div>
          <aside class="photo-dialog__details">
            <h2 data-dialog-title></h2>
            <dl data-dialog-details></dl>
            <div class="photo-dialog__actions">
              <a class="photo-dialog__original" data-dialog-original target="_blank" rel="noopener">${t.original}</a>
              <button class="photo-dialog__close" type="button" data-dialog-close aria-label="${t.close}">
                <i class="fa fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </aside>
        </div>
        ${renderLanguageSwitch(pagePath, language)}
      </dialog>`;
}

function serializePhotoForClient(
  photo: BuiltGalleryPhoto,
  gallery: BuiltGallery,
  language: Language
): ClientPhoto {
  const modalThumbnail = thumbnailWithName(photo, "large") ?? thumbnailWithName(photo, "medium");

  return {
    alt: photo.title ?? photo.id,
    detailsHtml: renderPhotoDetails(photo, gallery, language),
    id: photo.id,
    modalSrc: toSitePath(modalThumbnail?.path ?? photo.thumbnailPath),
    originalPath: toSitePath(photo.originalPath),
    ...(photo.title === undefined ? {} : { title: photo.title })
  };
}

function renderPhotoDetails(
  photo: BuiltGalleryPhoto,
  gallery: BuiltGallery,
  language: Language
): string {
  const album = albumForPhoto(photo, gallery);
  const rows = [
    textDetailRow(strings(language).description, photo.description),
    textDetailRow(strings(language).date, formatDate(photo.capturedAt, language)),
    textDetailRow(strings(language).location, photo.exif?.location),
    textDetailRow(strings(language).camera, photo.exif?.camera),
    textDetailRow(strings(language).lens, photo.exif?.lens),
    textDetailRow(strings(language).exposure, formatExposure(photo)),
    album === undefined
      ? undefined
      : {
          label: strings(language).albums,
          valueHtml: `<a href="/${escapeAttribute(album.pagePath)}">${escapeHtml(album.title)}</a>`
        }
  ].filter((row): row is PhotoDetailRow => row !== undefined);

  return rows.map((row) => `<dt>${escapeHtml(row.label)}</dt><dd>${row.valueHtml}</dd>`).join("");
}

function textDetailRow(label: string, value: string | undefined): PhotoDetailRow | undefined {
  if (!isNonEmptyString(value)) {
    return undefined;
  }

  return {
    label,
    valueHtml: escapeHtml(value)
  };
}

function formatExposure(photo: BuiltGalleryPhoto): string | undefined {
  const exif = photo.exif;

  if (exif === undefined) {
    return undefined;
  }

  const parts = [
    exif.aperture === undefined ? undefined : `f/${formatDecimal(exif.aperture)}`,
    exif.shutterSpeed,
    exif.iso === undefined ? undefined : `ISO ${exif.iso}`,
    exif.focalLengthMm === undefined ? undefined : `${formatDecimal(exif.focalLengthMm)}mm`
  ].filter((part): part is string => part !== undefined);

  return parts.length === 0 ? undefined : parts.join(" ");
}

function formatDecimal(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/u, "");
}

function albumForPhoto(
  photo: BuiltGalleryPhoto,
  gallery: BuiltGallery
): BuiltGalleryAlbum | undefined {
  if (photo.albumId === undefined) {
    return undefined;
  }

  return gallery.albums.find((album) => album.id === photo.albumId);
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

function isNonEmptyString(value: string | undefined): value is string {
  return value !== undefined && value.length > 0;
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

function renderLanguageSwitch(path: string, language: Language): string {
  return `<nav class="language-switch" aria-label="${strings(language).switchLanguage}">
    <button class="language-switch-trigger" type="button" aria-label="${strings(language).switchLanguage}" aria-expanded="true">
      <svg class="language-switch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></svg>
    </button>
    <span class="language-switch-options">
      <a href="${escapeAttribute(languagePath(path, "zh"))}" lang="zh-Hans" hreflang="zh-Hans"${language === "zh" ? ' aria-current="page"' : ""}>中文</a>
      <a href="${escapeAttribute(languagePath(path, "ca"))}" lang="ca" hreflang="ca"${language === "ca" ? ' aria-current="page"' : ""}>Català</a>
    </span>
  </nav>`;
}

import { describe, expect, it } from "vitest";

import { renderAlbumDocument, renderAlbumsDocument, renderGalleryDocument } from "../src/site.js";
import { galleryClientJs, galleryCss } from "../src/site-assets.js";
import type { BuiltGallery } from "../src/types.js";

const gallery: BuiltGallery = {
  albums: [
    {
      coverPhotoId: "cats-miso",
      description: "家里的猫",
      id: "cats",
      metadataPath: "photos/cats.yml",
      pagePath: "albums/cats/",
      photoIds: ["cats-miso"],
      sourceDir: "photos/cats",
      title: "猫"
    }
  ],
  photos: [
    {
      albumId: "cats",
      capturedAt: "2024-05-01T12:00:00.000Z",
      captureTimestamp: Date.parse("2024-05-01T12:00:00.000Z"),
      exif: {
        aperture: 1.7999999523162842,
        camera: "FUJIFILM X100VI",
        capturedAt: "2024-05-01T12:00:00.000Z",
        focalLengthMm: 6.860000133514404,
        lens: "23mm"
      },
      id: "cats-miso",
      metadataPath: "photos/cats/miso.yml",
      originalExtension: "jpg",
      originalFilename: "miso.jpg",
      originalPath: "assets/originals/cats-miso.jpg",
      renderedHeight: 900,
      renderedWidth: 1200,
      sourcePath: "photos/cats/miso.jpg",
      thumbnailPath: "assets/photos/cats-miso.webp",
      thumbnails: [
        {
          format: "webp",
          height: 360,
          name: "small",
          path: "assets/photos/cats-miso-small.webp",
          width: 480
        },
        {
          format: "webp",
          height: 720,
          name: "medium",
          path: "assets/photos/cats-miso-medium.webp",
          width: 960
        },
        {
          format: "webp",
          height: 900,
          name: "large",
          path: "assets/photos/cats-miso-large.webp",
          width: 1200
        }
      ],
      title: "窗边"
    },
    {
      capturedAt: "2025-01-01T12:00:00.000Z",
      captureTimestamp: Date.parse("2025-01-01T12:00:00.000Z"),
      id: "outside",
      metadataPath: "photos/outside.yml",
      originalExtension: "jpg",
      originalFilename: "outside.jpg",
      originalPath: "assets/originals/outside.jpg",
      renderedHeight: 900,
      renderedWidth: 1200,
      sourcePath: "photos/outside.jpg",
      thumbnailPath: "assets/photos/outside.webp",
      thumbnails: [
        {
          format: "webp",
          height: 720,
          name: "medium",
          path: "assets/photos/outside-medium.webp",
          width: 960
        }
      ],
      title: "路上"
    },
    {
      capturedAt: "2025-02-01T12:00:00.000Z",
      captureTimestamp: Date.parse("2025-02-01T12:00:00.000Z"),
      id: "untitled-file",
      metadataPath: "photos/untitled-file.yml",
      originalExtension: "jpg",
      originalFilename: "untitled-file.jpg",
      originalPath: "assets/originals/untitled-file.jpg",
      renderedHeight: 900,
      renderedWidth: 1200,
      sourcePath: "photos/untitled-file.jpg",
      thumbnailPath: "assets/photos/untitled-file.webp",
      thumbnails: [
        {
          format: "webp",
          height: 720,
          name: "medium",
          path: "assets/photos/untitled-file-medium.webp",
          width: 960
        }
      ]
    }
  ],
  title: "Moycat 的相册",
  unalbumedPhotoIds: []
};

describe("site rendering", () => {
  it("renders the home timeline as a Chinese static document", () => {
    const html = renderGalleryDocument(gallery);

    expect(html).toContain('<html lang="zh-Hans">');
    expect(html).toContain("<title>Moycat 的相册</title>");
    expect(html).toContain("Life is strange. So am I.");
    expect(html).toContain("首页");
    expect(html).toContain("相簿");
    expect(html).toContain("频道");
    expect(html).toContain("GitHub");
    expect(html).toContain("Telegram");
    expect(html).toContain("邮箱");
    expect(html).toContain("博客");
    expect(html).toContain("https://blog.moy.cat");
    expect(html).toContain('<footer id="footer" class="main-content-wrap">');
    expect(html).toContain("本站内容以");
    expect(html).toContain('href="https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans"');
    expect(html).toContain("CC BY-NC 4.0");
    expect(html).toContain("https://mirrors.creativecommons.org/presskit/icons/cc.svg");
    expect(html).toContain("https://mirrors.creativecommons.org/presskit/icons/by.svg");
    expect(html).toContain("https://mirrors.creativecommons.org/presskit/icons/nc.svg");
    expect(html).toContain("协议发布");
    expect(html).toContain(
      '<div id="cover" style="background-image:url(\'/assets/images/cover.webp\');"></div>'
    );
    expect(html).toContain('class="sidebar-button-icon fa fa-home"');
    expect(html).toContain('class="sidebar-button-icon fa fa-images"');
    expect(html).toContain('class="sidebar-button-icon fa fa-pen"');
    const firstNavigationGroup = html.match(/<ul class="sidebar-buttons">([\s\S]*?)<\/ul>/)?.[1];
    expect(firstNavigationGroup).toContain('href="/"');
    expect(firstNavigationGroup).toContain('href="/albums/"');
    expect(firstNavigationGroup).toContain('href="https://blog.moy.cat"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('data-photo-id="cats-miso"');
    expect(html).toContain("2024年5月1日");
    expect(html).toContain("FUJIFILM X100VI");
    expect(html).toContain('src="/assets/photos/cats-miso-medium.webp"');
    expect(html).toContain('srcset="/assets/photos/cats-miso-small.webp 480w');
    expect(html).toContain('id="gallery-photo-data"');
    expect(html).toContain('<span class="photo-tile__title">窗边</span>');
    expect(html).toContain('<span class="photo-tile__meta">2024年5月1日</span>');
    expect(html).toContain('<span class="photo-tile__meta">FUJIFILM X100VI · 猫</span>');
  });

  it("does not display filenames for photos without explicit titles", () => {
    const html = renderGalleryDocument(gallery);
    const untitledTile = html.match(
      /<a class="photo-tile" href="[^"]+" data-photo-id="untitled-file"[\s\S]*?<\/a>/
    )?.[0];
    const photoData = JSON.parse(
      html.match(
        /<script type="application\/json" id="gallery-photo-data">([\s\S]*?)<\/script>/
      )?.[1] ?? "[]"
    ) as { detailsHtml: string; id: string; title?: string }[];
    const untitledPhoto = photoData.find((photo) => photo.id === "untitled-file");

    expect(untitledTile).toBeDefined();
    expect(untitledTile).not.toContain("photo-tile__title");
    expect(untitledTile).not.toContain(">untitled-file<");
    expect(untitledPhoto).toBeDefined();
    expect(untitledPhoto).not.toHaveProperty("title");
    expect(untitledPhoto?.detailsHtml).not.toContain("untitled-file");
    expect(galleryClientJs).toContain("title.hidden = photo.title === undefined");
  });

  it("renders the album list with cover photos", () => {
    const html = renderAlbumsDocument(gallery);

    expect(html).toContain("<title>相簿 - Moycat 的相册</title>");
    expect(html).toContain("<h1");
    expect(html).toContain("相簿");
    expect(html).toContain("家里的猫");
    expect(html).toContain('href="/albums/cats/"');
    expect(html).toContain('src="/assets/photos/cats-miso-large.webp"');
  });

  it("renders an album page with heading and filtered photos", () => {
    const html = renderAlbumDocument(gallery, gallery.albums[0]!);
    const renderedPhotoIds = Array.from(html.matchAll(/data-photo-id="([^"]+)"/gu)).map(
      (match) => match[1]
    );

    expect(html).toContain("<title>猫 - Moycat 的相册</title>");
    expect(html).toContain("猫");
    expect(html).toContain("家里的猫");
    expect(renderedPhotoIds).toEqual(["cats-miso"]);
  });

  it("renders accessible modal and navigation structure", () => {
    const html = renderGalleryDocument(gallery);

    expect(html).toContain('<header id="header" data-behavior="1">');
    expect(html).toContain('id="btn-open-sidebar"');
    expect(html).toContain("data-sidebar-open");
    expect(html).toContain("data-sidebar");
    expect(html).toContain("data-gallery-main");
    expect(html).toContain('aria-label="主导航"');
    expect(html).toContain('aria-label="照片详情"');
    expect(html).toContain("data-photo-dialog");
    expect(html).toContain("data-dialog-close");
    expect(html).toContain('<i class="fa fa-times" aria-hidden="true"></i>');
    expect(html).toContain("查看原图");
  });

  it("renders concise photo details in the dialog data", () => {
    const html = renderGalleryDocument(gallery);
    const photoData = JSON.parse(
      html.match(
        /<script type="application\/json" id="gallery-photo-data">([\s\S]*?)<\/script>/
      )?.[1] ?? "[]"
    ) as { detailsHtml: string }[];
    const detailsHtml = photoData[0]?.detailsHtml ?? "";

    expect(detailsHtml).toContain("<dt>日期</dt><dd>2024年5月1日</dd>");
    expect(detailsHtml).toContain("<dt>设备</dt><dd>FUJIFILM X100VI</dd>");
    expect(detailsHtml).toContain("<dt>曝光</dt><dd>f/1.8 6.86mm</dd>");
    expect(detailsHtml).toContain('<dt>相簿</dt><dd><a href="/albums/cats/">猫</a></dd>');
  });

  it("keeps album detail links un-underlined while preserving original-photo link styling", () => {
    expect(galleryCss).toContain(".photo-dialog__details a");
    expect(galleryCss).toContain(".photo-dialog__details dl a");
    expect(galleryCss).toContain("border-bottom: 0");
    expect(galleryCss).toContain(".photo-dialog__original");
    expect(galleryCss).toContain("border-bottom: 1px solid currentColor");
    expect(galleryCss).toContain("color: var(--gallery-link)");
  });

  it("matches the blog footer license treatment", () => {
    expect(galleryCss).toContain("#footer");
    expect(galleryCss).toContain("color: #95a5a6");
    expect(galleryCss).toContain("font-size: 1.5rem");
    expect(galleryCss).toContain("text-align: center");
    expect(galleryCss).toContain("margin-top: 30px");
    expect(galleryCss).toContain("padding: 20px 20px");
    expect(galleryCss).toContain("#footer img");
    expect(galleryCss).toContain("height: 1.8rem");
    expect(galleryCss).toContain("vertical-align: sub");
    expect(galleryCss).toContain("#footer a");
    expect(galleryCss).toContain("color: var(--gallery-link)");
    expect(galleryCss).toContain("display: inline-block");
    expect(galleryCss).toContain("#footer a:hover");
    expect(galleryCss).toContain("text-decoration: underline");
  });

  it("shows photo overlays on hover and keyboard focus", () => {
    expect(galleryCss).toContain(".photo-tile:hover .photo-tile__overlay");
    expect(galleryCss).toContain(".photo-tile:focus-visible .photo-tile__overlay");
  });

  it("keeps the fixed sidebar from covering the gallery content", () => {
    expect(galleryCss).toContain("grid-column: 2");
    expect(galleryCss).toMatch(/\.gallery-main \{[^}]*min-height: 100vh/);
  });

  it("keeps sidebar interactions aligned with the blog", () => {
    expect(galleryCss).toContain("filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.1))");
    expect(galleryCss).toContain("transform: translate(0, -0.4rem)");
    expect(galleryCss).toContain("height: 45px");
    expect(galleryCss).toContain("#cover");
    expect(galleryCss).toContain("background-image: url('/assets/images/cover.webp')");
    expect(galleryCss).toContain("pointer-events: none");
    expect(galleryCss).toContain("z-index: 0");
    expect(galleryCss).toContain("background: var(--gallery-bg)");
    expect(galleryCss).toContain("background: rgba(17, 26, 35, 0)");
    expect(galleryCss).toContain("color: rgba(255, 255, 255, 0.9)");
    expect(galleryCss).toContain("color: white");
    expect(galleryCss).toContain("text-shadow: 0 0 2px rgba(0, 0, 0, 0.3)");
    expect(galleryCss).toContain(".sidebar-profile-bio");
    expect(galleryCss).toContain(
      '.sidebar-profile-bio {\n  color: white;\n  font-family: "Noto Serif", "Noto Color Emoji", "Noto Serif SC", serif;'
    );
    expect(galleryCss).toContain("@media (max-width: 1023px)");
    expect(galleryCss).toContain("--gallery-sidebar: 75px");
    expect(galleryCss).toContain("@media (max-width: 767px)");
    expect(galleryCss).toContain("left: -250px");
    expect(galleryCss).toContain(".gallery-sidebar.pushed");
    expect(galleryCss).toContain("#header.pushed");
    expect(galleryCss).toContain(".gallery-main.pushed");
    expect(galleryClientJs).toContain("[data-sidebar-open]");
    expect(galleryClientJs).toContain('classList.add("pushed")');
    expect(galleryClientJs).toContain('classList.remove("pushed")');
  });

  it("supports the requested mobile sidebar drawer behavior", () => {
    expect(galleryCss).toMatch(
      /@media \(max-width: 767px\) \{[\s\S]*\.gallery-sidebar__profile \{[\s\S]*height: auto/
    );
    expect(galleryClientJs).toContain("function toggleSidebar()");
    expect(galleryClientJs).toContain('classList.contains("pushed")');
    expect(galleryClientJs).toContain("toggleSidebar();");
  });

  it("keeps the mobile photo modal full-bleed and scrollbar-free", () => {
    expect(galleryCss).toMatch(
      /\.photo-dialog \{[\s\S]*inset: 0;[\s\S]*margin: auto;[\s\S]*position: fixed/
    );
    expect(galleryCss).toMatch(
      /@media \(max-width: 767px\) \{[\s\S]*\.photo-dialog \{[\s\S]*scrollbar-width: none/
    );
    expect(galleryCss).toContain(".photo-dialog::-webkit-scrollbar");
    expect(galleryCss).toMatch(
      /@media \(max-width: 767px\) \{[\s\S]*\.photo-dialog__close \{[\s\S]*display: none/
    );
    expect(galleryCss).toMatch(
      /@media \(max-width: 767px\) \{[\s\S]*\.photo-dialog__image \{[\s\S]*background: transparent[\s\S]*min-height: 0/
    );
    expect(galleryCss).toMatch(
      /@media \(max-width: 767px\) \{[\s\S]*\.photo-dialog__image img \{[\s\S]*max-height: none[\s\S]*width: 100%/
    );
    expect(galleryClientJs).toContain("function resetDialogScroll()");
    expect(galleryClientJs).toContain("dialog.scrollTop = 0");
    expect(galleryClientJs).toContain(
      'image.addEventListener("load", resetDialogScroll, { once: true })'
    );
    expect(galleryClientJs).toContain("requestAnimationFrame(resetDialogScroll)");
  });

  it("closes the photo modal when the user clicks outside its card", () => {
    expect(galleryClientJs).toContain("event.target === dialog");
  });

  it("reads masonry spacing from CSS instead of hard-coded gutter math", () => {
    expect(galleryCss).toContain("align-items: stretch");
    expect(galleryCss).toContain("column-gap: 11px");
    expect(galleryCss).toContain("row-gap: 11px");
    expect(galleryCss).toContain("background: transparent");
    expect(galleryClientJs).toContain("rowGap");
  });
});

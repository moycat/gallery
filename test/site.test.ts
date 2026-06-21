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
        camera: "FUJIFILM X100VI",
        capturedAt: "2024-05-01T12:00:00.000Z",
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
    expect(html).toContain("关于");
    expect(html).toContain('href="#about"');
    expect(html).toContain("频道");
    expect(html).toContain("GitHub");
    expect(html).toContain("Telegram");
    expect(html).toContain("邮箱");
    expect(html).toContain("博客");
    expect(html).toContain("https://blog.moy.cat");
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('data-photo-id="cats-miso"');
    expect(html).toContain("2024年5月1日");
    expect(html).toContain("FUJIFILM X100VI");
    expect(html).toContain('src="/assets/photos/cats-miso-medium.webp"');
    expect(html).toContain('srcset="/assets/photos/cats-miso-small.webp 480w');
    expect(html).toContain('id="gallery-photo-data"');
  });

  it("renders the album list with cover photos", () => {
    const html = renderAlbumsDocument(gallery);

    expect(html).toContain("<h1");
    expect(html).toContain("相簿");
    expect(html).toContain("家里的猫");
    expect(html).toContain('href="/albums/cats/"');
    expect(html).toContain('src="/assets/photos/cats-miso-large.webp"');
  });

  it("renders an album page with heading and filtered photos", () => {
    const html = renderAlbumDocument(gallery, gallery.albums[0]!);

    expect(html).toContain("猫");
    expect(html).toContain("家里的猫");
    expect(html).toContain('data-photo-id="cats-miso"');
    expect(html).not.toContain('data-photo-id="outside"');
  });

  it("renders accessible modal and navigation structure", () => {
    const html = renderGalleryDocument(gallery);

    expect(html).toContain('aria-label="主导航"');
    expect(html).toContain('aria-label="照片详情"');
    expect(html).toContain("data-photo-dialog");
    expect(html).toContain("data-dialog-close");
    expect(html).toContain('<i class="fa fa-times" aria-hidden="true"></i>');
    expect(html).toContain("查看原图");
    expect(html).not.toContain('data-dialog-close aria-label="关闭">关闭</button>');
  });

  it("renders the blog-style about modal on every gallery page", () => {
    const html = renderGalleryDocument(gallery);

    expect(html).toContain('id="about"');
    expect(html).toContain('id="about-card"');
    expect(html).toContain('id="about-btn-close"');
    expect(html).toContain("这里是 Moycat");
    expect(html).not.toContain('href="/about/"');
  });

  it("keeps CSS grid from dense backfilling over chronological order", () => {
    expect(galleryCss).not.toContain("grid-auto-flow: dense");
  });

  it("keeps the fixed sidebar from covering the gallery content", () => {
    expect(galleryCss).toContain("grid-column: 2");
  });

  it("keeps sidebar interactions aligned with the blog", () => {
    expect(galleryCss).toContain("filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.1))");
    expect(galleryCss).toContain("transform: translate(0, -0.4rem)");
    expect(galleryCss).toContain("height: 45px");
  });

  it("closes modals when the user clicks outside their card", () => {
    expect(galleryClientJs).toContain("event.target === dialog");
    expect(galleryClientJs).toContain("event.target === about");
  });

  it("reads masonry spacing from CSS instead of hard-coded gutter math", () => {
    expect(galleryCss).toContain("align-items: stretch");
    expect(galleryCss).toContain("column-gap: 11px");
    expect(galleryCss).toContain("row-gap: 11px");
    expect(galleryCss).toContain("background: transparent");
    expect(galleryClientJs).toContain("rowGap");
    expect(galleryClientJs).not.toContain("+ 11");
  });
});

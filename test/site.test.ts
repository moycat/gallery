import { describe, expect, it } from "vitest";

describe("buildStaticSite", () => {
  it("renders a Cloudflare Pages-ready album document", async () => {
    const { renderGalleryDocument } = await import("../src/site.js");
    const html = renderGalleryDocument({
      title: "Moycat & Friends",
      albums: [
        {
          id: "abc",
          metadataPath: "photos/abc.yml",
          photoIds: ["abc-haha"],
          sourceDir: "photos/abc",
          title: "Album <ABC>",
          weight: 1
        }
      ],
      photos: [
        {
          id: "abc-haha",
          albumId: "abc",
          metadataPath: "photos/abc/haha.yml",
          originalExtension: "jpg",
          originalFilename: "haha.jpg",
          originalPath: "assets/originals/abc-haha.jpg",
          sourcePath: "photos/abc/haha.jpg",
          thumbnailPath: "assets/photos/abc-haha.webp",
          title: "Photo & Title"
        }
      ],
      unalbumedPhotoIds: []
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Moycat &amp; Friends</title>");
    expect(html).toContain('data-gallery-root="true"');
    expect(html).toContain("Album &lt;ABC&gt;");
    expect(html).toContain("Photo &amp; Title");
    expect(html).toContain('href="assets/originals/abc-haha.jpg"');
  });
});

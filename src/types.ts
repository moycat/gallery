export interface ThumbnailSize {
  name: string;
  width: number;
  height?: number;
  format: "avif" | "jpeg" | "webp";
}

export interface PhotoExif {
  aperture?: number;
  camera?: string;
  capturedAt?: string;
  focalLengthMm?: number;
  iso?: number;
  latitude?: number;
  lens?: string;
  location?: string;
  longitude?: number;
  shutterSpeed?: string;
}

export interface PhotoMetadata {
  id: string;
  source: string;
  albumIds: string[];
  description?: string;
  exif?: PhotoExif;
  takenAt?: string;
  title?: string;
}

export interface AlbumMetadata {
  id: string;
  title: string;
  coverPhotoId?: string;
  description?: string;
  photoIds: string[];
  weight?: number;
}

export interface GalleryConfig {
  title: string;
  albums: AlbumMetadata[];
  contentDir: string;
  outputDir: string;
  photos: PhotoMetadata[];
  thumbnailDir: string;
  thumbnailSizes: ThumbnailSize[];
  description?: string;
}

export interface GalleryConfigInput {
  title: string;
  albums?: AlbumMetadata[];
  contentDir?: string;
  description?: string;
  outputDir?: string;
  photos?: PhotoMetadata[];
  thumbnailDir?: string;
  thumbnailSizes?: ThumbnailSize[];
}

export interface GallerySourceAlbum {
  coverPhotoId?: string;
  description?: string;
  id: string;
  metadataPath: string;
  photoIds: string[];
  sourceDir: string;
  title: string;
  weight?: number;
}

export interface GallerySourcePhoto {
  id: string;
  metadataPath: string;
  originalExtension: "jpg" | "jpeg" | "png";
  originalFilename: string;
  sourcePath: string;
  albumId?: string;
  description?: string;
  exif?: PhotoExif;
  title?: string;
}

export interface GallerySource {
  albums: GallerySourceAlbum[];
  photos: GallerySourcePhoto[];
  unalbumedPhotoIds: string[];
}

export interface BuiltGalleryThumbnail {
  format: ThumbnailSize["format"];
  height: number;
  name: string;
  path: string;
  width: number;
}

export interface BuiltGalleryPhoto extends GallerySourcePhoto {
  capturedAt?: string;
  captureTimestamp?: number;
  originalPath: string;
  renderedHeight?: number;
  renderedWidth?: number;
  thumbnailPath: string;
  thumbnails: BuiltGalleryThumbnail[];
}

export interface BuiltGalleryAlbum extends GallerySourceAlbum {
  pagePath: string;
}

export interface BuiltGallery {
  albums: BuiltGalleryAlbum[];
  photos: BuiltGalleryPhoto[];
  title: string;
  unalbumedPhotoIds: string[];
  description?: string;
}

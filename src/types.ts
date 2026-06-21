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

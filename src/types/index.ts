export type ApiErrorResponse = {
  error: string;
};

export type CollectionSummary = {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  coverPhotoUrl: string | null;
  photoCount: number;
  updatedAt: string;
};

export type PhotoMetadataSummary = {
  takenAt: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  iso: number | null;
  aperture: number | null;
  shutterSpeed: number | null;
  focalLength: number | null;
  latitude: number | null;
  longitude: number | null;
};

export type PhotoColorPaletteSummary = {
  dominantHex: string | null;
  paletteJson: unknown;
  brightnessScore: number | null;
  warmthScore: number | null;
  contrastScore: number | null;
};

export type PhotoSummary = {
  id: string;
  originalFilename: string;
  secureUrl: string;
  thumbnailUrl: string | null;
  format: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  uploadedAt: string;
  metadata: PhotoMetadataSummary | null;
  colorPalette: PhotoColorPaletteSummary | null;
};

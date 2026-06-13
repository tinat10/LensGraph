import type { PhotoCardData } from "@/components/photos/PhotoCard";

export type PhotoTagSummary = {
  id: string;
  name: string;
  type: string;
};

export type PhotoSearchFilters = {
  collectionId?: string;
  query?: string;
  tag?: string;
  location?: string;
  cameraMake?: string;
  cameraModel?: string;
  colorHex?: string;
  takenAfter?: Date;
  takenBefore?: Date;
  semanticQuery?: string;
  similarToPhotoId?: string;
};

type PrismaPhoto = {
  id: string;
  originalFilename: string;
  secureUrl: string;
  thumbnailUrl: string | null;
  format: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  uploadedAt: Date;
  metadata: PhotoCardData["metadata"] & Record<string, unknown> | null;
  colorPalette: PhotoCardData["colorPalette"] & Record<string, unknown> | null;
  tags?: { tag: PhotoTagSummary }[];
};

export function serializePhoto(
  photo: PrismaPhoto,
  coverPhotoId?: string | null,
): PhotoCardData {
  return {
    id: photo.id,
    originalFilename: photo.originalFilename,
    secureUrl: photo.secureUrl,
    thumbnailUrl: photo.thumbnailUrl,
    format: photo.format,
    width: photo.width,
    height: photo.height,
    fileSize: photo.fileSize,
    uploadedAt: photo.uploadedAt.toISOString(),
    metadata: photo.metadata,
    colorPalette: photo.colorPalette,
    tags: photo.tags?.map((entry) => entry.tag) ?? [],
    isCover: coverPhotoId === photo.id,
  };
}

export function parsePhotoSearchParams(
  searchParams: URLSearchParams,
  collectionId: string,
): PhotoSearchFilters {
  const takenAfter = searchParams.get("takenAfter");
  const takenBefore = searchParams.get("takenBefore");

  return {
    collectionId,
    query: searchParams.get("query")?.trim() || undefined,
    tag: searchParams.get("tag")?.trim() || undefined,
    location: searchParams.get("location")?.trim() || undefined,
    cameraMake: searchParams.get("cameraMake")?.trim() || undefined,
    cameraModel: searchParams.get("cameraModel")?.trim() || undefined,
    colorHex: searchParams.get("colorHex")?.trim() || undefined,
    takenAfter: takenAfter ? new Date(takenAfter) : undefined,
    takenBefore: takenBefore ? new Date(takenBefore) : undefined,
    semanticQuery: searchParams.get("semanticQuery")?.trim() || undefined,
    similarToPhotoId:
      searchParams.get("similarToPhotoId")?.trim() || undefined,
  };
}

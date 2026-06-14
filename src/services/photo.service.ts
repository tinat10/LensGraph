import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  buildProcessingUrl,
  buildThumbnailUrl,
  fetchImageBufferFromUrl,
  uploadImageBuffer,
} from "@/lib/cloudinary/client";
import {
  getCollectionUploadFolder,
  isCloudinaryPublicIdInFolder,
} from "@/lib/cloudinary/sign-upload";
import {
  extractColorPalette,
  extractImageMetadata,
  type ExtractedColorPalette,
} from "@/lib/image-processing";
import { getCollectionForUser } from "@/services/collection.service";

export type UploadPhotoResult = {
  id: string;
  originalFilename: string;
  secureUrl: string;
  thumbnailUrl: string | null;
};

export type CloudinaryRegisteredUpload = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format?: string;
  originalFilename: string;
};

async function createPhotoRecord(
  collectionId: string,
  upload: {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    bytes: number;
  },
  originalFilename: string,
  buffer: Buffer | null,
  formatHint?: string | null,
) {
  let metadata = {
    format: formatHint ?? undefined,
    width: upload.width,
    height: upload.height,
    fileSize: upload.bytes,
    takenAt: undefined as Date | undefined,
    cameraMake: undefined as string | undefined,
    cameraModel: undefined as string | undefined,
    lensModel: undefined as string | undefined,
    focalLength: undefined as number | undefined,
    aperture: undefined as number | undefined,
    shutterSpeed: undefined as number | undefined,
    iso: undefined as number | undefined,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    rawExifJson: undefined as Record<string, unknown> | null | undefined,
  };
  let palette: ExtractedColorPalette | null = null;

  if (buffer) {
    try {
      const extracted = await extractImageMetadata(buffer);
      metadata = { ...metadata, ...extracted };
    } catch (error) {
      console.warn("[photo] metadata extraction failed:", error);
    }

    try {
      palette = await extractColorPalette(buffer);
    } catch (error) {
      console.warn("[photo] palette extraction failed:", error);
    }
  }

  return prisma.photo.create({
    data: {
      collectionId,
      cloudinaryPublicId: upload.public_id,
      secureUrl: upload.secure_url,
      thumbnailUrl: buildThumbnailUrl(upload.public_id),
      originalFilename,
      format: metadata.format ?? formatHint ?? null,
      width: metadata.width ?? upload.width,
      height: metadata.height ?? upload.height,
      fileSize: metadata.fileSize ?? upload.bytes,
      uploadedAt: new Date(),
      metadata: {
        create: {
          takenAt: metadata.takenAt,
          cameraMake: metadata.cameraMake,
          cameraModel: metadata.cameraModel,
          lensModel: metadata.lensModel,
          focalLength: metadata.focalLength,
          aperture: metadata.aperture,
          shutterSpeed: metadata.shutterSpeed,
          iso: metadata.iso,
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          rawExifJson: (metadata.rawExifJson ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      },
      ...(palette
        ? {
            colorPalette: {
              create: palette,
            },
          }
        : {}),
    },
  });
}

async function loadProcessingBuffer(
  publicId: string,
  secureUrl: string,
): Promise<Buffer | null> {
  const processingUrl = buildProcessingUrl(publicId);
  const converted = await fetchImageBufferFromUrl(processingUrl);
  if (converted) {
    return converted;
  }

  return fetchImageBufferFromUrl(secureUrl);
}

export async function registerPhotosFromCloudinary(
  collectionId: string,
  userId: string,
  uploads: CloudinaryRegisteredUpload[],
): Promise<UploadPhotoResult[]> {
  const collection = await getCollectionForUser(collectionId, userId);
  if (!collection) {
    throw new Error("Collection not found");
  }

  const folder = getCollectionUploadFolder(collectionId);
  const results: UploadPhotoResult[] = [];

  for (const upload of uploads) {
    if (!isCloudinaryPublicIdInFolder(upload.public_id, folder)) {
      throw new Error("Upload does not belong to this collection");
    }

    const buffer = await loadProcessingBuffer(upload.public_id, upload.secure_url);
    const photo = await createPhotoRecord(
      collectionId,
      upload,
      upload.originalFilename,
      buffer,
      upload.format,
    );

    results.push({
      id: photo.id,
      originalFilename: photo.originalFilename,
      secureUrl: photo.secureUrl,
      thumbnailUrl: photo.thumbnailUrl,
    });
  }

  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });

  return results;
}

export async function uploadPhotosToCollection(
  collectionId: string,
  userId: string,
  files: File[],
): Promise<UploadPhotoResult[]> {
  const collection = await getCollectionForUser(collectionId, userId);
  if (!collection) {
    throw new Error("Collection not found");
  }

  const results: UploadPhotoResult[] = [];
  const folder = getCollectionUploadFolder(collectionId);

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await uploadImageBuffer(buffer, folder, file.name);
    const photo = await createPhotoRecord(
      collectionId,
      upload,
      file.name,
      buffer,
      file.type.split("/")[1] ?? null,
    );

    results.push({
      id: photo.id,
      originalFilename: photo.originalFilename,
      secureUrl: photo.secureUrl,
      thumbnailUrl: photo.thumbnailUrl,
    });
  }

  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });

  return results;
}


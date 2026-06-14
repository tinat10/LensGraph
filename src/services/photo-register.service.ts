import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  buildProcessingUrl,
  buildThumbnailUrl,
  fetchImageBufferFromUrl,
} from "@/lib/cloudinary/client";
import {
  getCollectionUploadFolder,
  isCloudinaryPublicIdInFolder,
} from "@/lib/cloudinary/sign-upload";
import { getCollectionForUser } from "@/services/collection.service";

export type CloudinaryRegisteredUpload = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format?: string;
  originalFilename: string;
};

export type UploadPhotoResult = {
  id: string;
  originalFilename: string;
  secureUrl: string;
  thumbnailUrl: string | null;
};

async function tryExtractMetadata(buffer: Buffer) {
  try {
    const { extractImageMetadata } = await import("@/lib/image-processing/exif");
    return await extractImageMetadata(buffer);
  } catch (error) {
    console.warn("[photo-register] metadata extraction skipped:", error);
    return null;
  }
}

async function tryExtractPalette(buffer: Buffer) {
  try {
    const { extractColorPalette } = await import("@/lib/image-processing/colors");
    return await extractColorPalette(buffer);
  } catch (error) {
    console.warn("[photo-register] palette extraction skipped:", error);
    return null;
  }
}

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
  const extracted = buffer ? await tryExtractMetadata(buffer) : null;
  const palette = buffer ? await tryExtractPalette(buffer) : null;

  const metadata = {
    format: extracted?.format ?? formatHint ?? undefined,
    width: extracted?.width ?? upload.width,
    height: extracted?.height ?? upload.height,
    fileSize: extracted?.fileSize ?? upload.bytes,
    takenAt: extracted?.takenAt,
    cameraMake: extracted?.cameraMake,
    cameraModel: extracted?.cameraModel,
    lensModel: extracted?.lensModel,
    focalLength: extracted?.focalLength,
    aperture: extracted?.aperture,
    shutterSpeed: extracted?.shutterSpeed,
    iso: extracted?.iso,
    latitude: extracted?.latitude,
    longitude: extracted?.longitude,
    rawExifJson: extracted?.rawExifJson,
  };

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

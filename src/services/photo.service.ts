import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  buildThumbnailUrl,
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "@/lib/cloudinary/client";
import {
  getCollectionUploadFolder,
  isCloudinaryPublicIdInFolder,
} from "@/lib/cloudinary/sign-upload";
import {
  extractColorPalette,
  extractImageMetadata,
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
  buffer: Buffer,
  formatHint?: string | null,
) {
  const [metadata, palette] = await Promise.all([
    extractImageMetadata(buffer),
    extractColorPalette(buffer),
  ]);

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
      colorPalette: {
        create: palette,
      },
    },
  });
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

    const imageResponse = await fetch(upload.secure_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to process ${upload.originalFilename}`);
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
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

export async function deletePhoto(photoId: string, userId: string): Promise<void> {
  const photo = await prisma.photo.findFirst({
    where: {
      id: photoId,
      collection: { userId },
    },
    select: {
      id: true,
      cloudinaryPublicId: true,
      collectionId: true,
    },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  await deleteCloudinaryImage(photo.cloudinaryPublicId);

  await prisma.$transaction([
    prisma.collection.updateMany({
      where: { coverPhotoId: photo.id },
      data: { coverPhotoId: null },
    }),
    prisma.photo.delete({ where: { id: photo.id } }),
    prisma.collection.update({
      where: { id: photo.collectionId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  buildThumbnailUrl,
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "@/lib/cloudinary/client";
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

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = `lensgraph/${collectionId}`;

    const [upload, metadata, palette] = await Promise.all([
      uploadImageBuffer(buffer, folder, file.name),
      extractImageMetadata(buffer),
      extractColorPalette(buffer),
    ]);

    const photo = await prisma.photo.create({
      data: {
        collectionId,
        cloudinaryPublicId: upload.public_id,
        secureUrl: upload.secure_url,
        thumbnailUrl: buildThumbnailUrl(upload.public_id),
        originalFilename: file.name,
        format: metadata.format ?? file.type.split("/")[1] ?? null,
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

    // TODO(OpenAI Vision): Queue async job to generate AI tags and captions
    // TODO(Mapbox): Queue async job to reverse-geocode GPS coordinates

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

// TODO: Implement searchPhotos() with filters for tags, date, camera, color, collection
// TODO(pgvector): Extend searchPhotos() with semantic similarity queries

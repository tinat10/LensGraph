import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { fetchCloudinaryResourceMetadata } from "@/lib/cloudinary/metadata";
import { schedulePhotoGeocoding } from "@/services/photo-location.service";
import { enrichPhotoById } from "@/services/photo-enrichment.service";

export async function ingestPhotoById(photoId: string): Promise<void> {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      cloudinaryPublicId: true,
      format: true,
      width: true,
      height: true,
      fileSize: true,
      metadata: { select: { id: true } },
      colorPalette: { select: { id: true } },
    },
  });

  if (!photo?.metadata) {
    return;
  }

  const extracted = await fetchCloudinaryResourceMetadata(photo.cloudinaryPublicId);
  if (!extracted) {
    return;
  }

  const hasExif =
    extracted.takenAt ||
    extracted.cameraMake ||
    extracted.cameraModel ||
    extracted.latitude != null ||
    extracted.longitude != null;

  const hasPalette = Boolean(extracted.dominantHex);

  if (!hasExif && !hasPalette) {
    return;
  }

  await prisma.photo.update({
    where: { id: photoId },
    data: {
      format: extracted.format ?? photo.format,
      width: extracted.width ?? photo.width,
      height: extracted.height ?? photo.height,
      fileSize: extracted.fileSize ?? photo.fileSize,
      metadata: {
        update: {
          takenAt: extracted.takenAt,
          cameraMake: extracted.cameraMake,
          cameraModel: extracted.cameraModel,
          lensModel: extracted.lensModel,
          focalLength: extracted.focalLength,
          aperture: extracted.aperture,
          shutterSpeed: extracted.shutterSpeed,
          iso: extracted.iso,
          latitude: extracted.latitude,
          longitude: extracted.longitude,
          rawExifJson: (extracted.rawExifJson ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      },
      ...(hasPalette && !photo.colorPalette
        ? {
            colorPalette: {
              create: {
                dominantHex: extracted.dominantHex,
                paletteJson: extracted.paletteJson ?? {},
                brightnessScore: extracted.brightnessScore,
                warmthScore: extracted.warmthScore,
                contrastScore: extracted.contrastScore,
              },
            },
          }
        : hasPalette && photo.colorPalette
          ? {
              colorPalette: {
                update: {
                  dominantHex: extracted.dominantHex,
                  paletteJson: extracted.paletteJson ?? {},
                  brightnessScore: extracted.brightnessScore,
                  warmthScore: extracted.warmthScore,
                  contrastScore: extracted.contrastScore,
                },
              },
            }
          : {}),
    },
  });

  if (extracted.latitude != null && extracted.longitude != null) {
    schedulePhotoGeocoding([photoId]);
  }
}

export async function ingestPhotosByIds(photoIds: string[]): Promise<void> {
  for (const photoId of photoIds) {
    try {
      await ingestPhotoById(photoId);
    } catch (error) {
      console.error(`[photo-ingest] Failed for ${photoId}:`, error);
    }
  }
}

export async function runPhotoPostProcessing(photoIds: string[]): Promise<void> {
  await ingestPhotosByIds(photoIds);

  for (const photoId of photoIds) {
    try {
      await enrichPhotoById(photoId);
    } catch (error) {
      console.error(`[photo-enrichment] Failed for ${photoId}:`, error);
    }
  }
}

export function schedulePhotoIngest(photoIds: string[]) {
  void ingestPhotosByIds(photoIds).catch((error) => {
    console.error("[photo-ingest] batch failed:", error);
  });
}

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  buildProcessingUrl,
  fetchImageBufferFromUrl,
} from "@/lib/cloudinary/client";
import { schedulePhotoGeocoding } from "@/services/photo-location.service";

async function tryExtractMetadata(buffer: Buffer) {
  try {
    const { extractImageMetadata } = await import("@/lib/image-processing/exif");
    return await extractImageMetadata(buffer);
  } catch (error) {
    console.warn("[photo-ingest] metadata extraction skipped:", error);
    return null;
  }
}

async function tryExtractPalette(buffer: Buffer) {
  try {
    const { extractColorPalette } = await import("@/lib/image-processing/colors");
    return await extractColorPalette(buffer);
  } catch (error) {
    console.warn("[photo-ingest] palette extraction skipped:", error);
    return null;
  }
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

export async function ingestPhotoById(photoId: string): Promise<void> {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      cloudinaryPublicId: true,
      secureUrl: true,
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

  const buffer = await loadProcessingBuffer(
    photo.cloudinaryPublicId,
    photo.secureUrl,
  );
  if (!buffer) {
    return;
  }

  const extracted = await tryExtractMetadata(buffer);
  const palette = await tryExtractPalette(buffer);

  await prisma.photo.update({
    where: { id: photoId },
    data: {
      format: extracted?.format ?? photo.format,
      width: extracted?.width ?? photo.width,
      height: extracted?.height ?? photo.height,
      fileSize: extracted?.fileSize ?? photo.fileSize,
      metadata: {
        update: {
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
          rawExifJson: (extracted?.rawExifJson ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      },
      ...(palette && !photo.colorPalette
        ? {
            colorPalette: {
              create: palette,
            },
          }
        : palette && photo.colorPalette
          ? {
              colorPalette: {
                update: palette,
              },
            }
          : {}),
    },
  });

  if (extracted?.latitude != null && extracted?.longitude != null) {
    schedulePhotoGeocoding([photoId]);
  }
}

export function schedulePhotoIngest(photoIds: string[]) {
  for (const photoId of photoIds) {
    void ingestPhotoById(photoId).catch((error) => {
      console.error(`[photo-ingest] Failed for ${photoId}:`, error);
    });
  }
}

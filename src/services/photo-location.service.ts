import type { TagType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isMapboxConfigured } from "@/lib/mapbox/client";
import { reverseGeocode } from "@/lib/mapbox/geocode";
import { schedulePhotoEmbedding } from "@/services/photo-embedding.service";
import { normalizeTagName } from "@/services/photo-tags.service";

export type GeocodeResult = {
  photoId: string;
  locationName: string;
  city: string | null;
  country: string | null;
  tags: { id: string; name: string; type: string }[];
};

async function attachLocationTag(
  photoId: string,
  name: string,
): Promise<{ id: string; name: string; type: string } | null> {
  const normalized = normalizeTagName(name);
  if (!normalized) return null;

  const existing = await prisma.tag.findUnique({
    where: { name: normalized },
  });

  const tag =
    existing ??
    (await prisma.tag.create({
      data: { name: normalized, type: "LOCATION" satisfies TagType },
    }));

  if (existing && existing.type !== "LOCATION") {
    await prisma.tag.update({
      where: { id: existing.id },
      data: { type: "LOCATION" },
    });
  }

  await prisma.photoTag.upsert({
    where: { photoId_tagId: { photoId, tagId: tag.id } },
    create: { photoId, tagId: tag.id },
    update: {},
  });

  return { id: tag.id, name: tag.name, type: "LOCATION" };
}

export async function geocodePhotoById(
  photoId: string,
): Promise<GeocodeResult | null> {
  if (!isMapboxConfigured()) {
    return null;
  }

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      metadata: {
        select: {
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  const latitude = photo?.metadata?.latitude;
  const longitude = photo?.metadata?.longitude;

  if (!photo?.metadata || latitude == null || longitude == null) {
    return null;
  }

  const geocoded = await reverseGeocode(latitude, longitude);

  await prisma.photoTag.deleteMany({
    where: {
      photoId,
      tag: { type: "LOCATION" },
    },
  });

  const attachedTags: GeocodeResult["tags"] = [];
  for (const name of geocoded.tagNames) {
    const tag = await attachLocationTag(photoId, name);
    if (tag) attachedTags.push(tag);
  }

  await prisma.photoMetadata.update({
    where: { photoId },
    data: {
      locationName: geocoded.locationName,
      city: geocoded.city,
      country: geocoded.country,
      locationGeocodedAt: new Date(),
    },
  });

  const otherTags = await prisma.photoTag.findMany({
    where: {
      photoId,
      tag: { type: { not: "LOCATION" } },
    },
    include: { tag: true },
  });

  const result = {
    photoId,
    locationName: geocoded.locationName,
    city: geocoded.city,
    country: geocoded.country,
    tags: [
      ...otherTags.map((entry) => ({
        id: entry.tag.id,
        name: entry.tag.name,
        type: entry.tag.type,
      })),
      ...attachedTags,
    ],
  };

  schedulePhotoEmbedding([photoId]);

  return result;
}

export async function geocodePhotoForUser(
  photoId: string,
  userId: string,
): Promise<GeocodeResult> {
  if (!isMapboxConfigured()) {
    throw new Error(
      "MAPBOX_ACCESS_TOKEN is not configured. Add it to .env to enable geocoding.",
    );
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, collection: { userId } },
    select: {
      id: true,
      metadata: { select: { latitude: true, longitude: true } },
    },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  if (photo.metadata?.latitude == null || photo.metadata?.longitude == null) {
    throw new Error("Photo has no GPS coordinates to geocode");
  }

  const result = await geocodePhotoById(photoId);
  if (!result) {
    throw new Error("Geocoding is not available");
  }

  return result;
}

export function schedulePhotoGeocoding(photoIds: string[]) {
  if (!isMapboxConfigured()) return;

  for (const photoId of photoIds) {
    void geocodePhotoById(photoId).catch((error) => {
      console.error(`[photo-location] Failed for ${photoId}:`, error);
    });
  }
}

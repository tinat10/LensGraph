import type { TagType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isOpenAiConfigured } from "@/lib/openai/client";
import { analyzePhotoWithVision } from "@/lib/openai/vision";
import { normalizeTagName } from "@/services/photo-tags.service";

export type EnrichmentResult = {
  photoId: string;
  aiCaption: string;
  aiMood: string;
  tags: { id: string; name: string; type: string }[];
};

async function attachTypedTag(
  photoId: string,
  name: string,
  type: TagType,
): Promise<{ id: string; name: string; type: string } | null> {
  const normalized = normalizeTagName(name);
  if (!normalized) return null;

  const existing = await prisma.tag.findUnique({
    where: { name: normalized },
  });

  const tag =
    existing ??
    (await prisma.tag.create({
      data: { name: normalized, type },
    }));

  await prisma.photoTag.upsert({
    where: { photoId_tagId: { photoId, tagId: tag.id } },
    create: { photoId, tagId: tag.id },
    update: {},
  });

  return { id: tag.id, name: tag.name, type: tag.type };
}

export async function enrichPhotoById(photoId: string): Promise<EnrichmentResult | null> {
  if (!isOpenAiConfigured()) {
    return null;
  }

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      secureUrl: true,
      metadata: { select: { id: true } },
    },
  });

  if (!photo?.metadata) {
    throw new Error("Photo not found");
  }

  const analysis = await analyzePhotoWithVision(photo.secureUrl);

  await prisma.photoTag.deleteMany({
    where: {
      photoId,
      tag: { type: { in: ["AI", "SUBJECT", "STYLE"] } },
    },
  });

  const attachedTags: EnrichmentResult["tags"] = [];

  for (const subject of analysis.subjects) {
    const tag = await attachTypedTag(photoId, subject, "SUBJECT");
    if (tag) attachedTags.push(tag);
  }

  for (const style of analysis.styles) {
    const tag = await attachTypedTag(photoId, style, "STYLE");
    if (tag) attachedTags.push(tag);
  }

  for (const keyword of analysis.tags) {
    const tag = await attachTypedTag(photoId, keyword, "AI");
    if (tag && !attachedTags.some((entry) => entry.id === tag.id)) {
      attachedTags.push(tag);
    }
  }

  const moodTag = await attachTypedTag(photoId, analysis.mood, "AI");
  if (moodTag && !attachedTags.some((entry) => entry.id === moodTag.id)) {
    attachedTags.push(moodTag);
  }

  await prisma.photoMetadata.update({
    where: { photoId },
    data: {
      aiCaption: analysis.caption,
      aiMood: analysis.mood,
      aiEnrichedAt: new Date(),
    },
  });

  const manualTags = await prisma.photoTag.findMany({
    where: {
      photoId,
      tag: { type: "MANUAL" },
    },
    include: { tag: true },
  });

  const allTags = [
    ...manualTags.map((entry) => ({
      id: entry.tag.id,
      name: entry.tag.name,
      type: entry.tag.type,
    })),
    ...attachedTags,
  ];

  return {
    photoId,
    aiCaption: analysis.caption,
    aiMood: analysis.mood,
    tags: allTags,
  };
}

export async function enrichPhotoForUser(
  photoId: string,
  userId: string,
): Promise<EnrichmentResult> {
  if (!isOpenAiConfigured()) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env to enable AI enrichment.",
    );
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, collection: { userId } },
    select: { id: true },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  const result = await enrichPhotoById(photoId);
  if (!result) {
    throw new Error("AI enrichment is not available");
  }

  return result;
}

export function schedulePhotoEnrichment(photoIds: string[]) {
  if (!isOpenAiConfigured()) return;

  for (const photoId of photoIds) {
    void enrichPhotoById(photoId).catch((error) => {
      console.error(`[photo-enrichment] Failed for ${photoId}:`, error);
    });
  }
}

// TODO(Mapbox): Add enrichPhotoLocation() for GPS reverse geocoding

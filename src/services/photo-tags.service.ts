import { prisma } from "@/lib/db/prisma";

export function normalizeTagName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function addTagToPhoto(
  photoId: string,
  userId: string,
  tagName: string,
) {
  const normalized = normalizeTagName(tagName);
  if (!normalized) {
    throw new Error("Tag name is required");
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, collection: { userId } },
    select: { id: true },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  const tag = await prisma.tag.upsert({
    where: { name: normalized },
    create: { name: normalized, type: "MANUAL" },
    update: {},
  });

  await prisma.photoTag.upsert({
    where: { photoId_tagId: { photoId, tagId: tag.id } },
    create: { photoId, tagId: tag.id },
    update: {},
  });

  return tag;
}

export async function removeTagFromPhoto(
  photoId: string,
  userId: string,
  tagId: string,
) {
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, collection: { userId } },
    select: { id: true },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  await prisma.photoTag.delete({
    where: { photoId_tagId: { photoId, tagId } },
  });
}

// TODO(OpenAI Vision): Add attachAiTagsToPhoto() for AI-generated tags

import { prisma } from "@/lib/db/prisma";
import { deleteCloudinaryImage } from "@/lib/cloudinary/client";
import { uniqueSlug } from "@/lib/utils/slug";

export type CreateCollectionInput = {
  title: string;
  description?: string;
};

export type UpdateCollectionInput = {
  title?: string;
  description?: string;
  coverPhotoId?: string | null;
};

export async function createCollection(
  userId: string,
  input: CreateCollectionInput,
) {
  return prisma.collection.create({
    data: {
      title: input.title,
      description: input.description,
      userId,
    },
  });
}

export async function updateCollection(
  collectionId: string,
  userId: string,
  input: UpdateCollectionInput,
) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });

  if (!collection) {
    throw new Error("Collection not found");
  }

  if (input.coverPhotoId) {
    const coverPhoto = await prisma.photo.findFirst({
      where: {
        id: input.coverPhotoId,
        collectionId,
        collection: { userId },
      },
      select: { id: true },
    });

    if (!coverPhoto) {
      throw new Error("Cover photo must belong to this collection");
    }
  }

  return prisma.collection.update({
    where: { id: collectionId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.coverPhotoId !== undefined
        ? { coverPhotoId: input.coverPhotoId }
        : {}),
    },
  });
}

export async function deleteCollection(
  collectionId: string,
  userId: string,
): Promise<void> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      photos: { select: { cloudinaryPublicId: true } },
    },
  });

  if (!collection) {
    throw new Error("Collection not found");
  }

  for (const photo of collection.photos) {
    await deleteCloudinaryImage(photo.cloudinaryPublicId);
  }

  await prisma.collection.delete({ where: { id: collectionId } });
}

export async function getCollectionsForUser(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      coverPhoto: {
        select: { thumbnailUrl: true, secureUrl: true },
      },
      storyPage: { select: { isPublished: true, slug: true } },
      _count: { select: { photos: true } },
    },
  });
}

export async function getCollectionForUser(collectionId: string, userId: string) {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      coverPhoto: true,
      photos: {
        orderBy: { uploadedAt: "desc" },
        include: {
          metadata: true,
          colorPalette: true,
          tags: { include: { tag: true } },
        },
      },
      storyPage: true,
      _count: { select: { photos: true } },
    },
  });
}

export async function getPublishedStoryBySlug(slug: string) {
  return prisma.storyPage.findFirst({
    where: { slug, isPublished: true },
    include: {
      collection: {
        include: {
          photos: {
            orderBy: { uploadedAt: "asc" },
            include: {
              metadata: true,
              colorPalette: true,
              tags: { include: { tag: true } },
            },
          },
        },
      },
    },
  });
}

// isPublic is tied to story publish state — see story.service.ts

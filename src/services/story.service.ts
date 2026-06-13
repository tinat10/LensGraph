import { prisma } from "@/lib/db/prisma";
import { uniqueSlug } from "@/lib/utils/slug";

export type PublishStoryInput = {
  title: string;
  intro?: string;
  slug?: string;
};

export type UpdateStoryInput = {
  title?: string;
  intro?: string;
  slug?: string;
};

async function assertCollectionOwnership(collectionId: string, userId: string) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true, title: true },
  });

  if (!collection) {
    throw new Error("Collection not found");
  }

  return collection;
}

export async function getStoryForCollection(
  collectionId: string,
  userId: string,
) {
  await assertCollectionOwnership(collectionId, userId);

  return prisma.storyPage.findUnique({
    where: { collectionId },
  });
}

export async function publishStory(
  collectionId: string,
  userId: string,
  input: PublishStoryInput,
) {
  const collection = await assertCollectionOwnership(collectionId, userId);

  const slug =
    input.slug?.trim() ||
    (await uniqueSlug(input.title || collection.title, async (candidate) => {
      const existing = await prisma.storyPage.findUnique({
        where: { slug: candidate },
        select: { collectionId: true },
      });
      return !!existing && existing.collectionId !== collectionId;
    }));

  const story = await prisma.$transaction(async (tx) => {
    const saved = await tx.storyPage.upsert({
      where: { collectionId },
      create: {
        collectionId,
        slug,
        title: input.title,
        intro: input.intro,
        isPublished: true,
      },
      update: {
        title: input.title,
        intro: input.intro,
        slug,
        isPublished: true,
      },
    });

    await tx.collection.update({
      where: { id: collectionId },
      data: { isPublic: true },
    });

    return saved;
  });

  return story;
}

export async function updateStoryDraft(
  collectionId: string,
  userId: string,
  input: UpdateStoryInput,
) {
  await assertCollectionOwnership(collectionId, userId);

  const existing = await prisma.storyPage.findUnique({
    where: { collectionId },
  });

  if (!existing) {
    throw new Error("Story page not found");
  }

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await uniqueSlug(input.slug, async (candidate) => {
      const match = await prisma.storyPage.findUnique({
        where: { slug: candidate },
        select: { collectionId: true },
      });
      return !!match && match.collectionId !== collectionId;
    });
  }

  return prisma.storyPage.update({
    where: { collectionId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.intro !== undefined ? { intro: input.intro } : {}),
      slug,
    },
  });
}

export async function unpublishStory(collectionId: string, userId: string) {
  await assertCollectionOwnership(collectionId, userId);

  const story = await prisma.storyPage.findUnique({
    where: { collectionId },
  });

  if (!story) {
    throw new Error("Story page not found");
  }

  await prisma.$transaction([
    prisma.storyPage.update({
      where: { collectionId },
      data: { isPublished: false },
    }),
    prisma.collection.update({
      where: { id: collectionId },
      data: { isPublic: false },
    }),
  ]);
}

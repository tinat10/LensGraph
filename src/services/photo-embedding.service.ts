import { prisma } from "@/lib/db/prisma";
import {
  formatVectorForPg,
  generatePhotoEmbedding,
} from "@/lib/openai/embeddings";
import { isOpenAiConfigured } from "@/lib/openai/client";

export async function embedPhotoById(photoId: string): Promise<boolean> {
  if (!isOpenAiConfigured()) {
    return false;
  }

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      originalFilename: true,
      metadata: true,
      tags: { include: { tag: { select: { name: true } } } },
    },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  const parts = [
    photo.metadata?.aiCaption,
    photo.metadata?.aiMood,
    photo.metadata?.locationName,
    photo.metadata?.city,
    photo.metadata?.country,
    photo.metadata?.cameraMake,
    photo.metadata?.cameraModel,
    photo.tags.map((entry) => entry.tag.name).join(", "),
    photo.originalFilename,
  ].filter(Boolean);

  const text = parts.join(". ");
  if (!text.trim()) {
    return false;
  }

  const embedding = await generatePhotoEmbedding(text);
  const vector = formatVectorForPg(embedding);

  await prisma.$executeRawUnsafe(
    `UPDATE "PhotoMetadata"
     SET embedding = $1::vector,
         "embeddingUpdatedAt" = NOW()
     WHERE "photoId" = $2`,
    vector,
    photoId,
  );

  return true;
}

export async function embedPhotoForUser(
  photoId: string,
  userId: string,
): Promise<void> {
  if (!isOpenAiConfigured()) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env to enable semantic search.",
    );
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, collection: { userId } },
    select: { id: true },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  const embedded = await embedPhotoById(photoId);
  if (!embedded) {
    throw new Error("Not enough metadata to generate an embedding");
  }
}

export function schedulePhotoEmbedding(photoIds: string[]) {
  if (!isOpenAiConfigured()) return;

  for (const photoId of photoIds) {
    void embedPhotoById(photoId).catch((error) => {
      console.error(`[photo-embedding] Failed for ${photoId}:`, error);
    });
  }
}

export async function getPhotoEmbedding(photoId: string): Promise<number[] | null> {
  const rows = await prisma.$queryRawUnsafe<{ embedding: string }[]>(
    `SELECT embedding::text AS embedding
     FROM "PhotoMetadata"
     WHERE "photoId" = $1
       AND embedding IS NOT NULL`,
    photoId,
  );

  const raw = rows[0]?.embedding;
  if (!raw) return null;

  const parsed = raw
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((value) => Number(value.trim()));

  if (parsed.some((value) => Number.isNaN(value))) {
    return null;
  }

  return parsed;
}

export async function searchPhotosByVector(
  userId: string,
  filters: {
    collectionId?: string;
    queryEmbedding: number[];
    limit?: number;
  },
): Promise<string[]> {
  const vector = formatVectorForPg(filters.queryEmbedding);
  const limit = filters.limit ?? 50;

  if (filters.collectionId) {
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT p.id
       FROM "Photo" p
       INNER JOIN "Collection" c ON c.id = p."collectionId"
       INNER JOIN "PhotoMetadata" pm ON pm."photoId" = p.id
       WHERE c."userId" = $1
         AND p."collectionId" = $2
         AND pm.embedding IS NOT NULL
       ORDER BY pm.embedding <=> $3::vector
       LIMIT $4`,
      userId,
      filters.collectionId,
      vector,
      limit,
    );
    return rows.map((row) => row.id);
  }

  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT p.id
     FROM "Photo" p
     INNER JOIN "Collection" c ON c.id = p."collectionId"
     INNER JOIN "PhotoMetadata" pm ON pm."photoId" = p.id
     WHERE c."userId" = $1
       AND pm.embedding IS NOT NULL
     ORDER BY pm.embedding <=> $2::vector
     LIMIT $3`,
    userId,
    vector,
    limit,
  );

  return rows.map((row) => row.id);
}

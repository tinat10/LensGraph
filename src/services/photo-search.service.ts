import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { generatePhotoEmbedding } from "@/lib/openai/embeddings";
import { isOpenAiConfigured } from "@/lib/openai/client";
import type { PhotoSearchFilters } from "@/lib/photos/serialize";
import {
  getPhotoEmbedding,
  searchPhotosByVector,
} from "@/services/photo-embedding.service";

const photoInclude = {
  metadata: true,
  colorPalette: true,
  tags: { include: { tag: true } },
} satisfies Prisma.PhotoInclude;

function buildPhotoWhere(
  userId: string,
  filters: PhotoSearchFilters,
): Prisma.PhotoWhereInput {
  const where: Prisma.PhotoWhereInput = {
    collection: {
      userId,
      ...(filters.collectionId ? { id: filters.collectionId } : {}),
    },
  };

  if (filters.query) {
    where.originalFilename = {
      contains: filters.query,
      mode: "insensitive",
    };
  }

  if (filters.tag) {
    where.tags = {
      some: {
        tag: {
          name: { equals: filters.tag, mode: "insensitive" },
        },
      },
    };
  }

  const metadataFilter: Prisma.PhotoMetadataWhereInput = {};

  if (filters.cameraMake) {
    metadataFilter.cameraMake = {
      contains: filters.cameraMake,
      mode: "insensitive",
    };
  }

  if (filters.cameraModel) {
    metadataFilter.cameraModel = {
      contains: filters.cameraModel,
      mode: "insensitive",
    };
  }

  if (filters.takenAfter || filters.takenBefore) {
    metadataFilter.takenAt = {
      ...(filters.takenAfter ? { gte: filters.takenAfter } : {}),
      ...(filters.takenBefore ? { lte: filters.takenBefore } : {}),
    };
  }

  if (filters.location) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          {
            metadata: {
              locationName: {
                contains: filters.location,
                mode: "insensitive",
              },
            },
          },
          {
            metadata: {
              city: { contains: filters.location, mode: "insensitive" },
            },
          },
          {
            metadata: {
              country: { contains: filters.location, mode: "insensitive" },
            },
          },
          {
            tags: {
              some: {
                tag: {
                  type: "LOCATION",
                  name: { contains: filters.location, mode: "insensitive" },
                },
              },
            },
          },
        ],
      },
    ];
  }

  if (Object.keys(metadataFilter).length > 0) {
    where.metadata = metadataFilter;
  }

  if (filters.colorHex) {
    where.colorPalette = {
      dominantHex: { equals: filters.colorHex, mode: "insensitive" },
    };
  }

  return where;
}

async function resolveSemanticPhotoIds(
  userId: string,
  filters: PhotoSearchFilters,
): Promise<string[] | null> {
  if (!isOpenAiConfigured()) {
    return null;
  }

  if (filters.semanticQuery?.trim()) {
    const embedding = await generatePhotoEmbedding(filters.semanticQuery.trim());
    return searchPhotosByVector(userId, {
      collectionId: filters.collectionId,
      queryEmbedding: embedding,
    });
  }

  if (filters.similarToPhotoId) {
    const embedding = await getPhotoEmbedding(filters.similarToPhotoId);
    if (!embedding) return [];
    return searchPhotosByVector(userId, {
      collectionId: filters.collectionId,
      queryEmbedding: embedding,
    });
  }

  return null;
}

export async function searchPhotos(userId: string, filters: PhotoSearchFilters) {
  const semanticIds = await resolveSemanticPhotoIds(userId, filters);

  if (semanticIds !== null) {
    if (semanticIds.length === 0) {
      return [];
    }

    const where = buildPhotoWhere(userId, filters);
    where.id = { in: semanticIds };

    const photos = await prisma.photo.findMany({
      where,
      include: photoInclude,
    });

    const order = new Map(semanticIds.map((id, index) => [id, index]));
    return photos.sort(
      (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
    );
  }

  return prisma.photo.findMany({
    where: buildPhotoWhere(userId, filters),
    orderBy: { uploadedAt: "desc" },
    include: photoInclude,
  });
}

export async function getDistinctFilterOptions(
  userId: string,
  collectionId: string,
) {
  const photos = await prisma.photo.findMany({
    where: {
      collectionId,
      collection: { userId },
    },
    include: {
      metadata: {
        select: {
          cameraMake: true,
          cameraModel: true,
          city: true,
          country: true,
          locationName: true,
        },
      },
      colorPalette: { select: { dominantHex: true } },
      tags: { include: { tag: { select: { name: true, type: true } } } },
    },
  });

  const tags = new Set<string>();
  const cameraMakes = new Set<string>();
  const cameraModels = new Set<string>();
  const colors = new Set<string>();
  const locations = new Set<string>();

  for (const photo of photos) {
    for (const entry of photo.tags) {
      tags.add(entry.tag.name);
      if (entry.tag.type === "LOCATION") {
        locations.add(entry.tag.name);
      }
    }
    if (photo.metadata?.cameraMake) {
      cameraMakes.add(photo.metadata.cameraMake);
    }
    if (photo.metadata?.cameraModel) {
      cameraModels.add(photo.metadata.cameraModel);
    }
    if (photo.colorPalette?.dominantHex) {
      colors.add(photo.colorPalette.dominantHex);
    }
    for (const value of [
      photo.metadata?.city,
      photo.metadata?.country,
      photo.metadata?.locationName,
    ]) {
      if (value) locations.add(value);
    }
  }

  return {
    tags: [...tags].sort(),
    cameraMakes: [...cameraMakes].sort(),
    cameraModels: [...cameraModels].sort(),
    colors: [...colors].sort(),
    locations: [...locations].sort(),
  };
}

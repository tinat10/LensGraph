import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import {
  getCollectionForUser,
  updateCollection,
} from "@/services/collection.service";

const updateCollectionSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const collection = await getCollectionForUser(id, session.user.id);

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        isPublic: collection.isPublic,
        coverPhotoId: collection.coverPhotoId,
        photoCount: collection._count.photos,
        photos: collection.photos.map((photo) => ({
          id: photo.id,
          originalFilename: photo.originalFilename,
          secureUrl: photo.secureUrl,
          thumbnailUrl: photo.thumbnailUrl,
          format: photo.format,
          width: photo.width,
          height: photo.height,
          fileSize: photo.fileSize,
          uploadedAt: photo.uploadedAt.toISOString(),
          metadata: photo.metadata,
          colorPalette: photo.colorPalette,
          tags: photo.tags.map((photoTag) => photoTag.tag),
        })),
        storyPage: collection.storyPage,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch collection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateCollectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    if (!parsed.data.title && parsed.data.description === undefined) {
      return NextResponse.json(
        { error: "Provide title or description to update" },
        { status: 400 },
      );
    }

    const collection = await updateCollection(id, session.user.id, parsed.data);

    return NextResponse.json({
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        isPublic: collection.isPublic,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update collection";
    const status = message === "Collection not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

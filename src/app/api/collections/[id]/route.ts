import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import {
  deleteCollection,
  getCollectionForUser,
  updateCollection,
} from "@/services/collection.service";
import { serializePhoto } from "@/lib/photos/serialize";

const updateCollectionSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  coverPhotoId: z.string().nullable().optional(),
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
        photos: collection.photos.map((photo) =>
          serializePhoto(photo, collection.coverPhotoId),
        ),
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

    if (
      !parsed.data.title &&
      parsed.data.description === undefined &&
      parsed.data.coverPhotoId === undefined
    ) {
      return NextResponse.json(
        { error: "Provide at least one field to update" },
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
        coverPhotoId: collection.coverPhotoId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update collection";
    const status =
      message === "Collection not found" ||
      message === "Cover photo must belong to this collection"
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteCollection(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete collection";
    const status = message === "Collection not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

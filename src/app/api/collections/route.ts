import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import {
  createCollection,
  getCollectionsForUser,
} from "@/services/collection.service";

const createCollectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collections = await getCollectionsForUser(session.user.id);

    return NextResponse.json({
      collections: collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        description: collection.description,
        isPublic: collection.isPublic,
        coverPhotoUrl:
          collection.coverPhoto?.thumbnailUrl ??
          collection.coverPhoto?.secureUrl ??
          null,
        photoCount: collection._count.photos,
        updatedAt: collection.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list collections";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createCollectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const collection = await createCollection(session.user.id, parsed.data);

    return NextResponse.json(
      {
        collection: {
          id: collection.id,
          title: collection.title,
          description: collection.description,
          isPublic: collection.isPublic,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create collection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

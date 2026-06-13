import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  parsePhotoSearchParams,
  serializePhoto,
} from "@/lib/photos/serialize";
import {
  getDistinctFilterOptions,
  searchPhotos,
} from "@/services/photo-search.service";
import { getCollectionForUser } from "@/services/collection.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
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

    const { searchParams } = new URL(request.url);
    const filters = parsePhotoSearchParams(searchParams, id);
    const photos = await searchPhotos(session.user.id, filters);
    const filterOptions = await getDistinctFilterOptions(
      session.user.id,
      id,
    );

    return NextResponse.json({
      photos: photos.map((photo) =>
        serializePhoto(photo, collection.coverPhotoId),
      ),
      filterOptions,
      count: photos.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search photos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

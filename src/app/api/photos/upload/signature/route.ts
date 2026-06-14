import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  createUploadSignature,
  getCollectionUploadFolder,
} from "@/lib/cloudinary/sign-upload";
import { getCollectionForUser } from "@/services/collection.service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let collectionId: string | undefined;
  try {
    const body = (await request.json()) as { collectionId?: string };
    collectionId = body.collectionId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!collectionId) {
    return NextResponse.json(
      { error: "collectionId is required" },
      { status: 400 },
    );
  }

  const collection = await getCollectionForUser(collectionId, session.user.id);
  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const folder = getCollectionUploadFolder(collectionId);
  const signature = createUploadSignature(folder);

  return NextResponse.json(signature);
}

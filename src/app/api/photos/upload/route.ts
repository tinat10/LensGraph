import { after, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isMapboxConfigured } from "@/lib/mapbox/client";
import { isOpenAiConfigured } from "@/lib/openai/client";
import {
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_FILE_SIZE,
  isAcceptedImageFile,
} from "@/lib/photos/image-file";
import { runPhotoPostProcessing } from "@/services/photo-ingest.service";
import { uploadPhotosToCollection } from "@/services/photo.service";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const collectionId = formData.get("collectionId");

  if (typeof collectionId !== "string" || !collectionId) {
    return NextResponse.json(
      { error: "collectionId is required" },
      { status: 400 },
    );
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  if (files.length > MAX_UPLOAD_FILES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_UPLOAD_FILES} files per upload` },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (!isAcceptedImageFile(file)) {
      return NextResponse.json(
        { error: `${file.name} is not a supported image file` },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      return NextResponse.json(
        { error: `${file.name} exceeds the 15MB limit` },
        { status: 400 },
      );
    }
  }

  try {
    const photos = await uploadPhotosToCollection(
      collectionId,
      session.user.id,
      files,
    );

    after(async () => {
      const photoIds = photos.map((photo) => photo.id);
      await runPhotoPostProcessing(photoIds);
    });

    return NextResponse.json(
      {
        photos,
        enrichmentQueued: isOpenAiConfigured(),
        geocodingQueued: isMapboxConfigured(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[photos/upload]", error);

    let message = "Failed to upload photos";
    if (error instanceof Error) {
      message = error.message;
      // Cloudinary auth failures often surface as generic messages
      if (/api_secret|invalid signature|401|Unauthorized/i.test(message)) {
        message =
          "Cloudinary authentication failed — check CLOUDINARY_API_SECRET in .env";
      }
    }

    const status = message === "Collection not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

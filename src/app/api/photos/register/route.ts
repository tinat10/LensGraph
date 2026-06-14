import { after, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isMapboxConfigured } from "@/lib/mapbox/client";
import { isOpenAiConfigured } from "@/lib/openai/client";
import {
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_FILE_SIZE,
} from "@/lib/photos/image-file";
import { schedulePhotoEnrichment } from "@/services/photo-enrichment.service";
import { schedulePhotoGeocoding } from "@/services/photo-location.service";
import {
  registerPhotosFromCloudinary,
  type CloudinaryRegisteredUpload,
} from "@/services/photo.service";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    collectionId?: string;
    photos?: CloudinaryRegisteredUpload[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { collectionId, photos } = body;

  if (!collectionId) {
    return NextResponse.json(
      { error: "collectionId is required" },
      { status: 400 },
    );
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json({ error: "No photos provided" }, { status: 400 });
  }

  if (photos.length > MAX_UPLOAD_FILES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_UPLOAD_FILES} files per upload` },
      { status: 400 },
    );
  }

  for (const photo of photos) {
    if (
      !photo.public_id ||
      !photo.secure_url ||
      !photo.originalFilename ||
      typeof photo.width !== "number" ||
      typeof photo.height !== "number" ||
      typeof photo.bytes !== "number"
    ) {
      return NextResponse.json(
        { error: "Each photo must include Cloudinary upload details" },
        { status: 400 },
      );
    }

    if (photo.bytes > MAX_UPLOAD_FILE_SIZE) {
      return NextResponse.json(
        { error: `${photo.originalFilename} exceeds the 15MB limit` },
        { status: 400 },
      );
    }
  }

  try {
    const registered = await registerPhotosFromCloudinary(
      collectionId,
      session.user.id,
      photos,
    );

    after(() => {
      const photoIds = registered.map((photo) => photo.id);
      schedulePhotoEnrichment(photoIds);
      schedulePhotoGeocoding(photoIds);
    });

    return NextResponse.json(
      {
        photos: registered,
        enrichmentQueued: isOpenAiConfigured(),
        geocodingQueued: isMapboxConfigured(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[photos/register]", error);

    let message = "Failed to register photos";
    if (error instanceof Error) {
      message = error.message;
    }

    const status = message === "Collection not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

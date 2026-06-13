import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isMapboxConfigured } from "@/lib/mapbox/client";
import { geocodePhotoForUser } from "@/services/photo-location.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMapboxConfigured()) {
    return NextResponse.json(
      {
        error:
          "MAPBOX_ACCESS_TOKEN is not configured. Add it to .env to enable geocoding.",
      },
      { status: 503 },
    );
  }

  try {
    const { id } = await context.params;
    const result = await geocodePhotoForUser(id, session.user.id);

    return NextResponse.json({ geocode: result });
  } catch (error) {
    console.error("[photos/geocode]", error);
    const message =
      error instanceof Error ? error.message : "Failed to geocode photo";
    const status =
      message === "Photo not found"
        ? 404
        : message.includes("no GPS")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

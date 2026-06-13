import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isOpenAiConfigured } from "@/lib/openai/client";
import { enrichPhotoForUser } from "@/services/photo-enrichment.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isOpenAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not configured. Add it to .env to enable AI enrichment.",
      },
      { status: 503 },
    );
  }

  try {
    const { id } = await context.params;
    const result = await enrichPhotoForUser(id, session.user.id);

    return NextResponse.json({ enrichment: result });
  } catch (error) {
    console.error("[photos/enrich]", error);
    const message =
      error instanceof Error ? error.message : "Failed to enrich photo";
    const status = message === "Photo not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

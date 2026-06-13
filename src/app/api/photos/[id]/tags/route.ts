import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { addTagToPhoto, removeTagFromPhoto } from "@/services/photo-tags.service";

const addTagSchema = z.object({
  name: z.string().trim().min(1).max(40),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = addTagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const tag = await addTagToPhoto(id, session.user.id, parsed.data.name);
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add tag";
    const status = message === "Photo not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    await removeTagFromPhoto(id, session.user.id, tagId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove tag";
    const status = message === "Photo not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

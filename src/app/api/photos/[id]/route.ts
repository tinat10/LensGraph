import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api-session";
import { deletePhoto } from "@/services/photo-delete.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    if (session instanceof NextResponse) {
      return session;
    }

    const { id } = await context.params;
    await deletePhoto(id, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[photos/delete]", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete photo";
    const status = message === "Photo not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

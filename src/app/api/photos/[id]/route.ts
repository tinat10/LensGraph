import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { deletePhoto } from "@/services/photo.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deletePhoto(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete photo";
    const status = message === "Photo not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

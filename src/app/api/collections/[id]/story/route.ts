import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import {
  getStoryForCollection,
  publishStory,
  unpublishStory,
  updateStoryDraft,
} from "@/services/story.service";

const publishStorySchema = z.object({
  title: z.string().trim().min(1).max(120),
  intro: z.string().trim().max(1000).optional(),
  slug: z.string().trim().min(1).max(80).optional(),
});

const updateStorySchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  intro: z.string().trim().max(1000).optional(),
  slug: z.string().trim().min(1).max(80).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const story = await getStoryForCollection(id, session.user.id);
    return NextResponse.json({ story });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch story";
    const status = message === "Collection not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = publishStorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const story = await publishStory(id, session.user.id, parsed.data);
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to publish story";
    const status = message === "Collection not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateStorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const story = await updateStoryDraft(id, session.user.id, parsed.data);
    return NextResponse.json({ story });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update story";
    const status =
      message === "Collection not found" || message === "Story page not found"
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await unpublishStory(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unpublish story";
    const status =
      message === "Collection not found" || message === "Story page not found"
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

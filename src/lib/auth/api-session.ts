import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export type ApiSession = {
  userId: string;
};

export async function getApiSession(): Promise<ApiSession | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    return { userId: session.user.id };
  } catch (error) {
    console.error("[getApiSession]", error);
    return null;
  }
}

export function apiUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireApiSession(): Promise<
  ApiSession | NextResponse
> {
  const session = await getApiSession();
  if (!session) {
    return apiUnauthorized();
  }

  return session;
}

"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth/auth";
import { isGoogleAuthEnabled } from "@/lib/auth/providers";
import { registerWithPassword } from "@/services/auth.service";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().trim().optional(),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function redirectWithError(path: string, code: string): never {
  redirect(`${path}?error=${encodeURIComponent(code)}`);
}

async function signInWithOAuth(provider: "github" | "google") {
  if (provider === "google" && !isGoogleAuthEnabled()) {
    redirectWithError(
      "/signin",
      "Google sign-in is not configured on this server. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.",
    );
  }

  try {
    await signIn(provider, { redirectTo: "/dashboard" });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      redirectWithError("/signin", error.type);
    }
    throw error;
  }
}

export async function signInWithCredentials(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithError("/signin", "InvalidCredentials");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.trim().toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      redirectWithError("/signin", "CredentialsSignin");
    }
    throw error;
  }
}

export async function signUpWithCredentials(formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Please check your signup details";
    redirectWithError("/signup", message);
  }

  try {
    await registerWithPassword(parsed.data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create account";
    redirectWithError("/signup", message);
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.trim().toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    redirectWithError("/signin", "CredentialsSignin");
  }
}

export async function signInWithGitHub() {
  await signInWithOAuth("github");
}

export async function signInWithGoogle() {
  await signInWithOAuth("google");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AuthDivider,
  OAuthButtons,
  SignInForm,
} from "@/components/auth/AuthForms";
import { Header } from "@/components/layout/Header";
import { auth } from "@/lib/auth/auth";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { isGoogleAuthEnabled } from "@/lib/auth/providers";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <>
      <Header />
      <main className="page-shell flex min-h-[calc(100vh-4.25rem)] max-w-lg flex-col justify-center py-16">
        <div className="surface-panel p-8 sm:p-10">
          <p className="eyebrow mb-4">Welcome</p>
          <h1 className="font-display text-4xl tracking-tight text-ink">
            Sign in to LensGraph
          </h1>
          <p className="mb-8 mt-4 text-sm leading-7 text-muted">
            Build searchable photo collections with EXIF metadata, AI enrichment,
            and publishable story pages.
          </p>

          <SignInForm errorMessage={getAuthErrorMessage(error)} />
          <AuthDivider />
          <OAuthButtons googleAuthEnabled={isGoogleAuthEnabled()} />
          {!isGoogleAuthEnabled() ? (
            <p className="mt-3 text-center text-xs text-subtle">
              Google sign-in is not configured on this server yet.
            </p>
          ) : null}

          <p className="mt-8 text-center text-sm text-muted">
            No account yet?{" "}
            <Link href="/signup" className="font-medium text-accent hover:text-accent-hover">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AuthDivider,
  OAuthButtons,
  SignUpForm,
} from "@/components/auth/AuthForms";
import { auth } from "@/lib/auth/auth";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { isGoogleAuthEnabled } from "@/lib/auth/providers";

export const dynamic = "force-dynamic";

type SignUpPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <>
      <main className="page-shell flex min-h-[calc(100vh-4.25rem)] max-w-lg flex-col justify-center py-16">
        <div className="surface-panel p-8 sm:p-10">
          <p className="eyebrow mb-4">Get started</p>
          <h1 className="font-display text-4xl tracking-tight text-ink">
            Create your account
          </h1>
          <p className="mb-8 mt-4 text-sm leading-7 text-muted">
            Sign up with email or connect GitHub or Google. Your collections stay
            private until you publish a story.
          </p>

          <SignUpForm errorMessage={getAuthErrorMessage(error)} />
          <AuthDivider />
          <OAuthButtons googleAuthEnabled={isGoogleAuthEnabled()} />
          {!isGoogleAuthEnabled() ? (
            <p className="mt-3 text-center text-xs text-subtle">
              Google sign-in is not configured on this server yet.
            </p>
          ) : null}

          <p className="mt-8 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-accent hover:text-accent-hover">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

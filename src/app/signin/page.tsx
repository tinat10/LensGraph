import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { auth, signIn } from "@/lib/auth/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

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
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" className="w-full">
              Continue with GitHub
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}

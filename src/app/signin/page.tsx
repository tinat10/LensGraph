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
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Welcome
          </p>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sign in to LensGraph
          </h1>
          <p className="mb-8 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Build searchable photo collections with EXIF metadata, color palettes,
            and story pages.
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

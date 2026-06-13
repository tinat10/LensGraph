import Link from "next/link";
import { redirect } from "next/navigation";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { Header } from "@/components/layout/Header";
import { auth } from "@/lib/auth/auth";

export default async function NewCollectionPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          ← Back to dashboard
        </Link>
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            New collection
          </h1>
          <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
            Give your story a title, then upload photos for metadata extraction.
          </p>
          <CollectionForm />
        </div>
      </main>
    </>
  );
}

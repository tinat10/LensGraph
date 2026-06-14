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
      <main className="page-shell max-w-2xl py-10 lg:py-12">
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-sm text-muted transition hover:text-ink"
        >
          ← Back to my dashboard
        </Link>
        <div className="surface-panel p-8 sm:p-10">
          <p className="eyebrow mb-3">Collection</p>
          <h1 className="font-display mb-2 text-4xl tracking-tight text-ink">
            New collection
          </h1>
          <p className="mb-8 text-sm leading-6 text-muted">
            Give your story a title, then upload photos for metadata extraction.
          </p>
          <CollectionForm />
        </div>
      </main>
    </>
  );
}

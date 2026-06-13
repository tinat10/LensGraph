import Link from "next/link";
import { redirect } from "next/navigation";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth/auth";
import { getCollectionsForUser } from "@/services/collection.service";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const collections = await getCollectionsForUser(session.user.id);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Your collections
            </h1>
          </div>
          <Link href="/collections/new">
            <Button>New collection</Button>
          </Link>
        </div>

        {collections.length === 0 ? (
          <EmptyState
            title="No collections yet"
            description="Create your first collection to start uploading and analyzing photos."
            action={
              <Link href="/collections/new">
                <Button>Create collection</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                id={collection.id}
                title={collection.title}
                description={collection.description}
                photoCount={collection._count.photos}
                updatedAt={collection.updatedAt.toISOString()}
                coverPhotoUrl={
                  collection.coverPhoto?.thumbnailUrl ??
                  collection.coverPhoto?.secureUrl ??
                  null
                }
                isPublished={collection.storyPage?.isPublished ?? false}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

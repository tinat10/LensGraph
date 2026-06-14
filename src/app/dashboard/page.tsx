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
      <main className="page-shell py-10 lg:py-12">
        <div className="mb-10 flex items-end justify-between gap-4 border-b border-line pb-8">
          <div>
            <p className="eyebrow mb-3">My dashboard</p>
            <h1 className="font-display text-4xl tracking-tight text-ink">
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
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CollectionEditForm } from "@/components/collections/CollectionEditForm";
import { DeleteCollectionButton } from "@/components/collections/DeleteCollectionButton";
import { PublishStoryPanel } from "@/components/collections/PublishStoryPanel";
import { Header } from "@/components/layout/Header";
import { CollectionGallery } from "@/components/photos/CollectionGallery";
import { Button } from "@/components/ui/Button";
import { serializePhoto } from "@/lib/photos/serialize";
import { auth } from "@/lib/auth/auth";
import { getCollectionForUser } from "@/services/collection.service";
import { getDistinctFilterOptions } from "@/services/photo-search.service";

type CollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { id } = await params;
  const collection = await getCollectionForUser(id, session.user.id);

  if (!collection) {
    notFound();
  }

  const [filterOptions] = await Promise.all([
    getDistinctFilterOptions(session.user.id, id),
  ]);

  const photos = collection.photos.map((photo) =>
    serializePhoto(photo, collection.coverPhotoId),
  );

  return (
    <>
      <Header />
      <main className="page-shell py-10 lg:py-12">
        <div className="mb-8 space-y-6">
          <Link
            href="/dashboard"
            className="inline-block text-sm text-muted transition hover:text-ink"
          >
            ← Back to my dashboard
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <CollectionEditForm
              collectionId={collection.id}
              initialTitle={collection.title}
              initialDescription={collection.description}
            />
            <div className="flex shrink-0 flex-col items-start gap-3">
              <div className="flex flex-wrap gap-3">
                <Link href={`/collections/${collection.id}/upload`}>
                  <Button>Upload photos</Button>
                </Link>
                <PublishStoryPanel
                  collectionId={collection.id}
                  collectionTitle={collection.title}
                  initialStory={collection.storyPage}
                />
              </div>
              {collection.isPublic ? (
                <p className="text-xs font-medium tracking-wide text-ink uppercase">
                  Public — story is published
                </p>
              ) : (
                <p className="text-xs text-subtle">Private collection</p>
              )}
              <DeleteCollectionButton
                collectionId={collection.id}
                collectionTitle={collection.title}
              />
            </div>
          </div>
        </div>

        <CollectionGallery
          collectionId={collection.id}
          coverPhotoId={collection.coverPhotoId}
          initialPhotos={photos}
          filterOptions={filterOptions}
        />
      </main>
    </>
  );
}

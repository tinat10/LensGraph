import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CollectionEditForm } from "@/components/collections/CollectionEditForm";
import { Header } from "@/components/layout/Header";
import { CollectionGallery } from "@/components/photos/CollectionGallery";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth/auth";
import { getCollectionForUser } from "@/services/collection.service";

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

  const photos = collection.photos.map((photo) => ({
    id: photo.id,
    originalFilename: photo.originalFilename,
    secureUrl: photo.secureUrl,
    thumbnailUrl: photo.thumbnailUrl,
    format: photo.format,
    width: photo.width,
    height: photo.height,
    fileSize: photo.fileSize,
    uploadedAt: photo.uploadedAt.toISOString(),
    metadata: photo.metadata,
    colorPalette: photo.colorPalette,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 space-y-6">
          <Link
            href="/dashboard"
            className="inline-block text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            ← Back to dashboard
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <CollectionEditForm
              collectionId={collection.id}
              initialTitle={collection.title}
              initialDescription={collection.description}
            />
            <div className="flex shrink-0 gap-3">
              <Link href={`/collections/${collection.id}/upload`}>
                <Button>Upload photos</Button>
              </Link>
              {/* TODO: Publish story page flow */}
              <Button variant="secondary" disabled>
                Publish story
              </Button>
            </div>
          </div>
        </div>

        {/* TODO: Add search/filter bar for tags, date, camera, and color */}
        <CollectionGallery
          collectionId={collection.id}
          initialPhotos={photos}
        />
      </main>
    </>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UploadDropzone } from "@/components/photos/UploadDropzone";
import { auth } from "@/lib/auth/auth";
import { getCollectionForUser } from "@/services/collection.service";

type UploadPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollectionUploadPage({ params }: UploadPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { id } = await params;
  const collection = await getCollectionForUser(id, session.user.id);

  if (!collection) {
    notFound();
  }

  return (
    <>
      <main className="page-shell max-w-3xl py-10 lg:py-12">
        <Link
          href={`/collections/${collection.id}`}
          className="mb-6 inline-block text-sm text-muted transition hover:text-ink"
        >
          ← Back to {collection.title}
        </Link>
        <div className="surface-panel p-8 sm:p-10">
          <p className="eyebrow mb-3">Upload</p>
          <h1 className="font-display mb-2 text-4xl tracking-tight text-ink">
            Upload photos
          </h1>
          <p className="mb-8 text-sm leading-7 text-muted">
            Images are stored in Cloudinary. LensGraph extracts EXIF metadata,
            runs AI enrichment, and generates a color palette for each photo.
          </p>
          <UploadDropzone collectionId={collection.id} />
        </div>
      </main>
    </>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
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
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/collections/${collection.id}`}
          className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          ← Back to {collection.title}
        </Link>
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Upload photos
          </h1>
          <p className="mb-8 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Images are stored in Cloudinary. LensGraph extracts EXIF metadata and
            generates a dominant color palette for each photo.
          </p>
          <UploadDropzone collectionId={collection.id} />
        </div>
      </main>
    </>
  );
}

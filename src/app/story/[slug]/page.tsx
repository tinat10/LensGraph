import { notFound } from "next/navigation";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { getPublishedStoryBySlug } from "@/services/collection.service";

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicStoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);

  if (!story?.collection.isPublic) {
    notFound();
  }

  const photos = story.collection.photos.map((photo) => ({
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
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="mb-3 text-sm uppercase tracking-[0.25em] text-zinc-400">
          LensGraph Story
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {story.title}
        </h1>
        {story.intro ? (
          <p className="mt-4 max-w-2xl text-lg text-zinc-300">{story.intro}</p>
        ) : null}
        {/* TODO(OpenWeather): Display ambient weather for story context */}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <PhotoGrid photos={photos} />
      </section>
    </main>
  );
}

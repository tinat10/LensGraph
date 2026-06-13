import { notFound } from "next/navigation";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { StoryWeatherBanner } from "@/components/story/StoryWeatherBanner";
import { serializePhoto } from "@/lib/photos/serialize";
import { getPublishedStoryBySlug } from "@/services/collection.service";
import { getStoryWeatherContext } from "@/services/story-weather.service";

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicStoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);

  if (!story?.collection.isPublic) {
    notFound();
  }

  const photos = story.collection.photos.map((photo) =>
    serializePhoto(photo, story.collection.coverPhotoId),
  );

  const weather = await getStoryWeatherContext(
    story.collectionId,
    story.collection.coverPhotoId,
  );

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
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
            {story.intro}
          </p>
        ) : null}
        <p className="mt-6 text-sm text-zinc-500">
          {photos.length} photo{photos.length === 1 ? "" : "s"}
        </p>
        {weather ? <StoryWeatherBanner weather={weather} /> : null}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <PhotoGrid
          photos={photos}
          readOnly
          emptyTitle="No photos in this story"
          emptyDescription="The collection owner has not uploaded photos yet."
        />
      </section>
    </main>
  );
}

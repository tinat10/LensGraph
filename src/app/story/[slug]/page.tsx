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
    <main className="min-h-screen bg-paper text-ink">
      <section className="page-shell py-16 lg:py-20">
        <p className="eyebrow mb-4">Story</p>
        <h1 className="font-display max-w-4xl text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          {story.title}
        </h1>
        {story.intro ? (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            {story.intro}
          </p>
        ) : null}
        <p className="mt-6 text-sm text-subtle">
          {photos.length} photo{photos.length === 1 ? "" : "s"}
        </p>
        {weather ? <StoryWeatherBanner weather={weather} /> : null}
      </section>

      <section className="page-shell pb-20">
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

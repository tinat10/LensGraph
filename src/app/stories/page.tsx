import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { StoryCard } from "@/components/story/StoryCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPublishedStories } from "@/services/story.service";

export const metadata = {
  title: "Explore stories | LensGraph",
  description: "Browse published photo stories from LensGraph creators.",
};

export default async function ExploreStoriesPage() {
  const stories = await getPublishedStories();

  return (
    <>
      <Header />
      <main className="page-shell py-10 lg:py-12">
        <div className="mb-10 border-b border-line pb-8">
          <p className="eyebrow mb-3">Public gallery</p>
          <h1 className="font-display max-w-2xl text-4xl tracking-tight text-ink sm:text-5xl">
            Explore stories
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">
            Published visual stories from LensGraph creators — curated galleries
            with metadata, AI insights, and location context.
          </p>
        </div>

        {stories.length === 0 ? (
          <EmptyState
            title="No published stories yet"
            description="When creators publish a collection as a story, it will show up here for everyone to browse."
            action={
              <Link href="/signin">
                <Button>Sign in to publish yours</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                slug={story.slug}
                title={story.title}
                intro={story.intro}
                photoCount={story.collection._count.photos}
                updatedAt={story.updatedAt.toISOString()}
                coverPhotoUrl={
                  story.collection.coverPhoto?.thumbnailUrl ??
                  story.collection.coverPhoto?.secureUrl ??
                  null
                }
                authorName={story.collection.user.name}
                authorImage={story.collection.user.image}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

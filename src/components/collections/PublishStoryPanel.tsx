"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type StorySummary = {
  slug: string;
  title: string;
  intro: string | null;
  isPublished: boolean;
} | null;

type PublishStoryPanelProps = {
  collectionId: string;
  collectionTitle: string;
  initialStory: StorySummary;
};

export function PublishStoryPanel({
  collectionId,
  collectionTitle,
  initialStory,
}: PublishStoryPanelProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(initialStory?.title ?? collectionTitle);
  const [intro, setIntro] = useState(initialStory?.intro ?? "");
  const [slug, setSlug] = useState(initialStory?.slug ?? "");
  const [isPublished, setIsPublished] = useState(
    initialStory?.isPublished ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePublish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections/${collectionId}/story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          intro: intro || undefined,
          slug: slug || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to publish story");
      }

      setIsPublished(true);
      setSlug(data.story.slug);
      setIsOpen(false);
      router.refresh();
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Failed to publish story",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnpublish() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections/${collectionId}/story`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to unpublish story");
      }

      setIsPublished(false);
      router.refresh();
    } catch (unpublishError) {
      setError(
        unpublishError instanceof Error
          ? unpublishError.message
          : "Failed to unpublish story",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isPublished ? "Manage story" : "Publish story"}
        </Button>
        {isPublished && slug ? (
          <Link href={`/story/${slug}`} target="_blank">
            <Button type="button" variant="ghost">
              View public page
            </Button>
          </Link>
        ) : null}
      </div>

      {isOpen ? (
        <form
          onSubmit={handlePublish}
          className="absolute right-0 z-20 mt-3 w-[min(100vw-3rem,24rem)] surface-panel p-4 shadow-[var(--shadow-lift)]"
        >
          <p className="mb-3 font-display text-lg text-ink">
            {isPublished ? "Update story page" : "Publish story page"}
          </p>
          <p className="mb-4 text-xs leading-5 text-muted">
            Publishing sets this collection to public. Unpublish to make it
            private again.
          </p>

          <div className="space-y-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Story title"
              required
            />
            <Textarea
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              placeholder="Intro paragraph"
            />
            <Input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Custom slug (optional)"
            />
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isPublished
                  ? "Update & keep published"
                  : "Publish"}
            </Button>
            {isPublished ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={handleUnpublish}
              >
                Unpublish
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

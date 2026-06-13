"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { PhotoTagSummary } from "@/lib/photos/serialize";

type PhotoTagEditorProps = {
  photoId: string;
  tags: PhotoTagSummary[];
  onTagsChange: (tags: PhotoTagSummary[]) => void;
};

export function PhotoTagEditor({
  photoId,
  tags,
  onTagsChange,
}: PhotoTagEditorProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [removingTagId, setRemovingTagId] = useState<string | null>(null);

  async function handleAddTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/photos/${photoId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add tag");
      }

      onTagsChange([...tags, data.tag]);
      setDraft("");
    } catch (addError) {
      setError(
        addError instanceof Error ? addError.message : "Failed to add tag",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveTag(tagId: string) {
    setRemovingTagId(tagId);
    setError(null);

    try {
      const response = await fetch(
        `/api/photos/${photoId}/tags?tagId=${tagId}`,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to remove tag");
      }

      onTagsChange(tags.filter((tag) => tag.id !== tagId));
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Failed to remove tag",
      );
    } finally {
      setRemovingTagId(null);
    }
  }

  return (
    <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
        Tags
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-sm text-zinc-500">No tags yet</p>
        ) : (
          tags.map((tag) => {
            const isManual = tag.type === "MANUAL";

            return (
            <span
              key={tag.id}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {tag.type !== "MANUAL" ? (
                <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
                  {tag.type.toLowerCase()}
                </span>
              ) : null}
              {tag.name}
              {isManual ? (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                disabled={removingTagId === tag.id}
                className="text-zinc-500 hover:text-red-600"
                aria-label={`Remove tag ${tag.name}`}
              >
                ×
              </button>
              ) : null}
            </span>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddTag} className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a tag"
          disabled={isSaving}
        />
        <Button type="submit" disabled={isSaving || !draft.trim()}>
          Add
        </Button>
      </form>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

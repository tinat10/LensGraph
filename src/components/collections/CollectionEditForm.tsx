"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type CollectionEditFormProps = {
  collectionId: string;
  initialTitle: string;
  initialDescription: string | null;
};

export function CollectionEditForm({
  collectionId,
  initialTitle,
  initialDescription,
}: CollectionEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update collection");
      }

      setIsEditing(false);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update collection",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight text-ink">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {description}
              </p>
            ) : (
              <p className="mt-2 text-sm text-subtle">No description yet</p>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="edit-title" className="text-sm font-medium text-ink-secondary">
          Title
        </label>
        <Input
          id="edit-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="edit-description"
          className="text-sm font-medium text-ink-secondary"
        >
          Description
        </label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSaving}
          onClick={() => {
            setTitle(initialTitle);
            setDescription(initialDescription ?? "");
            setIsEditing(false);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

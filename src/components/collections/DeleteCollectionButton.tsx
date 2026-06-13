"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type DeleteCollectionButtonProps = {
  collectionId: string;
  collectionTitle: string;
};

export function DeleteCollectionButton({
  collectionId,
  collectionTitle,
}: DeleteCollectionButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${collectionTitle}" and all of its photos permanently?`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete collection");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete collection",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        disabled={isDeleting}
        onClick={handleDelete}
        className="text-red-600 hover:text-red-700"
      >
        {isDeleting ? "Deleting..." : "Delete collection"}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MetadataPanel } from "@/components/photos/MetadataPanel";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import type { PhotoCardData } from "@/components/photos/PhotoCard";
import { Button } from "@/components/ui/Button";

type CollectionGalleryProps = {
  collectionId: string;
  initialPhotos: PhotoCardData[];
};

export function CollectionGallery({
  collectionId,
  initialPhotos,
}: CollectionGalleryProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(
    initialPhotos[0]?.id ?? null,
  );
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) ?? null,
    [photos, selectedPhotoId],
  );

  async function handleDeletePhoto(photoId: string) {
    const confirmed = window.confirm("Delete this photo permanently?");
    if (!confirmed) return;

    setDeletingPhotoId(photoId);
    setError(null);

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete photo");
      }

      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
      setSelectedPhotoId((current) =>
        current === photoId ? null : current,
      );
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete photo",
      );
    } finally {
      setDeletingPhotoId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <PhotoGrid
          photos={photos}
          selectedPhotoId={selectedPhotoId}
          onSelectPhoto={setSelectedPhotoId}
          onDeletePhoto={handleDeletePhoto}
          deletingPhotoId={deletingPhotoId}
          emptyAction={
            <Link href={`/collections/${collectionId}/upload`}>
              <Button>Upload photos</Button>
            </Link>
          }
        />
        <MetadataPanel photo={selectedPhoto} />
      </div>
    </div>
  );
}

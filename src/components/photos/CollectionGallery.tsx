"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MetadataPanel } from "@/components/photos/MetadataPanel";
import {
  buildPhotoSearchQuery,
  PhotoFilterBar,
  type PhotoFilterOptions,
  type PhotoFilterValues,
} from "@/components/photos/PhotoFilterBar";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import type { PhotoCardData } from "@/components/photos/PhotoCard";
import type { PhotoTagSummary } from "@/lib/photos/serialize";
import { Button } from "@/components/ui/Button";

type CollectionGalleryProps = {
  collectionId: string;
  coverPhotoId: string | null;
  initialPhotos: PhotoCardData[];
  filterOptions: PhotoFilterOptions;
};

export function CollectionGallery({
  collectionId,
  coverPhotoId,
  initialPhotos,
  filterOptions,
}: CollectionGalleryProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [currentCoverPhotoId, setCurrentCoverPhotoId] = useState(coverPhotoId);
  const [options, setOptions] = useState(filterOptions);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(
    initialPhotos[0]?.id ?? null,
  );
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [settingCoverPhotoId, setSettingCoverPhotoId] = useState<string | null>(
    null,
  );
  const [isFiltering, setIsFiltering] = useState(false);
  const [resultCount, setResultCount] = useState(initialPhotos.length);
  const [error, setError] = useState<string | null>(null);

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) ?? null,
    [photos, selectedPhotoId],
  );

  async function fetchPhotos(query = "") {
    setIsFiltering(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/collections/${collectionId}/photos?${query}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to filter photos");
      }

      setPhotos(data.photos);
      setOptions(data.filterOptions);
      setResultCount(data.count);
      setSelectedPhotoId((current) => {
        if (current && data.photos.some((photo: PhotoCardData) => photo.id === current)) {
          return current;
        }
        return data.photos[0]?.id ?? null;
      });
    } catch (filterError) {
      setError(
        filterError instanceof Error
          ? filterError.message
          : "Failed to filter photos",
      );
    } finally {
      setIsFiltering(false);
    }
  }

  async function handleApplyFilters(filters: PhotoFilterValues) {
    await fetchPhotos(buildPhotoSearchQuery(filters));
  }

  async function handleFindSimilar(photoId: string) {
    await fetchPhotos(buildPhotoSearchQuery(emptyFiltersFromBar(), photoId));
  }

  function emptyFiltersFromBar(): PhotoFilterValues {
    return {
      query: "",
      tag: "",
      location: "",
      cameraMake: "",
      cameraModel: "",
      colorHex: "",
      takenAfter: "",
      takenBefore: "",
      semanticQuery: "",
    };
  }

  async function handleClearFilters() {
    await fetchPhotos("");
  }

  function handleTagsChange(photoId: string, tags: PhotoTagSummary[]) {
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === photoId ? { ...photo, tags } : photo,
      ),
    );
  }

  function handlePhotoEnriched(
    photoId: string,
    data: {
      aiCaption: string;
      aiMood: string;
      tags: PhotoTagSummary[];
    },
  ) {
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              tags: data.tags,
              metadata: {
                ...(photo.metadata ?? {
                  takenAt: null,
                  cameraMake: null,
                  cameraModel: null,
                }),
                aiCaption: data.aiCaption,
                aiMood: data.aiMood,
                aiEnrichedAt: new Date().toISOString(),
              },
            }
          : photo,
      ),
    );
  }

  function handlePhotoGeocoded(
    photoId: string,
    data: {
      locationName: string;
      city: string | null;
      country: string | null;
      tags: PhotoTagSummary[];
    },
  ) {
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              tags: data.tags,
              metadata: {
                ...(photo.metadata ?? {
                  takenAt: null,
                  cameraMake: null,
                  cameraModel: null,
                }),
                locationName: data.locationName,
                city: data.city,
                country: data.country,
                locationGeocodedAt: new Date().toISOString(),
              },
            }
          : photo,
      ),
    );
  }

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
      if (currentCoverPhotoId === photoId) {
        setCurrentCoverPhotoId(null);
      }
      setSelectedPhotoId((current) =>
        current === photoId ? null : current,
      );
      setResultCount((count) => Math.max(0, count - 1));
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

  async function handleSetCover(photoId: string) {
    setSettingCoverPhotoId(photoId);
    setError(null);

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoId: photoId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to set cover photo");
      }

      setCurrentCoverPhotoId(photoId);
      setPhotos((current) =>
        current.map((photo) => ({
          ...photo,
          isCover: photo.id === photoId,
        })),
      );
      router.refresh();
    } catch (coverError) {
      setError(
        coverError instanceof Error
          ? coverError.message
          : "Failed to set cover photo",
      );
    } finally {
      setSettingCoverPhotoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PhotoFilterBar
        options={options}
        selectedPhotoId={selectedPhotoId}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onFindSimilar={handleFindSimilar}
        isLoading={isFiltering}
        resultCount={resultCount}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <PhotoGrid
          photos={photos}
          selectedPhotoId={selectedPhotoId}
          onSelectPhoto={setSelectedPhotoId}
          onDeletePhoto={handleDeletePhoto}
          onSetCover={handleSetCover}
          deletingPhotoId={deletingPhotoId}
          settingCoverPhotoId={settingCoverPhotoId}
          emptyAction={
            <Link href={`/collections/${collectionId}/upload`}>
              <Button>Upload photos</Button>
            </Link>
          }
        />
        <MetadataPanel
          photo={selectedPhoto}
          onTagsChange={handleTagsChange}
          onEnriched={handlePhotoEnriched}
          onGeocoded={handlePhotoGeocoded}
        />
      </div>
    </div>
  );
}

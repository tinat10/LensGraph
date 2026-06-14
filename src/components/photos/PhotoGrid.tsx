"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { PhotoCard, type PhotoCardData } from "@/components/photos/PhotoCard";

type PhotoGridProps = {
  photos: PhotoCardData[];
  selectedPhotoId?: string | null;
  onSelectPhoto?: (photoId: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onSetCover?: (photoId: string) => void;
  deletingPhotoId?: string | null;
  settingCoverPhotoId?: string | null;
  readOnly?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
};

function gridClassName(photoCount: number) {
  if (photoCount === 1) {
    return "grid max-w-xs grid-cols-1 gap-4 sm:max-w-sm";
  }

  if (photoCount === 2) {
    return "grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2";
  }

  return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
}

export function PhotoGrid({
  photos,
  selectedPhotoId,
  onSelectPhoto,
  onDeletePhoto,
  onSetCover,
  deletingPhotoId,
  settingCoverPhotoId,
  readOnly = false,
  emptyTitle = "No photos yet",
  emptyDescription = "Upload images to start building this collection.",
  emptyAction,
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={gridClassName(photos.length)}>
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          selected={!readOnly && selectedPhotoId === photo.id}
          onSelect={readOnly ? undefined : onSelectPhoto}
          onDelete={readOnly ? undefined : onDeletePhoto}
          onSetCover={readOnly ? undefined : onSetCover}
          isDeleting={deletingPhotoId === photo.id}
          isSettingCover={settingCoverPhotoId === photo.id}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

export type { PhotoCardData };

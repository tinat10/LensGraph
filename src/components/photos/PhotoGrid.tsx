import { EmptyState } from "@/components/ui/EmptyState";
import { PhotoCard, type PhotoCardData } from "@/components/photos/PhotoCard";

type PhotoGridProps = {
  photos: PhotoCardData[];
  selectedPhotoId?: string | null;
  onSelectPhoto?: (photoId: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  deletingPhotoId?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
};

export function PhotoGrid({
  photos,
  selectedPhotoId,
  onSelectPhoto,
  onDeletePhoto,
  deletingPhotoId,
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          selected={selectedPhotoId === photo.id}
          onSelect={onSelectPhoto}
          onDelete={onDeletePhoto}
          isDeleting={deletingPhotoId === photo.id}
        />
      ))}
    </div>
  );
}

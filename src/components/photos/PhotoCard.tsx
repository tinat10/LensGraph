import Image from "next/image";

export type PhotoCardData = {
  id: string;
  originalFilename: string;
  secureUrl: string;
  thumbnailUrl: string | null;
  format: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  uploadedAt: string | Date;
  metadata: {
    takenAt: Date | string | null;
    cameraMake: string | null;
    cameraModel: string | null;
  } | null;
  colorPalette: {
    dominantHex: string | null;
  } | null;
};

type PhotoCardProps = {
  photo: PhotoCardData;
  selected?: boolean;
  onSelect?: (photoId: string) => void;
  onDelete?: (photoId: string) => void;
  isDeleting?: boolean;
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoCard({
  photo,
  selected = false,
  onSelect,
  onDelete,
  isDeleting = false,
}: PhotoCardProps) {
  const camera = [photo.metadata?.cameraMake, photo.metadata?.cameraModel]
    .filter(Boolean)
    .join(" ");
  const accent = photo.colorPalette?.dominantHex;
  const fileSize = formatFileSize(photo.fileSize);

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white transition dark:bg-zinc-950 ${
        selected
          ? "border-zinc-900 ring-2 ring-zinc-900/10 dark:border-zinc-100"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect?.(photo.id)}
        className="block w-full text-left"
      >
        <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900">
          <Image
            src={photo.thumbnailUrl ?? photo.secureUrl}
            alt={photo.originalFilename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {accent ? (
            <span
              className="absolute bottom-3 right-3 h-5 w-5 rounded-full border border-white/70 shadow"
              style={{ backgroundColor: accent }}
              title="Dominant color"
            />
          ) : null}
        </div>
      </button>

      <div className="space-y-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {photo.originalFilename}
          </p>
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(photo.id)}
              disabled={isDeleting}
              className="shrink-0 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          ) : null}
        </div>
        <p className="text-xs text-zinc-500">
          {photo.metadata?.takenAt
            ? new Date(photo.metadata.takenAt).toLocaleString()
            : "Date unknown"}
          {camera ? ` · ${camera}` : ""}
        </p>
        <p className="text-xs text-zinc-400">
          {photo.width && photo.height
            ? `${photo.width} × ${photo.height}`
            : "Dimensions unknown"}
          {fileSize ? ` · ${fileSize}` : ""}
          {photo.format ? ` · ${photo.format.toUpperCase()}` : ""}
        </p>
      </div>
    </article>
  );
}

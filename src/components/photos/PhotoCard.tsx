"use client";

import Image from "next/image";
import type { PhotoTagSummary } from "@/lib/photos/serialize";

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
    aiCaption?: string | null;
    aiMood?: string | null;
    aiEnrichedAt?: Date | string | null;
    locationName?: string | null;
    city?: string | null;
    country?: string | null;
    locationGeocodedAt?: Date | string | null;
  } | null;
  colorPalette: {
    dominantHex: string | null;
  } | null;
  tags?: PhotoTagSummary[];
  isCover?: boolean;
};

type PhotoCardProps = {
  photo: PhotoCardData;
  selected?: boolean;
  onSelect?: (photoId: string) => void;
  onDelete?: (photoId: string) => void;
  onSetCover?: (photoId: string) => void;
  isDeleting?: boolean;
  isSettingCover?: boolean;
  readOnly?: boolean;
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
  onSetCover,
  isDeleting = false,
  isSettingCover = false,
  readOnly = false,
}: PhotoCardProps) {
  const camera = [photo.metadata?.cameraMake, photo.metadata?.cameraModel]
    .filter(Boolean)
    .join(" ");
  const accent = photo.colorPalette?.dominantHex;
  const fileSize = formatFileSize(photo.fileSize);

  return (
    <article
      className={`surface-interactive overflow-hidden ${
        selected ? "border-ink ring-2 ring-ink/8" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => !readOnly && onSelect?.(photo.id)}
        disabled={readOnly}
        className={`block w-full text-left ${readOnly ? "cursor-default" : ""}`}
      >
        <div className="relative aspect-[4/3] bg-paper-muted">
          <Image
            src={photo.thumbnailUrl ?? photo.secureUrl}
            alt={photo.originalFilename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {photo.isCover ? (
            <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-medium tracking-wide text-surface uppercase">
              Cover
            </span>
          ) : null}
          {accent ? (
            <span
              className="absolute right-3 bottom-3 h-5 w-5 rounded-full border border-surface shadow-sm"
              style={{ backgroundColor: accent }}
              title="Dominant color"
            />
          ) : null}
        </div>
      </button>

      <div className="space-y-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-ink">
            {photo.originalFilename}
          </p>
          <div className="flex shrink-0 gap-2">
            {onSetCover && !photo.isCover ? (
              <button
                type="button"
                onClick={() => onSetCover(photo.id)}
                disabled={isSettingCover}
                className="text-xs text-muted hover:text-ink disabled:opacity-50"
              >
                {isSettingCover ? "Saving..." : "Set cover"}
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(photo.id)}
                disabled={isDeleting}
                className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            ) : null}
          </div>
        </div>

        {photo.tags && photo.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {photo.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] text-muted"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-muted">
          {photo.metadata?.takenAt
            ? new Date(photo.metadata.takenAt).toLocaleString()
            : "Date unknown"}
          {camera ? ` · ${camera}` : ""}
        </p>
        <p className="text-xs text-subtle">
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

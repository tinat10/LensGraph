"use client";

import type { PhotoCardData } from "@/components/photos/PhotoCard";
import { PhotoTagEditor } from "@/components/photos/PhotoTagEditor";
import { AiInsightsPanel } from "@/components/photos/AiInsightsPanel";
import type { PhotoTagSummary } from "@/lib/photos/serialize";

type MetadataPanelProps = {
  photo: PhotoCardData | null;
  onTagsChange?: (photoId: string, tags: PhotoTagSummary[]) => void;
  onEnriched?: (
    photoId: string,
    data: {
      aiCaption: string;
      aiMood: string;
      tags: PhotoTagSummary[];
    },
  ) => void;
};

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
}

function formatShutterSpeed(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  if (value >= 1) return `${value}s`;
  return `1/${Math.round(1 / value)}s`;
}

export function MetadataPanel({ photo, onTagsChange, onEnriched }: MetadataPanelProps) {
  if (!photo) {
    return (
      <aside className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Metadata
        </h2>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Select a photo to inspect EXIF details, tags, and color analysis.
        </p>
      </aside>
    );
  }

  const metadata = photo.metadata as PhotoCardData["metadata"] & {
    lensModel?: string | null;
    iso?: number | null;
    aperture?: number | null;
    shutterSpeed?: number | null;
    focalLength?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    aiCaption?: string | null;
    aiMood?: string | null;
    aiEnrichedAt?: string | Date | null;
  } | null;

  const palette = photo.colorPalette as PhotoCardData["colorPalette"] & {
    brightnessScore?: number | null;
    warmthScore?: number | null;
    contrastScore?: number | null;
    paletteJson?: Record<string, string | null> | null;
  } | null;

  const rows = [
    ["Filename", photo.originalFilename],
    ["Format", photo.format?.toUpperCase() ?? "—"],
    [
      "Dimensions",
      photo.width && photo.height ? `${photo.width} × ${photo.height}` : "—",
    ],
    ["Uploaded", new Date(photo.uploadedAt).toLocaleString()],
    [
      "Taken",
      metadata?.takenAt
        ? new Date(metadata.takenAt).toLocaleString()
        : "—",
    ],
    ["Camera make", formatValue(metadata?.cameraMake)],
    ["Camera model", formatValue(metadata?.cameraModel)],
    ["Lens", formatValue(metadata?.lensModel)],
    ["ISO", formatValue(metadata?.iso)],
    ["Aperture", metadata?.aperture ? `f/${metadata.aperture}` : "—"],
    ["Shutter", formatShutterSpeed(metadata?.shutterSpeed)],
    [
      "Focal length",
      metadata?.focalLength ? `${metadata.focalLength}mm` : "—",
    ],
    [
      "GPS",
      metadata?.latitude && metadata?.longitude
        ? `${metadata.latitude.toFixed(5)}, ${metadata.longitude.toFixed(5)}`
        : "—",
    ],
    ["Dominant color", palette?.dominantHex ?? "—"],
    [
      "Brightness",
      palette?.brightnessScore !== null && palette?.brightnessScore !== undefined
        ? palette.brightnessScore.toFixed(2)
        : "—",
    ],
    [
      "Warmth",
      palette?.warmthScore !== null && palette?.warmthScore !== undefined
        ? palette.warmthScore.toFixed(2)
        : "—",
    ],
    [
      "Contrast",
      palette?.contrastScore !== null && palette?.contrastScore !== undefined
        ? palette.contrastScore.toFixed(2)
        : "—",
    ],
  ];

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        Metadata
      </h2>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-3 text-sm">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="break-all text-zinc-900 dark:text-zinc-100">{value}</dd>
          </div>
        ))}
      </dl>

      {palette?.paletteJson ? (
        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
            Palette
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(palette.paletteJson)
              .filter(([, hex]) => hex)
              .map(([name, hex]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-700"
                    style={{ backgroundColor: hex ?? undefined }}
                  />
                  <span className="text-zinc-500">{name}</span>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      <AiInsightsPanel
        photoId={photo.id}
        aiCaption={metadata?.aiCaption}
        aiMood={metadata?.aiMood}
        aiEnrichedAt={
          metadata?.aiEnrichedAt
            ? new Date(metadata.aiEnrichedAt).toISOString()
            : null
        }
        onEnriched={(data) => onEnriched?.(photo.id, data)}
      />

      <PhotoTagEditor
        photoId={photo.id}
        tags={photo.tags ?? []}
        onTagsChange={(tags) => onTagsChange?.(photo.id, tags)}
      />

      {/* TODO(Mapbox): Display reverse-geocoded location name here */}
    </aside>
  );
}

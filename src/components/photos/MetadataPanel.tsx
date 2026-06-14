"use client";

import type { PhotoCardData } from "@/components/photos/PhotoCard";
import { PhotoTagEditor } from "@/components/photos/PhotoTagEditor";
import { AiInsightsPanel } from "@/components/photos/AiInsightsPanel";
import { LocationPanel } from "@/components/photos/LocationPanel";
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
  onGeocoded?: (
    photoId: string,
    data: {
      locationName: string;
      city: string | null;
      country: string | null;
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

export function MetadataPanel({ photo, onTagsChange, onEnriched, onGeocoded }: MetadataPanelProps) {
  if (!photo) {
    return (
      <aside className="surface-panel p-6 xl:min-h-0">
        <h2 className="eyebrow">Metadata</h2>
        <p className="mt-4 text-sm leading-6 text-muted">
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
    locationName?: string | null;
    city?: string | null;
    country?: string | null;
    locationGeocodedAt?: string | Date | null;
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
    <aside className="surface-panel p-6 xl:min-h-0">
      <h2 className="eyebrow">Metadata</h2>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-3 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="break-all text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {palette?.paletteJson ? (
        <div className="mt-6">
          <p className="eyebrow mb-3">Palette</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(palette.paletteJson)
              .filter(([, hex]) => hex)
              .map(([name, hex]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-4 w-4 rounded-full border border-line"
                    style={{ backgroundColor: hex ?? undefined }}
                  />
                  <span className="text-subtle">{name}</span>
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

      <LocationPanel
        photoId={photo.id}
        latitude={metadata?.latitude}
        longitude={metadata?.longitude}
        locationName={metadata?.locationName}
        city={metadata?.city}
        country={metadata?.country}
        locationGeocodedAt={
          metadata?.locationGeocodedAt
            ? new Date(metadata.locationGeocodedAt).toISOString()
            : null
        }
        onGeocoded={(data) => onGeocoded?.(photo.id, data)}
      />

      <PhotoTagEditor
        photoId={photo.id}
        tags={photo.tags ?? []}
        onTagsChange={(tags) => onTagsChange?.(photo.id, tags)}
      />
    </aside>
  );
}

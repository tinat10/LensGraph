"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PhotoTagSummary } from "@/lib/photos/serialize";

type LocationPanelProps = {
  photoId: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  locationName: string | null | undefined;
  city: string | null | undefined;
  country: string | null | undefined;
  locationGeocodedAt: string | null | undefined;
  onGeocoded: (data: {
    locationName: string;
    city: string | null;
    country: string | null;
    tags: PhotoTagSummary[];
  }) => void;
};

export function LocationPanel({
  photoId,
  latitude,
  longitude,
  locationName,
  city,
  country,
  locationGeocodedAt,
  onGeocoded,
}: LocationPanelProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGps = latitude != null && longitude != null;
  const hasLocation = Boolean(locationName || city || country);

  async function handleGeocode() {
    setIsGeocoding(true);
    setError(null);

    try {
      const response = await fetch(`/api/photos/${photoId}/geocode`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Geocoding failed");
      }

      onGeocoded({
        locationName: data.geocode.locationName,
        city: data.geocode.city,
        country: data.geocode.country,
        tags: data.geocode.tags,
      });
    } catch (geocodeError) {
      setError(
        geocodeError instanceof Error
          ? geocodeError.message
          : "Geocoding failed",
      );
    } finally {
      setIsGeocoding(false);
    }
  }

  if (!hasGps && !hasLocation) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
          Location
        </p>
        {hasGps ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isGeocoding}
            onClick={handleGeocode}
          >
            {isGeocoding
              ? "Geocoding..."
              : hasLocation
                ? "Re-geocode"
                : "Resolve place name"}
          </Button>
        ) : null}
      </div>

      {hasLocation ? (
        <div className="space-y-2 text-sm">
          {locationName ? (
            <p className="leading-6 text-zinc-900 dark:text-zinc-100">
              {locationName}
            </p>
          ) : null}
          {city || country ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              {[city, country].filter(Boolean).join(", ")}
            </p>
          ) : null}
          {locationGeocodedAt ? (
            <p className="text-xs text-zinc-400">
              Geocoded {new Date(locationGeocodedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : hasGps ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isGeocoding
            ? "Mapbox is resolving GPS coordinates into a place name..."
            : "GPS coordinates are available. Resolve them into a searchable location."}
        </p>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

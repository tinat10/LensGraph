"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type PhotoFilterValues = {
  query: string;
  tag: string;
  location: string;
  cameraMake: string;
  cameraModel: string;
  colorHex: string;
  takenAfter: string;
  takenBefore: string;
  semanticQuery: string;
};

export type PhotoFilterOptions = {
  tags: string[];
  locations: string[];
  cameraMakes: string[];
  cameraModels: string[];
  colors: string[];
};

type PhotoFilterBarProps = {
  options: PhotoFilterOptions;
  selectedPhotoId?: string | null;
  onApply: (filters: PhotoFilterValues) => void;
  onClear: () => void;
  onFindSimilar?: (photoId: string) => void;
  isLoading?: boolean;
  resultCount?: number;
};

const emptyFilters: PhotoFilterValues = {
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

export function PhotoFilterBar({
  options,
  selectedPhotoId,
  onApply,
  onClear,
  onFindSimilar,
  isLoading = false,
  resultCount,
}: PhotoFilterBarProps) {
  const [filters, setFilters] = useState<PhotoFilterValues>(emptyFilters);

  function updateField<K extends keyof PhotoFilterValues>(
    key: K,
    value: PhotoFilterValues[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply(filters);
  }

  function handleClear() {
    setFilters(emptyFilters);
    onClear();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Search & filter
          </h2>
          {resultCount !== undefined ? (
            <p className="text-xs text-zinc-500">
              {resultCount} photo{resultCount === 1 ? "" : "s"} matching
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {selectedPhotoId && onFindSimilar ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isLoading}
              onClick={() => onFindSimilar(selectedPhotoId)}
            >
              Similar to selected
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={handleClear}>
            Clear
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Filtering..." : "Apply"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          placeholder="Search filename"
          value={filters.query}
          onChange={(event) => updateField("query", event.target.value)}
        />
        <Input
          placeholder="Natural language search"
          value={filters.semanticQuery}
          onChange={(event) => updateField("semanticQuery", event.target.value)}
        />
        <Input
          placeholder="Tag"
          list="photo-filter-tags"
          value={filters.tag}
          onChange={(event) => updateField("tag", event.target.value)}
        />
        <datalist id="photo-filter-tags">
          {options.tags.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
        <Input
          placeholder="Location"
          list="photo-filter-locations"
          value={filters.location}
          onChange={(event) => updateField("location", event.target.value)}
        />
        <datalist id="photo-filter-locations">
          {options.locations.map((location) => (
            <option key={location} value={location} />
          ))}
        </datalist>
        <Input
          placeholder="Camera make"
          list="photo-filter-makes"
          value={filters.cameraMake}
          onChange={(event) => updateField("cameraMake", event.target.value)}
        />
        <datalist id="photo-filter-makes">
          {options.cameraMakes.map((make) => (
            <option key={make} value={make} />
          ))}
        </datalist>
        <Input
          placeholder="Camera model"
          list="photo-filter-models"
          value={filters.cameraModel}
          onChange={(event) => updateField("cameraModel", event.target.value)}
        />
        <datalist id="photo-filter-models">
          {options.cameraModels.map((model) => (
            <option key={model} value={model} />
          ))}
        </datalist>
        <Input
          type="date"
          value={filters.takenAfter}
          onChange={(event) => updateField("takenAfter", event.target.value)}
          aria-label="Taken after"
        />
        <Input
          type="date"
          value={filters.takenBefore}
          onChange={(event) => updateField("takenBefore", event.target.value)}
          aria-label="Taken before"
        />
        <div className="flex items-center gap-2">
          <Input
            placeholder="#dominant color"
            list="photo-filter-colors"
            value={filters.colorHex}
            onChange={(event) => updateField("colorHex", event.target.value)}
          />
          <datalist id="photo-filter-colors">
            {options.colors.map((color) => (
              <option key={color} value={color} />
            ))}
          </datalist>
          {filters.colorHex ? (
            <span
              className="h-9 w-9 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700"
              style={{ backgroundColor: filters.colorHex }}
            />
          ) : null}
        </div>
      </div>

      {options.colors.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.colors.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => updateField("colorHex", color)}
              className={`h-6 w-6 rounded-full border ${
                filters.colorHex === color
                  ? "border-zinc-900 ring-2 ring-zinc-900/20 dark:border-zinc-100"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      ) : null}
    </form>
  );
}

export function buildPhotoSearchQuery(
  filters: PhotoFilterValues,
  similarToPhotoId?: string,
) {
  const params = new URLSearchParams();
  if (filters.query) params.set("query", filters.query);
  if (filters.semanticQuery) params.set("semanticQuery", filters.semanticQuery);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.location) params.set("location", filters.location);
  if (filters.cameraMake) params.set("cameraMake", filters.cameraMake);
  if (filters.cameraModel) params.set("cameraModel", filters.cameraModel);
  if (filters.colorHex) params.set("colorHex", filters.colorHex);
  if (filters.takenAfter) params.set("takenAfter", filters.takenAfter);
  if (filters.takenBefore) params.set("takenBefore", filters.takenBefore);
  if (similarToPhotoId) params.set("similarToPhotoId", similarToPhotoId);
  return params.toString();
}

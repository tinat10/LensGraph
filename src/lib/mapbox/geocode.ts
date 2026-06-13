import { z } from "zod";
import { getMapboxAccessToken } from "@/lib/mapbox/client";

const mapboxContextSchema = z.object({
  id: z.string(),
  text: z.string(),
  short_code: z.string().optional(),
});

const mapboxFeatureSchema = z.object({
  place_name: z.string(),
  text: z.string(),
  context: z.array(mapboxContextSchema).optional(),
});

const mapboxResponseSchema = z.object({
  features: z.array(mapboxFeatureSchema),
});

export type ReverseGeocodeResult = {
  locationName: string;
  city: string | null;
  country: string | null;
  tagNames: string[];
};

function contextText(
  context: z.infer<typeof mapboxContextSchema>[] | undefined,
  prefix: string,
): string | null {
  const match = context?.find((entry) => entry.id.startsWith(prefix));
  return match?.text ?? null;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const token = getMapboxAccessToken();
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "poi,address,place,locality,neighborhood");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed (${response.status})`);
  }

  const json = mapboxResponseSchema.parse(await response.json());
  const feature = json.features[0];
  if (!feature) {
    throw new Error("Mapbox returned no location results");
  }

  const city =
    contextText(feature.context, "place.") ??
    contextText(feature.context, "locality.") ??
    feature.text;
  const country = contextText(feature.context, "country.");

  const tagNames = new Set<string>();
  if (city) tagNames.add(city);
  if (country) tagNames.add(country);
  const region = contextText(feature.context, "region.");
  if (region) tagNames.add(region);

  return {
    locationName: feature.place_name,
    city,
    country,
    tagNames: [...tagNames],
  };
}

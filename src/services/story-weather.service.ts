import { prisma } from "@/lib/db/prisma";
import { isOpenWeatherConfigured } from "@/lib/openweather/client";
import {
  fetchCurrentWeather,
  type WeatherSnapshot,
} from "@/lib/openweather/weather";

export type StoryWeatherContext = WeatherSnapshot & {
  label: string;
  sourcePhotoLabel: string | null;
};

type LocationMetadata = {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  city: string | null;
};

export async function getStoryWeatherContext(
  collectionId: string,
  coverPhotoId: string | null,
): Promise<StoryWeatherContext | null> {
  if (!isOpenWeatherConfigured()) {
    return null;
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: {
      coverPhoto: {
        select: {
          metadata: {
            select: {
              latitude: true,
              longitude: true,
              locationName: true,
              city: true,
            },
          },
        },
      },
      photos: {
        select: {
          id: true,
          metadata: {
            select: {
              latitude: true,
              longitude: true,
              locationName: true,
              city: true,
            },
          },
        },
      },
    },
  });

  if (!collection) return null;

  let source: LocationMetadata | null = null;

  const coverMetadata = collection.coverPhoto?.metadata;
  if (coverMetadata?.latitude != null && coverMetadata.longitude != null) {
    source = coverMetadata;
  }

  if (!source && coverPhotoId) {
    const coverPhoto = collection.photos.find(
      (photo) => photo.id === coverPhotoId,
    );
    if (
      coverPhoto?.metadata?.latitude != null &&
      coverPhoto.metadata.longitude != null
    ) {
      source = coverPhoto.metadata;
    }
  }

  if (!source) {
    const located = collection.photos.find(
      (photo) =>
        photo.metadata?.latitude != null &&
        photo.metadata?.longitude != null,
    );
    source = located?.metadata ?? null;
  }

  if (!source?.latitude || source.longitude == null) {
    return null;
  }

  try {
    const weather = await fetchCurrentWeather(
      source.latitude,
      source.longitude,
    );

    return {
      ...weather,
      label: "Current conditions at the story location",
      sourcePhotoLabel: source.locationName ?? source.city ?? weather.placeName,
    };
  } catch (error) {
    console.error("[story-weather]", error);
    return null;
  }
}

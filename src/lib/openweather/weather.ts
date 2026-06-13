import { z } from "zod";
import { getOpenWeatherApiKey } from "@/lib/openweather/client";

const weatherResponseSchema = z.object({
  name: z.string(),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
  }),
  weather: z
    .array(
      z.object({
        description: z.string(),
        main: z.string(),
      }),
    )
    .min(1),
  wind: z.object({
    speed: z.number(),
  }),
});

export type WeatherSnapshot = {
  placeName: string;
  temperatureC: number;
  feelsLikeC: number;
  description: string;
  summary: string;
  windSpeedMs: number;
};

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherSnapshot> {
  const apiKey = getOpenWeatherApiKey();
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");

  const response = await fetch(url.toString(), { next: { revalidate: 1800 } });
  if (!response.ok) {
    throw new Error(`OpenWeather request failed (${response.status})`);
  }

  const data = weatherResponseSchema.parse(await response.json());
  const weather = data.weather[0];

  return {
    placeName: data.name,
    temperatureC: Math.round(data.main.temp),
    feelsLikeC: Math.round(data.main.feels_like),
    description: weather.description,
    summary: weather.main,
    windSpeedMs: data.wind.speed,
  };
}

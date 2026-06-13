import type { StoryWeatherContext } from "@/services/story-weather.service";

type StoryWeatherBannerProps = {
  weather: StoryWeatherContext;
};

export function StoryWeatherBanner({ weather }: StoryWeatherBannerProps) {
  return (
    <div className="surface-panel mt-8 inline-flex flex-col gap-1 px-5 py-4 text-sm">
      <p className="eyebrow">{weather.label}</p>
      <p className="font-display text-xl text-ink">
        {weather.sourcePhotoLabel ?? weather.placeName} · {weather.temperatureC}
        °C · {weather.description}
      </p>
      <p className="text-xs text-subtle">
        Feels like {weather.feelsLikeC}°C · Wind {weather.windSpeedMs.toFixed(1)}{" "}
        m/s
      </p>
    </div>
  );
}

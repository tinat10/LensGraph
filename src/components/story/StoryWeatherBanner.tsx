import type { StoryWeatherContext } from "@/services/story-weather.service";

type StoryWeatherBannerProps = {
  weather: StoryWeatherContext;
};

export function StoryWeatherBanner({ weather }: StoryWeatherBannerProps) {
  return (
    <div className="mt-6 inline-flex flex-col gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {weather.label}
      </p>
      <p className="text-base text-zinc-100">
        {weather.sourcePhotoLabel ?? weather.placeName} · {weather.temperatureC}
        °C · {weather.description}
      </p>
      <p className="text-xs text-zinc-500">
        Feels like {weather.feelsLikeC}°C · Wind {weather.windSpeedMs.toFixed(1)}{" "}
        m/s
      </p>
    </div>
  );
}

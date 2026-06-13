export function isOpenWeatherConfigured(): boolean {
  return Boolean(process.env.OPENWEATHER_API_KEY?.trim());
}

export function getOpenWeatherApiKey(): string {
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENWEATHER_API_KEY is not configured. Add it to .env to enable weather context.",
    );
  }
  return apiKey;
}

export function isMapboxConfigured(): boolean {
  return Boolean(process.env.MAPBOX_ACCESS_TOKEN?.trim());
}

export function getMapboxAccessToken(): string {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "MAPBOX_ACCESS_TOKEN is not configured. Add it to .env to enable geocoding.",
    );
  }
  return token;
}

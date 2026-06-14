export async function parseApiErrorResponse(
  response: Response,
  fallback = "Request failed",
): Promise<string> {
  const text = await response.text();

  try {
    const data = JSON.parse(text) as { error?: string };
    if (data.error) {
      return data.error;
    }
  } catch {
    // Safari surfaces HTML/empty bodies as "The string did not match the expected pattern"
    // when callers use response.json() — parse text explicitly instead.
  }

  if (response.status === 413) {
    return "Photo is too large for the server. Try a smaller image or upload one at a time.";
  }

  if (response.status === 401) {
    return "Your session expired. Sign in again and retry.";
  }

  if (response.status >= 500) {
    return "Server error while uploading. Try again in a moment.";
  }

  return `${fallback} (${response.status})`;
}

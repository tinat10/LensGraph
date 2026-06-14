function messageFromParsedBody(
  data: { error?: string; message?: string },
  response: Response,
  fallback: string,
): string {
  if (data.error) return data.error;
  if (data.message) return data.message;
  if (response.status === 401) {
    return "Your session expired. Sign in again and retry.";
  }
  if (response.status === 413) {
    return "Photo is too large for the server. Try a smaller image or upload one at a time.";
  }
  if (response.status >= 500) {
    return `${fallback} (server error ${response.status})`;
  }
  return `${fallback} (${response.status})`;
}

function messageFromHtmlBody(
  response: Response,
  fallback: string,
): string {
  if (response.status === 401 || response.redirected) {
    return "Your session expired. Sign in again and retry.";
  }

  return `${fallback} — the server returned a sign-in page instead of data. Refresh and try again.`;
}

export async function parseApiErrorResponse(
  response: Response,
  fallback = "Request failed",
): Promise<string> {
  const text = await response.text();

  try {
    const data = JSON.parse(text) as { error?: string; message?: string };
    return messageFromParsedBody(data, response, fallback);
  } catch {
    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
      return messageFromHtmlBody(response, fallback);
    }
  }

  if (response.status === 413) {
    return "Photo is too large for the server. Try a smaller image or upload one at a time.";
  }

  if (response.status === 401) {
    return "Your session expired. Sign in again and retry.";
  }

  if (response.status >= 500) {
    return `${fallback} (server error ${response.status})`;
  }

  return `${fallback} (${response.status})`;
}

export async function parseJsonResponse<T>(
  response: Response,
  fallback = "Request failed",
): Promise<T> {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
      throw new Error(messageFromHtmlBody(response, fallback));
    }

    throw new Error(`${fallback} (${response.status})`);
  }
}

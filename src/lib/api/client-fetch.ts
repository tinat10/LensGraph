export function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  return fetch(input, {
    credentials: "same-origin",
    ...init,
    headers: init.headers,
  });
}

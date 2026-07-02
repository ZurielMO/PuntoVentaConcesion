const BACKEND_BASE =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3000/api";

export function getBackendBaseUrl(): string {
  return BACKEND_BASE.replace(/\/$/, "");
}

export async function proxyToBackend(
  path: string,
  init: RequestInit & { headers?: HeadersInit } = {},
): Promise<Response> {
  const url = `${getBackendBaseUrl()}/${path.replace(/^\//, "")}`;

  const headers = new Headers(init.headers);
  if (
    !headers.has("Content-Type") &&
    typeof init.body === "string" &&
    init.body.length > 0
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
}

const BACKEND_BASE =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3000/api";

export function getBackendBaseUrl(): string {
  return BACKEND_BASE.replace(/\/$/, "");
}

export class BackendProxyError extends Error {
  constructor(
    message: string,
    public readonly causeCode?: string,
  ) {
    super(message);
    this.name = "BackendProxyError";
  }
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

  try {
    return await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    const cause =
      error instanceof Error
        ? (error as Error & { cause?: { code?: string } }).cause?.code ??
          error.message
        : "unknown";
    throw new BackendProxyError(
      `No se pudo conectar al backend (${getBackendBaseUrl()}). Revisa API_BASE_URL.`,
      typeof cause === "string" ? cause : "fetch_failed",
    );
  }
}

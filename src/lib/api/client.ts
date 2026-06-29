export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  usuario?: unknown;
  token?: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token, headers = {} } = options;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api/${path.replace(/^\//, "")}`, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const json = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    code?: string;
  };

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.message ?? `Error ${res.status}`,
      json.code,
    );
  }

  return json;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { token }),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body, token }),

  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PUT", body, token }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
};

/** Dominios del backend PuntoVentaBack */
export const apiPaths = {
  auth: {
    login: "auth/login",
    loginPassword: "auth/login/password",
    me: "auth/me",
  },
  products: "products",
  concessions: "concessions",
  sucursales: "sucursales",
  zonas: "zonas",
  jornadas: "jornadas",
  inventarios: "inventarios",
  tickets: "tickets",
  cortes: "cortes",
  users: "users",
  detalleVenta: "detalle-venta",
} as const;

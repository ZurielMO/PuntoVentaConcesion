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
    ...headers,
  };

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData) {
    reqHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api/${path.replace(/^\//, "")}`, {
    method,
    headers: reqHeaders,
    body: body !== undefined
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
    credentials: "include",
  });

  if (res.status === 204) {
    if (!res.ok) {
      throw new ApiError(res.status, `Error ${res.status}`);
    }
    return {} as T;
  }

  const json = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    code?: string;
    errors?: { campo?: string; mensaje?: string }[];
    fieldErrors?: { field?: string; message?: string }[];
  };

  if (!res.ok) {
    const validationDetail =
      json.errors
        ?.map((e) => e.mensaje)
        .filter(Boolean)
        .join("; ") ||
      json.fieldErrors
        ?.map((e) => e.message)
        .filter(Boolean)
        .join("; ");
    throw new ApiError(
      res.status,
      validationDetail || json.message || `Error ${res.status}`,
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

  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body, token }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),

  postFormData: <T>(path: string, formData: FormData, token?: string | null) =>
    request<T>(path, { method: "POST", body: formData, token }),
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
  combos: "combos",
  descuentos: "descuentos",
  trabajadoresClub: "trabajadores-club",
} as const;

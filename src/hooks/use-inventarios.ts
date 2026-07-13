"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type {
  Inventario,
  InventarioJornadaActivaData,
  InventarioMovimiento,
  InventarioProducto,
  JornadaActivaValue,
  JornadaDisponible,
} from "@/lib/types";

export function useJornadas() {
  const { token } = useAuth();
  const [jornadaActiva, setJornadaActiva] = useState<Record<string, JornadaActivaValue>>({});
  const [loading, setLoading] = useState(true);

  const fetchJornada = useCallback(async () => {
    if (!token) {
      setJornadaActiva({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<{ jornada_activa: Record<string, JornadaActivaValue> }>(
        `${apiPaths.jornadas}/activa`,
        token,
      );
      setJornadaActiva(res.jornada_activa ?? {});
    } catch {
      setJornadaActiva({});
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchJornada();
  }, [fetchJornada]);

  return { jornadaActiva, loading, refetch: fetchJornada };
}

export function useJornadasDisponibles(filters?: {
  concesionId?: string;
  sucursalId?: string;
}) {
  const { token } = useAuth();
  const [jornadas, setJornadas] = useState<JornadaDisponible[]>([]);
  const [loading, setLoading] = useState(true);

  const filterKey = JSON.stringify(filters ?? {});

  const fetchJornadas = useCallback(async () => {
    if (!token) {
      setJornadas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filters?.concesionId) qs.set("concesionId", filters.concesionId);
      if (filters?.sucursalId) qs.set("sucursalId", filters.sucursalId);
      const query = qs.toString();
      const path = query
        ? `${apiPaths.jornadas}/disponibles?${query}`
        : `${apiPaths.jornadas}/disponibles`;
      const res = await api.get<ApiResponse<JornadaDisponible[]>>(path, token);
      setJornadas(res.data ?? []);
    } catch {
      setJornadas([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterKey]);

  useEffect(() => {
    fetchJornadas();
  }, [fetchJornadas]);

  return { jornadas, loading, refetch: fetchJornadas };
}

export function useInventarioJornadaActiva(
  sucursalId?: string,
  options?: { enabled?: boolean },
) {
  const { token } = useAuth();
  const enabled = options?.enabled !== false;
  const [inventario, setInventario] = useState<Inventario | null>(null);
  const [jornada, setJornada] = useState<JornadaActivaValue | null>(null);
  const [movimientos, setMovimientos] = useState<InventarioMovimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovimientos = useCallback(
    async (inventarioId: string) => {
      if (!token) return [];
      const res = await api.get<ApiResponse<InventarioMovimiento[]>>(
        `${apiPaths.inventarios}/${inventarioId}/movimientos?limit=100`,
        token,
      );
      const data = res.data ?? [];
      setMovimientos(data);
      return data;
    },
    [token],
  );

  const getInventarioJornadaActiva = useCallback(async () => {
    if (!token || !enabled) {
      setInventario(null);
      setJornada(null);
      setMovimientos([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ includeProductos: "true" });
      if (sucursalId) qs.set("sucursalId", sucursalId);
      const res = await api.get<ApiResponse<InventarioJornadaActivaData>>(
        `${apiPaths.inventarios}/jornada-activa?${qs.toString()}`,
        token,
      );
      const payload = res.data;
      setInventario(payload?.inventario ?? null);
      setJornada(payload?.jornada ?? null);
      if (payload?.inventario?.id) {
        await fetchMovimientos(payload.inventario.id);
      } else {
        setMovimientos([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar inventario");
      setInventario(null);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, [token, enabled, sucursalId, fetchMovimientos]);

  const openInventarioJornadaActiva = useCallback(async () => {
    if (!token) throw new Error("Sin sesión");
    if (!sucursalId) throw new Error("Selecciona una sucursal");
    setError(null);
    const res = await api.post<ApiResponse<InventarioJornadaActivaData>>(
      `${apiPaths.inventarios}/jornada-activa`,
      { sucursalId },
      token,
    );
    const payload = res.data!;
    setInventario(payload.inventario ?? null);
    setJornada(payload.jornada ?? null);
    if (payload.inventario?.id) {
      await fetchMovimientos(payload.inventario.id);
    }
    return payload;
  }, [token, sucursalId, fetchMovimientos]);

  const upsertProducto = useCallback(
    async (
      productoId: string,
      data: Partial<InventarioProducto>,
    ) => {
      if (!token || !inventario?.id) throw new Error("Sin inventario activo");
      await api.put(
        `${apiPaths.inventarios}/${inventario.id}/productos/${productoId}`,
        data,
        token,
      );
      await getInventarioJornadaActiva();
    },
    [token, inventario?.id, getInventarioJornadaActiva],
  );

  useEffect(() => {
    getInventarioJornadaActiva();
  }, [getInventarioJornadaActiva]);

  return {
    inventario,
    jornada,
    movimientos,
    loading,
    error,
    refetch: getInventarioJornadaActiva,
    openInventarioJornadaActiva,
    upsertProducto,
  };
}

export function useInventarios(includeProductos = false) {
  const { token } = useAuth();
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventarios = useCallback(async () => {
    if (!token) {
      setInventarios([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const qs = includeProductos ? "?includeProductos=true" : "";
      const res = await api.get<ApiResponse<Inventario[]>>(
        `${apiPaths.inventarios}${qs}`,
        token,
      );
      setInventarios(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar inventarios");
      setInventarios([]);
    } finally {
      setLoading(false);
    }
  }, [token, includeProductos]);

  const getInventarioJornadaActiva = useCallback(async () => {
    if (!token) throw new Error("Sin sesión");
    const res = await api.get<ApiResponse<InventarioJornadaActivaData>>(
      `${apiPaths.inventarios}/jornada-activa?includeProductos=true`,
      token,
    );
    return res.data!;
  }, [token]);

  useEffect(() => {
    fetchInventarios();
  }, [fetchInventarios]);

  return {
    inventarios,
    loading,
    error,
    refetch: fetchInventarios,
    getInventarioJornadaActiva,
  };
}

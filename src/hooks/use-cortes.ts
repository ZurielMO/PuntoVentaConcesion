"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type {
  Corte,
  CorteResumen,
  ComprobanteVenta,
  DetalleProducto,
} from "@/lib/types";

export type CorteFilters = {
  concesionId?: string;
  sucursalId?: string;
};

function buildCorteQuery(filters?: CorteFilters): string {
  const qs = new URLSearchParams();
  if (filters?.concesionId) qs.set("concesionId", filters.concesionId);
  if (filters?.sucursalId) qs.set("sucursalId", filters.sucursalId);
  return qs.toString();
}

export function useCortes(filters?: CorteFilters) {
  const { token } = useAuth();
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = buildCorteQuery(filters);

  const fetchCortes = useCallback(async () => {
    if (!token) {
      setCortes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const path = query ? `${apiPaths.cortes}?${query}` : apiPaths.cortes;
      const res = await api.get<ApiResponse<Corte[]>>(path, token);
      setCortes(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cortes");
      setCortes([]);
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  const createCorte = useCallback(
    async (payload: {
      fecha: string;
      comentarios?: string;
      estatus: string;
      totalReal: number;
      totalCaja: number;
    }) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.post<ApiResponse<Corte>>(apiPaths.cortes, payload, token);
      await fetchCortes();
      return res.data!;
    },
    [token, fetchCortes],
  );

  useEffect(() => {
    fetchCortes();
  }, [fetchCortes]);

  return { cortes, loading, error, refetch: fetchCortes, createCorte };
}

export function useCorteResumen(filters?: CorteFilters) {
  const { token } = useAuth();
  const [resumen, setResumen] = useState<CorteResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = buildCorteQuery(filters);

  const fetchResumen = useCallback(async () => {
    if (!token) {
      setResumen(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const base = `${apiPaths.cortes}/resumen`;
      const path = query ? `${base}?${query}` : base;
      const res = await api.get<ApiResponse<CorteResumen>>(path, token);
      setResumen(res.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el resumen");
      setResumen(null);
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    fetchResumen();
  }, [fetchResumen]);

  return { resumen, loading, error, refetch: fetchResumen };
}

export function useDetalleVentas(filters?: {
  concesionId?: string;
  sucursalId?: string;
  cajaId?: string;
  inventarioId?: string;
}) {
  const { token } = useAuth();
  const [ventas, setVentas] = useState<ComprobanteVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filters ?? {});

  const fetchVentas = useCallback(async () => {
    if (!token) {
      setVentas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (filters?.concesionId) qs.set("concesionId", filters.concesionId);
      if (filters?.sucursalId) qs.set("sucursalId", filters.sucursalId);
      if (filters?.cajaId) qs.set("cajaId", filters.cajaId);
      if (filters?.inventarioId) qs.set("inventarioId", filters.inventarioId);
      const query = qs.toString();
      const path = query ? `${apiPaths.detalleVenta}?${query}` : apiPaths.detalleVenta;
      const res = await api.get<ApiResponse<ComprobanteVenta[]>>(path, token);
      setVentas(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ventas");
      setVentas([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterKey]);

  const createVenta = useCallback(
    async (params: {
      ventaId: string;
      concesionId: string;
      sucursalId: string;
      inventarioId: string;
      productos: DetalleProducto[];
    }) => {
      if (!token) throw new Error("Sin sesión");
      const path = `${apiPaths.detalleVenta}/ventas/${params.ventaId}/concesiones/${params.concesionId}/sucursales/${params.sucursalId}/inventarios/${params.inventarioId}`;
      const res = await api.post<ApiResponse<ComprobanteVenta>>(
        path,
        { productos: params.productos },
        token,
      );
      await fetchVentas();
      return res.data!;
    },
    [token, fetchVentas],
  );

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  return { ventas, loading, error, refetch: fetchVentas, createVenta };
}

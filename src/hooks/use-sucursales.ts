"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Sucursal } from "@/lib/types";

export type CreateSucursalPayload = {
  activo?: boolean;
  sucursal: { nombre?: string; cajas?: string[] };
};

export function useSucursales() {
  const { token } = useAuth();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSucursales = useCallback(async () => {
    if (!token) {
      setSucursales([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Sucursal[]>>(apiPaths.sucursales, token);
      setSucursales(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar sucursales");
      setSucursales([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createSucursal = useCallback(
    async (concesionId: string, zonaId: string, payload: CreateSucursalPayload) => {
      if (!token) throw new Error("Sin sesión");
      const qs = new URLSearchParams({
        concesion_id: concesionId,
        zona_id: zonaId,
      });
      const res = await api.post<ApiResponse<Sucursal>>(
        `${apiPaths.sucursales}?${qs.toString()}`,
        payload,
        token,
      );
      await fetchSucursales();
      return res.data!;
    },
    [token, fetchSucursales],
  );

  const updateSucursal = useCallback(
    async (id: string, payload: Partial<CreateSucursalPayload> & { zona_id?: string }) => {
      if (!token) throw new Error("Sin sesión");
      await api.put(`${apiPaths.sucursales}/${id}`, payload, token);
      await fetchSucursales();
    },
    [token, fetchSucursales],
  );

  const deleteSucursal = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.sucursales}/${id}`, token);
      await fetchSucursales();
    },
    [token, fetchSucursales],
  );

  useEffect(() => {
    fetchSucursales();
  }, [fetchSucursales]);

  return {
    sucursales,
    loading,
    error,
    refetch: fetchSucursales,
    createSucursal,
    updateSucursal,
    deleteSucursal,
  };
}

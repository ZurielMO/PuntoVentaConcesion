"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Zona } from "@/lib/types";

export type ZonaPayload = { zona: string; activo?: boolean };

export function useZonas() {
  const { token } = useAuth();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchZonas = useCallback(async () => {
    if (!token) {
      setZonas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Zona[]>>(apiPaths.zonas, token);
      setZonas(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar zonas");
      setZonas([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createZona = useCallback(
    async (payload: ZonaPayload) => {
      if (!token) throw new Error("Sin sesión");
      await api.post(apiPaths.zonas, payload, token);
      await fetchZonas();
    },
    [token, fetchZonas],
  );

  const updateZona = useCallback(
    async (id: string, payload: Partial<ZonaPayload>) => {
      if (!token) throw new Error("Sin sesión");
      await api.put(`${apiPaths.zonas}/${id}`, payload, token);
      await fetchZonas();
    },
    [token, fetchZonas],
  );

  const deleteZona = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.zonas}/${id}`, token);
      await fetchZonas();
    },
    [token, fetchZonas],
  );

  useEffect(() => {
    fetchZonas();
  }, [fetchZonas]);

  return { zonas, loading, error, refetch: fetchZonas, createZona, updateZona, deleteZona };
}

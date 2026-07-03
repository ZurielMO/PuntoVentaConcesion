"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Combo, ComboProducto } from "@/lib/types";

export type ComboPayload = {
  titulo: string;
  descripcion?: string | null;
  productos: ComboProducto[];
  precio: number;
  activo?: boolean;
};

export function useCombos(options?: {
  concesionId?: string;
  includeInactive?: boolean;
}) {
  const { token } = useAuth();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const concesionId = options?.concesionId;
  const includeInactive = options?.includeInactive === true;

  const fetchCombos = useCallback(async () => {
    if (!token) {
      setCombos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (concesionId) qs.set("concesionId", concesionId);
      if (includeInactive) qs.set("includeInactive", "true");
      const query = qs.toString();
      const res = await api.get<ApiResponse<Combo[]>>(
        query ? `${apiPaths.combos}?${query}` : apiPaths.combos,
        token,
      );
      setCombos(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar combos");
      setCombos([]);
    } finally {
      setLoading(false);
    }
  }, [token, concesionId, includeInactive]);

  const createCombo = useCallback(
    async (targetConcesionId: string, payload: ComboPayload) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.post<ApiResponse<Combo>>(
        apiPaths.combos,
        { concesionId: targetConcesionId, ...payload },
        token,
      );
      await fetchCombos();
      return res.data!;
    },
    [token, fetchCombos],
  );

  const updateCombo = useCallback(
    async (id: string, payload: Partial<ComboPayload>) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.put<ApiResponse<Combo>>(
        `${apiPaths.combos}/${id}`,
        payload,
        token,
      );
      await fetchCombos();
      return res.data!;
    },
    [token, fetchCombos],
  );

  const softDeleteCombo = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.combos}/${id}`, token);
      await fetchCombos();
    },
    [token, fetchCombos],
  );

  const hardDeleteCombo = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.combos}/${id}/hard`, token);
      await fetchCombos();
    },
    [token, fetchCombos],
  );

  useEffect(() => {
    fetchCombos();
  }, [fetchCombos]);

  return {
    combos,
    loading,
    error,
    refetch: fetchCombos,
    createCombo,
    updateCombo,
    softDeleteCombo,
    hardDeleteCombo,
  };
}

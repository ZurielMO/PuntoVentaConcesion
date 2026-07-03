"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/types";

export function useEquipoVendedores(
  concesionId?: string,
  options?: { enabled?: boolean },
) {
  const { token } = useAuth();
  const enabled = options?.enabled !== false;
  const [vendedores, setVendedores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendedores = useCallback(async () => {
    if (!token || !enabled) {
      setVendedores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = concesionId
        ? `?${new URLSearchParams({ concesionId }).toString()}`
        : "";
      const res = await api.get<ApiResponse<User[]>>(
        `${apiPaths.users}/equipo${qs}`,
        token,
      );
      setVendedores(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar equipo");
      setVendedores([]);
    } finally {
      setLoading(false);
    }
  }, [token, enabled, concesionId]);

  const assignVendedor = useCallback(
    async (userId: string, sucursalId: string, cajaId: string | null) => {
      if (!token) throw new Error("Sin sesión");
      await api.patch(
        `${apiPaths.users}/${userId}/asignacion`,
        { sucursalId, cajaId, ...(concesionId ? { concesionId } : {}) },
        token,
      );
      await fetchVendedores();
    },
    [token, concesionId, fetchVendedores],
  );

  useEffect(() => {
    fetchVendedores();
  }, [fetchVendedores]);

  return {
    vendedores,
    loading,
    error,
    refetch: fetchVendedores,
    assignVendedor,
  };
}

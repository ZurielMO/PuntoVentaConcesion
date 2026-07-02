"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/types";

export function useEquipoVendedores() {
  const { token } = useAuth();
  const [vendedores, setVendedores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendedores = useCallback(async () => {
    if (!token) {
      setVendedores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<User[]>>(`${apiPaths.users}/equipo`, token);
      setVendedores(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar equipo");
      setVendedores([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const assignVendedor = useCallback(
    async (userId: string, sucursalId: string, cajaId: string | null) => {
      if (!token) throw new Error("Sin sesión");
      await api.patch(
        `${apiPaths.users}/${userId}/asignacion`,
        { sucursalId, cajaId },
        token,
      );
      await fetchVendedores();
    },
    [token, fetchVendedores],
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

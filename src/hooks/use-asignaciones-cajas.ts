"use client";

import { useCallback, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { AsignacionCajaJornada, Caja } from "@/lib/types";

export function useAsignacionesCajas() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchAsignaciones = useCallback(
    async (jornadaId: string, sucursalId: string) => {
      if (!token) return [];
      const qs = new URLSearchParams({ sucursalId });
      const res = await api.get<ApiResponse<AsignacionCajaJornada[]>>(
        `${apiPaths.jornadas}/${encodeURIComponent(jornadaId)}/asignaciones-cajas?${qs}`,
        token,
      );
      return res.data ?? [];
    },
    [token],
  );

  const saveAsignaciones = useCallback(
    async (
      jornadaId: string,
      sucursalId: string,
      asignaciones: { cajaId: string; vendedorUid: string | null }[],
    ) => {
      if (!token) throw new Error("Sin sesión");
      setLoading(true);
      try {
        const res = await api.put<ApiResponse<AsignacionCajaJornada[]>>(
          `${apiPaths.jornadas}/${encodeURIComponent(jornadaId)}/asignaciones-cajas`,
          { sucursalId, asignaciones },
          token,
        );
        return res.data ?? [];
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const fetchMiCaja = useCallback(
    async (jornadaId: string, sucursalId: string): Promise<Caja | null> => {
      if (!token) return null;
      const qs = new URLSearchParams({ sucursalId });
      const res = await api.get<ApiResponse<{ cajaId: string; cajaNombre: string } | null>>(
        `${apiPaths.jornadas}/${encodeURIComponent(jornadaId)}/mi-caja?${qs}`,
        token,
      );
      const data = res.data;
      if (!data) return null;
      return { id: data.cajaId, nombre: data.cajaNombre, activo: true };
    },
    [token],
  );

  return { loading, fetchAsignaciones, saveAsignaciones, fetchMiCaja };
}

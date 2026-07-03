"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Descuento, DescuentoTipo } from "@/lib/types";

export type DescuentoPayload = {
  titulo: string;
  descripcion?: string | null;
  tipo: DescuentoTipo;
  valor?: number | null;
  producto_ids: string[];
  activo?: boolean;
};

export function useDescuentos(options?: {
  concesionId?: string;
  includeInactive?: boolean;
}) {
  const { token } = useAuth();
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const concesionId = options?.concesionId;
  const includeInactive = options?.includeInactive === true;

  const fetchDescuentos = useCallback(async () => {
    if (!token) {
      setDescuentos([]);
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
      const res = await api.get<ApiResponse<Descuento[]>>(
        query ? `${apiPaths.descuentos}?${query}` : apiPaths.descuentos,
        token,
      );
      setDescuentos(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar descuentos");
      setDescuentos([]);
    } finally {
      setLoading(false);
    }
  }, [token, concesionId, includeInactive]);

  const createDescuento = useCallback(
    async (targetConcesionId: string, payload: DescuentoPayload) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.post<ApiResponse<Descuento>>(
        apiPaths.descuentos,
        { concesionId: targetConcesionId, ...payload },
        token,
      );
      await fetchDescuentos();
      return res.data!;
    },
    [token, fetchDescuentos],
  );

  const updateDescuento = useCallback(
    async (id: string, payload: Partial<DescuentoPayload>) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.put<ApiResponse<Descuento>>(
        `${apiPaths.descuentos}/${id}`,
        payload,
        token,
      );
      await fetchDescuentos();
      return res.data!;
    },
    [token, fetchDescuentos],
  );

  const softDeleteDescuento = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.descuentos}/${id}`, token);
      await fetchDescuentos();
    },
    [token, fetchDescuentos],
  );

  const hardDeleteDescuento = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.descuentos}/${id}/hard`, token);
      await fetchDescuentos();
    },
    [token, fetchDescuentos],
  );

  useEffect(() => {
    fetchDescuentos();
  }, [fetchDescuentos]);

  return {
    descuentos,
    loading,
    error,
    refetch: fetchDescuentos,
    createDescuento,
    updateDescuento,
    softDeleteDescuento,
    hardDeleteDescuento,
  };
}

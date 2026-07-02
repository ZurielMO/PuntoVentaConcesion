"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Corte, ComprobanteVenta, DetalleProducto } from "@/lib/types";

export function useCortes() {
  const { token } = useAuth();
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCortes = useCallback(async () => {
    if (!token) {
      setCortes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Corte[]>>(apiPaths.cortes, token);
      setCortes(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cortes");
      setCortes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

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

export function useDetalleVentas() {
  const { token } = useAuth();
  const [ventas, setVentas] = useState<ComprobanteVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVentas = useCallback(async () => {
    if (!token) {
      setVentas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<ComprobanteVenta[]>>(
        apiPaths.detalleVenta,
        token,
      );
      setVentas(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ventas");
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

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

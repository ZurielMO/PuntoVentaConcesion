"use client";

import { useCallback, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";

export type ClubMember = {
  id: string;
  nombre: string;
  email: string;
  puntosActuales: number;
};

export type CinepolisAsignacion = {
  id: string;
  memberId: string;
  customerFullName: string;
  amountMxn: number;
  points: number;
  puntosActuales: number;
  comentario: string;
  folioVenta: string;
  cashierUid: string;
  cashierEmail: string;
  createdAt: string | null;
};

export type AssignCinepolisResult = {
  memberId: string;
  montoVenta: number;
  puntosAsignados: number;
  puntosActuales: number;
  descripcion: string;
  folioVenta: string;
  customerFullName: string;
  assignmentId: string;
};

type HistoryPagination = {
  nextCursor: string | null;
  hasMore: boolean;
};

export function useCinepolisPuntos() {
  const { token } = useAuth();
  const [asignaciones, setAsignaciones] = useState<CinepolisAsignacion[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupMember = useCallback(
    async (memberId: string): Promise<ClubMember> => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.get<ApiResponse<ClubMember>>(
        apiPaths.loyalty.member(memberId),
        token,
      );
      if (!res.data) throw new Error("Socio no encontrado");
      return res.data;
    },
    [token],
  );

  const assignPoints = useCallback(
    async (params: {
      memberId: string;
      dinero: number;
      comentario?: string;
    }): Promise<AssignCinepolisResult> => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.post<ApiResponse<AssignCinepolisResult>>(
        apiPaths.loyalty.cinepolisAsignar,
        params,
        token,
      );
      if (!res.data) throw new Error("No se pudieron asignar los puntos");
      return res.data;
    },
    [token],
  );

  const fetchAsignaciones = useCallback(
    async (cursor?: string) => {
      if (!token) {
        setAsignaciones([]);
        setLoading(false);
        return;
      }
      const appending = Boolean(cursor);
      if (appending) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }
      try {
        const qs = new URLSearchParams({ limit: "20" });
        if (cursor) qs.set("cursor", cursor);
        const res = await api.get<
          ApiResponse<CinepolisAsignacion[]> & { pagination?: HistoryPagination }
        >(
          `${apiPaths.loyalty.cinepolisAsignaciones}?${qs.toString()}`,
          token,
        );
        const items = res.data ?? [];
        setAsignaciones((prev) => (appending ? [...prev, ...items] : items));
        setNextCursor(res.pagination?.nextCursor ?? null);
        setHasMore(Boolean(res.pagination?.hasMore));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el historial",
        );
        if (!appending) setAsignaciones([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token],
  );

  return {
    asignaciones,
    nextCursor,
    hasMore,
    loading,
    loadingMore,
    error,
    lookupMember,
    assignPoints,
    fetchAsignaciones,
  };
}

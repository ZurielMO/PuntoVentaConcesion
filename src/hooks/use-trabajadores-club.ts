"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { TrabajadorClub, TrabajadorClubPreview } from "@/lib/types";

export function useTrabajadoresClub() {
  const { token } = useAuth();
  const [trabajadores, setTrabajadores] = useState<TrabajadorClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<TrabajadorClubPreview | null>(
    null,
  );
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchTrabajadores = useCallback(async () => {
    if (!token) {
      setTrabajadores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<TrabajadorClub[]>>(
        apiPaths.trabajadoresClub,
        token,
      );
      setTrabajadores(res.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar trabajadores",
      );
      setTrabajadores([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const searchByEmail = useCallback(
    async (email: string) => {
      if (!token) throw new Error("Sin sesión");
      setSearching(true);
      setSearchError(null);
      setSearchResult(null);
      try {
        const qs = new URLSearchParams({ email: email.trim() });
        const res = await api.get<ApiResponse<TrabajadorClubPreview>>(
          `${apiPaths.trabajadoresClub}/search?${qs.toString()}`,
          token,
        );
        setSearchResult(res.data ?? null);
        return res.data!;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al buscar usuario";
        setSearchError(message);
        throw err;
      } finally {
        setSearching(false);
      }
    },
    [token],
  );

  const addTrabajador = useCallback(
    async (uid: string) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.post<ApiResponse<TrabajadorClub>>(
        apiPaths.trabajadoresClub,
        { uid },
        token,
      );
      setSearchResult(null);
      await fetchTrabajadores();
      return res.data!;
    },
    [token, fetchTrabajadores],
  );

  const updateCortesiaCanjeada = useCallback(
    async (uid: string, cortesiaCanjeada: boolean) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.patch<ApiResponse<TrabajadorClub>>(
        `${apiPaths.trabajadoresClub}/${uid}`,
        { cortesiaCanjeada },
        token,
      );
      await fetchTrabajadores();
      return res.data!;
    },
    [token, fetchTrabajadores],
  );

  const removeTrabajador = useCallback(
    async (uid: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.trabajadoresClub}/${uid}`, token);
      await fetchTrabajadores();
    },
    [token, fetchTrabajadores],
  );

  useEffect(() => {
    void fetchTrabajadores();
  }, [fetchTrabajadores]);

  return {
    trabajadores,
    loading,
    error,
    refetch: fetchTrabajadores,
    searchResult,
    searching,
    searchError,
    searchByEmail,
    addTrabajador,
    updateCortesiaCanjeada,
    removeTrabajador,
    clearSearch: () => {
      setSearchResult(null);
      setSearchError(null);
    },
  };
}

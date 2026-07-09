"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Concession } from "@/lib/types";
import { MAX_IMAGE_BYTES } from "@/lib/constants";

export type ConcessionPayload = {
  nombre: string;
  activo?: boolean;
  imagenes?: string[];
  porcentajeComision?: number;
};

export function useConcessions() {
  const { token } = useAuth();
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConcessions = useCallback(async () => {
    if (!token) {
      setConcessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Concession[]>>(apiPaths.concessions, token);
      setConcessions(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar concesiones");
      setConcessions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createConcession = useCallback(
    async (payload: ConcessionPayload) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.post<ApiResponse<Concession>>(
        apiPaths.concessions,
        payload,
        token,
      );
      await fetchConcessions();
      return res.data!;
    },
    [token, fetchConcessions],
  );

  const updateConcession = useCallback(
    async (id: string, payload: ConcessionPayload) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.put<ApiResponse<Concession>>(
        `${apiPaths.concessions}/${id}`,
        payload,
        token,
      );
      await fetchConcessions();
      return res.data!;
    },
    [token, fetchConcessions],
  );

  const deleteConcession = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.concessions}/${id}`, token);
      await fetchConcessions();
    },
    [token, fetchConcessions],
  );

  const assignUser = useCallback(
    async (concessionId: string, userId: string) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.put<ApiResponse<Concession>>(
        `${apiPaths.concessions}/${concessionId}/assign-user`,
        { userId },
        token,
      );
      await fetchConcessions();
      return res.data!;
    },
    [token, fetchConcessions],
  );

  const uploadConcessionImages = useCallback(
    async (id: string, files: File[]) => {
      if (!token) throw new Error("Sin sesión");
      for (const file of files) {
        if (file.size > MAX_IMAGE_BYTES) {
          throw new Error(`"${file.name}" supera el límite de 5 MB`);
        }
      }
      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      const res = await api.postFormData<ApiResponse<Concession>>(
        `${apiPaths.concessions}/${id}/images`,
        form,
        token,
      );
      await fetchConcessions();
      return res.data!;
    },
    [token, fetchConcessions],
  );

  const deleteConcessionImage = useCallback(
    async (id: string, index: number) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.delete<ApiResponse<Concession>>(
        `${apiPaths.concessions}/${id}/images/${index}`,
        token,
      );
      await fetchConcessions();
      return res.data!;
    },
    [token, fetchConcessions],
  );

  const updateConcessionComision = useCallback(
    async (id: string, porcentajeComision: number) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.patch<ApiResponse<Concession>>(
        `${apiPaths.concessions}/${id}/comision`,
        { porcentajeComision },
        token,
      );
      await fetchConcessions();
      return res.data!;
    },
    [token, fetchConcessions],
  );

  useEffect(() => {
    fetchConcessions();
  }, [fetchConcessions]);

  return {
    concessions,
    loading,
    error,
    refetch: fetchConcessions,
    createConcession,
    updateConcession,
    deleteConcession,
    assignUser,
    uploadConcessionImages,
    deleteConcessionImage,
    updateConcessionComision,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { User, UserRole } from "@/lib/types";

export type CreateUserPayload = {
  nombre: string;
  email: string;
  password: string;
  fecha_nacimiento?: string;
  rol: UserRole | string;
  concesionId: string;
  sucursalId?: string;
  cajaId?: string | null;
  activo?: boolean;
};

export type UpdateUserPayload = {
  nombre?: string;
  email?: string;
  password?: string;
  fecha_nacimiento?: string;
  rol?: UserRole | string;
  concesionId?: string | null;
  sucursalId?: string | null;
  cajaId?: string | null;
  activo?: boolean;
};

export function useUsers(concesionId?: string, options?: { enabled?: boolean }) {
  const { token } = useAuth();
  const enabled = options?.enabled !== false;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token || !enabled) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = concesionId
        ? `?concesionId=${encodeURIComponent(concesionId)}`
        : "";
      const res = await api.get<ApiResponse<User[]>>(
        `${apiPaths.users}${qs}`,
        token,
      );
      const data = res.data ?? [];
      // Si hay filtro, solo conservar usuarios de esa concesión.
      setUsers(
        concesionId
          ? data.filter((u) => u.concesionId === concesionId)
          : data,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, concesionId, enabled]);

  const createUser = useCallback(
    async (payload: CreateUserPayload) => {
      if (!token) throw new Error("Sin sesión");
      await api.post(apiPaths.users, payload, token);
      await fetchUsers();
    },
    [token, fetchUsers],
  );

  const updateUser = useCallback(
    async (id: string, payload: UpdateUserPayload) => {
      if (!token) throw new Error("Sin sesión");
      const body: UpdateUserPayload = { ...payload };
      if (typeof body.password === "string") {
        const trimmed = body.password.trim();
        if (!trimmed) {
          delete body.password;
        } else {
          body.password = trimmed;
        }
      }
      await api.put(`${apiPaths.users}/${id}`, body, token);
      await fetchUsers();
    },
    [token, fetchUsers],
  );

  const deleteUser = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.users}/${id}`, token);
      await fetchUsers();
    },
    [token, fetchUsers],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}

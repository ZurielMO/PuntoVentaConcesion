"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { User, UserRole } from "@/lib/types";

export type CreateUserPayload = {
  nombre: string;
  email: string;
  password: string;
  fecha_nacimiento: string;
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

export function useUsers(concesionId?: string) {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) {
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
      setUsers(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, concesionId]);

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
      await api.put(`${apiPaths.users}/${id}`, payload, token);
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

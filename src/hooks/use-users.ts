"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/types";
import { UserRole } from "@/lib/types";

export type CreateUserPayload = {
  nombre: string;
  fecha_nacimiento: string;
  email: string;
  password: string;
  rol: UserRole.ADMIN | UserRole.VENDEDOR | "EMPLEADO";
  activo?: boolean;
  concesionId: string;
  sucursalId?: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
  password?: string;
};

export function useUsers(concesionFilter?: string) {
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
      const path = concesionFilter
        ? `${apiPaths.users}?concesionId=${encodeURIComponent(concesionFilter)}`
        : apiPaths.users;
      const res = await api.get<ApiResponse<User[]>>(path, token);
      setUsers(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, concesionFilter]);

  const createUser = useCallback(
    async (payload: CreateUserPayload) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.post<ApiResponse<User>>(apiPaths.users, payload, token);
      await fetchUsers();
      return res.data!;
    },
    [token, fetchUsers],
  );

  const updateUser = useCallback(
    async (id: string, payload: UpdateUserPayload) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.put<ApiResponse<User>>(
        `${apiPaths.users}/${id}`,
        payload,
        token,
      );
      await fetchUsers();
      return res.data!;
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

  return { users, loading, error, refetch: fetchUsers, createUser, updateUser, deleteUser };
}

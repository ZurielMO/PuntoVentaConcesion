"use client";

import { useMemo } from "react";
import { useAuth } from "./use-auth";
import { getPermissions, type PermissionFlags } from "@/lib/permissions";

export function usePermissions(): PermissionFlags & { loading: boolean } {
  const { posUser, loading } = useAuth();

  const permissions = useMemo(() => getPermissions(posUser), [posUser]);

  return { ...permissions, loading };
}

"use client";

import { useMemo } from "react";
import {
  computeConcesionSetupStatus,
  type ConcesionSetupStatus,
} from "@/lib/concesion-setup";
import { useConcessions } from "@/hooks/use-concessions";
import { useUsers } from "@/hooks/use-users";
import { useProducts } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { useEquipoVendedores } from "@/hooks/use-equipo";

export function useConcesionSetup(concesionId?: string | null) {
  const { concessions, loading: loadingCon } = useConcessions();
  const { users, loading: loadingUsers } = useUsers(concesionId ?? undefined);
  const { products, loading: loadingProducts } = useProducts();
  const { sucursales, loading: loadingSuc } = useSucursales();
  const { vendedores, loading: loadingEquipo } = useEquipoVendedores(
    concesionId ?? undefined,
    { enabled: Boolean(concesionId) },
  );

  const concession = useMemo(
    () => concessions.find((c) => c.id === concesionId) ?? null,
    [concessions, concesionId],
  );

  const status: ConcesionSetupStatus | null = useMemo(() => {
    if (!concesionId) return null;
    return computeConcesionSetupStatus({
      concesionId,
      concession,
      users,
      products,
      sucursales,
      vendedores,
    });
  }, [
    concesionId,
    concession,
    users,
    products,
    sucursales,
    vendedores,
  ]);

  const loading =
    loadingCon ||
    loadingUsers ||
    loadingProducts ||
    loadingSuc ||
    (Boolean(concesionId) && loadingEquipo);

  return {
    concession,
    status,
    loading,
    concessions,
    users,
    products,
    sucursales,
    vendedores,
  };
}

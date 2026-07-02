"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";

type RequireRoleProps = {
  children: ReactNode;
  roles?: UserRole[];
  superAdminOnly?: boolean;
  adminOrAbove?: boolean;
  authenticated?: boolean;
};

export function RequireRole({
  children,
  roles,
  superAdminOnly = false,
  adminOrAbove = false,
  authenticated = true,
}: RequireRoleProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const perms = usePermissions();

  const allowed = (() => {
    if (superAdminOnly) return perms.isSuperAdmin;
    if (adminOrAbove) return perms.isSuperAdmin || perms.isAdmin;
    if (roles?.length) {
      return roles.some((r) => perms.role === r);
    }
    if (authenticated) return Boolean(user);
    return true;
  })();

  useEffect(() => {
    if (authLoading || perms.loading) return;
    if (!user && authenticated) {
      router.replace("/login");
      return;
    }
    if (user && !allowed) {
      router.replace("/");
    }
  }, [allowed, authLoading, authenticated, perms.loading, router, user]);

  if (authLoading || perms.loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[1.6rem] text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!user && authenticated) {
    return (
      <div className="mx-auto max-w-lg px-[var(--outer-gutter)] py-[var(--space-6)] text-center">
        <h1>Acceso restringido</h1>
        <p className="mt-4 text-[1.6rem] text-muted-foreground">
          Inicia sesión para continuar.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg px-[var(--outer-gutter)] py-[var(--space-6)] text-center">
        <h1>Sin permisos</h1>
        <p className="mt-4 text-[1.6rem] text-muted-foreground">
          No tienes acceso a esta sección.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

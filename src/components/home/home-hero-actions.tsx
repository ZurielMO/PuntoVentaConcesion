"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { getDefaultRouteForRole } from "@/lib/permissions";

export function HomeHeroActions() {
  const { user, posUser, loading } = useAuth();
  const perms = usePermissions();

  if (loading) {
    return (
      <div className="flex flex-wrap gap-4">
        <Button size="lg" disabled>
          Cargando…
        </Button>
      </div>
    );
  }

  if (user && posUser && (perms.isSuperAdmin || perms.isAdmin)) {
    const dashboardHref = getDefaultRouteForRole(posUser);
    return (
      <div className="flex flex-wrap gap-4">
        <Button asChild size="lg">
          <Link href={dashboardHref}>Ir al panel</Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/products">Ver productos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      <Button asChild size="lg">
        <Link href="/login">Acceder al panel</Link>
      </Button>
      <Button variant="outline" asChild size="lg">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
    </div>
  );
}

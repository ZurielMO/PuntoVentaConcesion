"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isCinepolisCashier } from "@/lib/cinepolis";
import { getDefaultRouteForRole } from "@/lib/permissions";

function sessionEmail(
  user: { email?: string } | null,
  posUser: { email?: string } | null,
): string | undefined {
  return user?.email ?? posUser?.email;
}

/** En rutas POS: el cajero Cinépolis no debe ver el dashboard de concesiones. */
export function RedirectCinepolisCashier({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { user, posUser, loading } = useAuth();
  const cinepolis = isCinepolisCashier(sessionEmail(user, posUser));

  useEffect(() => {
    if (loading) return;
    if (cinepolis) router.replace("/cinepolis");
  }, [cinepolis, loading, router]);

  if (loading || cinepolis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--dashboard-bg)]">
        <p className="text-[1.6rem] text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return <>{children}</>;
}

/** En /cinepolis: solo el cajero Cinépolis autenticado. */
export function RequireCinepolisCashier({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { user, posUser, loading } = useAuth();
  const email = sessionEmail(user, posUser);
  const cinepolis = isCinepolisCashier(email);

  useEffect(() => {
    if (loading) return;
    if (!user && !posUser) {
      router.replace("/login");
      return;
    }
    if (!cinepolis) {
      router.replace(getDefaultRouteForRole(posUser));
    }
  }, [cinepolis, loading, posUser, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[1.6rem] text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  if (!cinepolis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[1.6rem] text-[var(--text-secondary)]">Redirigiendo…</p>
      </div>
    );
  }

  return <>{children}</>;
}

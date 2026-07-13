"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useNavigationLock } from "@/hooks/use-navigation-lock";
import { usePermissions } from "@/hooks/use-permissions";
import { filterNavGroups, getDashboardNav } from "@/lib/nav-config";
import { AppSidebarNav } from "./app-sidebar-nav";

export function AppSidebar() {
  const perms = usePermissions();
  const { isLocked } = useNavigationLock();
  const groups = useMemo(
    () => filterNavGroups(getDashboardNav(perms), perms),
    [perms],
  );

  return (
    <aside
      className="hidden w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border bg-[var(--sidebar-bg)] md:flex"
      style={{ width: "var(--sidebar-width)" }}
      aria-busy={isLocked || undefined}
    >
      <div className="flex h-[var(--topbar-height)] items-center border-b border-border px-5">
        <Link
          href="/"
          tabIndex={isLocked ? -1 : undefined}
          aria-disabled={isLocked || undefined}
          onClick={(e) => {
            if (isLocked) e.preventDefault();
          }}
          className="text-[1.8rem] font-bold tracking-tight text-green-dark"
        >
          PuntoVenta
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <AppSidebarNav groups={groups} />
      </div>
      <div className="border-t border-border p-4">
        <p className="text-[1.2rem] text-muted-foreground">Concesiones Estadio</p>
      </div>
    </aside>
  );
}

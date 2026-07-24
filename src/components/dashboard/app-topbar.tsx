"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Menu } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigationLock } from "@/hooks/use-navigation-lock";
import { usePermissions } from "@/hooks/use-permissions";
import { filterNavGroups, getDashboardNav } from "@/lib/nav-config";
import { AppSidebarNav } from "./app-sidebar-nav";

function getInitials(name?: string | null, email?: string | null) {
  const source = name ?? email ?? "U";
  return source
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/superAdmin/concesiones/") && pathname !== "/superAdmin/concesiones/nueva") {
    return "Centro de concesión";
  }
  const map: Record<string, string> = {
    "/superAdmin/dashboard": "Dashboard",
    "/admin/dashboard": "Dashboard",
    "/superAdmin/concesiones": "Concesiones",
    "/superAdmin/concesiones/nueva": "Asistente de alta",
    "/superAdmin/usuarios": "Usuarios",
    "/superAdmin/zonas": "Zonas",
    "/products": "Productos",
    "/sucursales": "Sucursales",
    "/inventarios": "Inventario",
    "/ventas": "Ventas",
    "/cortes": "Cortes y reportes",
    "/tickets": "Tickets",
  };
  return map[pathname] ?? "Panel";
}

export function AppTopbar() {
  const pathname = usePathname();
  const { posUser, user, logout } = useAuth();
  const { isLocked } = useNavigationLock();
  const perms = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups = useMemo(
    () => filterNavGroups(getDashboardNav(perms), perms),
    [perms],
  );

  const displayName = posUser?.nombre ?? user?.email ?? "Usuario";
  const roleLabels: Record<string, string> = {
    SUPERADMIN: "Superadmin",
    ADMIN: "Administrador",
    ADMIN_CERVECERIA: "Admin Cervecería",
    VENDEDOR: "Vendedor",
  };
  const roleLabel = perms.role ? roleLabels[perms.role] ?? perms.role : "Usuario";

  return (
    <header
      className="sticky top-0 z-30 flex h-[var(--topbar-height)] items-center justify-between border-b border-border bg-white px-4 md:px-6"
      style={{ height: "var(--topbar-height)" }}
    >
      <div className="flex items-center gap-3">
        <Sheet
          open={isLocked ? false : mobileOpen}
          onOpenChange={(open) => {
            if (isLocked) return;
            setMobileOpen(open);
          }}
        >
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              disabled={isLocked}
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[var(--sidebar-width)] p-0">
            <div className="border-b px-4 py-4">
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
            <AppSidebarNav groups={navGroups} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="hidden items-center gap-1 text-[1.3rem] text-muted-foreground md:flex">
          <span>Panel</span>
          <ChevronRight className="size-4" />
          <span className="font-semibold text-green-dark">
            {getPageTitle(pathname)}
          </span>
        </div>
        <p className="text-[1.6rem] font-semibold text-green-dark md:hidden">
          {getPageTitle(pathname)}
        </p>
      </div>

      <div className="flex items-center gap-3">

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-neutral-cool"
          >
            <div className="hidden text-right sm:block">
              <p className="text-[1.3rem] font-medium">{displayName}</p>
              <p className="text-[1.1rem] text-muted-foreground">{roleLabel}</p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback className="bg-green-soft text-green-accent">
                {getInitials(
                  typeof posUser?.nombre === "string" ? posUser.nombre : null,
                  user?.email,
                )}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[28rem] max-w-[calc(100vw-2rem)] rounded-xl border-border bg-white p-2 shadow-lg"
        >
          <DropdownMenuLabel className="px-3 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarFallback className="bg-green-soft text-[1.4rem] text-green-accent">
                  {getInitials(
                    typeof posUser?.nombre === "string" ? posUser.nombre : null,
                    user?.email,
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-[1.5rem] font-semibold text-foreground">
                  {displayName}
                </p>
                {user?.email && (
                  <p className="truncate text-[1.2rem] font-normal text-muted-foreground">
                    {user.email}
                  </p>
                )}
                <p className="text-[1.1rem] font-semibold uppercase tracking-wide text-green-accent">
                  {roleLabel}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout()}
            variant="destructive"
            className="cursor-pointer gap-3 rounded-lg px-3 py-3 text-[1.4rem] font-medium"
          >
            <LogOut className="!size-5" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}

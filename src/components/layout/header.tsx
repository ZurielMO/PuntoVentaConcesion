"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

export function Header() {
  const pathname = usePathname();
  const { user, posUser, logout, loading } = useAuth();
  const perms = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = useMemo((): NavLink[] => {
    if (perms.isSuperAdmin) {
      return [
        { href: "/superAdmin/concesiones", label: "Concesiones" },
        { href: "/superAdmin/usuarios", label: "Usuarios" },
        { href: "/superAdmin/zonas", label: "Zonas" },
      ];
    }

    const links: NavLink[] = [];
    if (perms.canViewProducts) links.push({ href: "/products", label: "Productos" });
    if (perms.canManageSucursales) links.push({ href: "/sucursales", label: "Sucursales" });
    if (perms.canViewInventario) links.push({ href: "/inventarios", label: "Inventario" });
    if (perms.canManageVentas) links.push({ href: "/ventas", label: "Ventas" });
    if (perms.canManageCortes) links.push({ href: "/cortes", label: "Cortes" });
    if (perms.canManageVentas) links.push({ href: "/tickets", label: "Tickets" });
    return links;
  }, [perms]);

  const roleLabel = perms.role ?? "Usuario";

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-[var(--nav-shadow)]">
      <div className="mx-auto flex h-16 items-center justify-between px-[var(--outer-gutter)] md:h-[83px] lg:h-[99px] lg:px-[var(--outer-gutter-lg)]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[2rem] font-semibold tracking-[-0.016px] text-starbucks-green md:text-[2.4rem]">
            PuntoVenta
          </span>
          <span className="hidden text-[1.3rem] text-muted-foreground sm:inline">
            Concesiones Estadio
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[1.6rem] font-medium transition-colors hover:text-green-accent",
                pathname === link.href
                  ? "text-green-accent"
                  : "text-[var(--text-black)]",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!loading && user ? (
            <>
              <span className="max-w-[200px] truncate text-[1.4rem] text-muted-foreground">
                {posUser?.nombre ?? user.email}
                <span className="ml-2 rounded bg-neutral-warm px-2 py-0.5 text-[1.2rem]">
                  {roleLabel}
                </span>
              </span>
              <Button variant="dark-outline" size="sm" onClick={() => logout()}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button variant="dark-outline" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button variant="dark" size="sm" asChild>
                <Link href="/login">Acceder al POS</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-[var(--outer-gutter)] py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[1.6rem] font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!loading && !user && (
              <Button asChild className="w-full">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Iniciar sesión
                </Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

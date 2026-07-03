"use client";

import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ALL_MODULES = [
  {
    title: "Panel SuperAdmin",
    description: "Vista general de la plataforma.",
    href: "/superAdmin/dashboard",
    key: "canAccessSuperAdmin" as const,
  },
  {
    title: "Panel Admin",
    description: "KPIs y operación de tu concesión.",
    href: "/admin/dashboard",
    key: "isAdmin" as const,
  },
  {
    title: "Productos",
    description: "Catálogo por concesión.",
    href: "/products",
    key: "canViewProducts" as const,
  },
  {
    title: "Sucursales",
    description: "Puntos de venta en zonas del estadio.",
    href: "/sucursales",
    key: "canViewSucursales" as const,
  },
  {
    title: "Inventario",
    description: "Existencias por jornada y sucursal.",
    href: "/inventarios",
    key: "canViewInventario" as const,
  },
  {
    title: "Combos",
    description: "Combos de productos por concesión.",
    href: "/superAdmin/combos",
    key: "canManageCombos" as const,
  },
  {
    title: "Descuentos",
    description: "Promociones 2×1 y descuentos por concesión.",
    href: "/superAdmin/descuentos",
    key: "canManageDescuentos" as const,
  },
  {
    title: "Concesiones",
    description: "Gestión global de concesiones.",
    href: "/superAdmin/concesiones",
    key: "canManageConcessions" as const,
  },
  {
    title: "Usuarios",
    description: "Alta de administradores y vendedores.",
    href: "/superAdmin/usuarios",
    key: "canManageUsers" as const,
  },
  {
    title: "Zonas",
    description: "Zonas del estadio para sucursales.",
    href: "/superAdmin/zonas",
    key: "canManageZonas" as const,
  },
];

export function HomeModules() {
  const perms = usePermissions();

  const visible = ALL_MODULES.filter((mod) => {
    if (mod.key === "isAdmin") return perms.isAdmin;
    return perms[mod.key];
  });

  if (visible.length === 0) {
    return (
      <p className="text-center text-[1.6rem] text-muted-foreground">
        Inicia sesión para ver los módulos disponibles según tu rol.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((mod) => (
        <Card key={mod.href}>
          <CardHeader>
            <CardTitle className="text-[1.8rem]">{mod.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[1.4rem] text-muted-foreground">{mod.description}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={mod.href}>Abrir</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

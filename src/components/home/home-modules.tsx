"use client";

import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ALL_MODULES = [
  { title: "Productos", description: "Catálogo por concesión.", href: "/products", key: "canViewProducts" as const },
  { title: "Sucursales", description: "Puntos de venta en zonas del estadio.", href: "/sucursales", key: "canManageSucursales" as const },
  { title: "Inventario", description: "Existencias por jornada y sucursal.", href: "/inventarios", key: "canViewInventario" as const },
  { title: "Ventas", description: "Comprobantes de venta en caja.", href: "/ventas", key: "canManageVentas" as const },
  { title: "Tickets", description: "Registro de tickets de venta.", href: "/tickets", key: "canManageVentas" as const },
  { title: "Cortes", description: "Cierre de caja al final de jornada.", href: "/cortes", key: "canManageCortes" as const },
  { title: "Concesiones", description: "Gestión global de concesiones.", href: "/superAdmin/concesiones", key: "canManageConcessions" as const },
  { title: "Usuarios", description: "Alta de administradores y vendedores.", href: "/superAdmin/usuarios", key: "canManageUsers" as const },
  { title: "Zonas", description: "Zonas del estadio para sucursales.", href: "/superAdmin/zonas", key: "canManageZonas" as const },
];

export function HomeModules() {
  const perms = usePermissions();

  const visible = ALL_MODULES.filter((mod) => perms[mod.key]);

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

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  ClipboardList,
  Eye,
  MapPin,
  Package,
  ShoppingCart,
  Store,
  Users,
  Warehouse,
} from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { DashboardBanner } from "@/components/dashboard/dashboard-banner";
import { DataTable } from "@/components/dashboard/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { VentaDetalleDialog } from "@/components/dashboard/venta-detalle-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useConcessions } from "@/hooks/use-concessions";
import { useCortes, useDetalleVentas } from "@/hooks/use-cortes";
import { useProducts } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { useUsers } from "@/hooks/use-users";
import { useZonas } from "@/hooks/use-zonas";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { ComprobanteVenta, Concession } from "@/lib/types";

export default function SuperAdminDashboardPage() {
  const { posUser } = useAuth();
  const { concessions, loading: loadingCon } = useConcessions();
  const { users, loading: loadingUsers } = useUsers();
  const { zonas, loading: loadingZonas } = useZonas();
  const { sucursales, loading: loadingSuc } = useSucursales();
  const { products, loading: loadingProducts } = useProducts();
  const { ventas, loading: loadingVentas } = useDetalleVentas();
  const { cortes, loading: loadingCortes } = useCortes();
  const [detalleVenta, setDetalleVenta] = useState<ComprobanteVenta | null>(null);

  const activeConcessions = concessions.filter((c) => c.activo !== false);
  const activeUsers = users.filter((u) => u.activo !== false);
  const totalCajas = sucursales.reduce(
    (acc, s) => acc + (s.cajas?.filter((c) => c.activo !== false).length ?? 0),
    0,
  );

  const ventasTotal = useMemo(
    () => ventas.reduce((acc, v) => acc + Number(v.total ?? 0), 0),
    [ventas],
  );

  const concesionNombre = (id?: string | null) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  const sucursalNombre = (id?: string | null) =>
    sucursales.find((s) => s.id === id)?.nombre ?? id ?? "—";

  const productoNombre = (id: string) =>
    products.find((p) => p.id === id)?.nombre ?? id;

  return (
    <RequireRole superAdminOnly>
      <div className="space-y-6">
        <DashboardBanner
          title={`Hola, ${posUser?.nombre ?? "SuperAdmin"}`}
          subtitle="Panel de plataforma — gestiona concesiones, usuarios y zonas, y consulta reportes operativos."
          action={
            <Button asChild variant="on-dark" size="sm">
              <Link href="/superAdmin/concesiones">Nueva concesión</Link>
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Concesiones activas"
            value={loadingCon ? "—" : activeConcessions.length}
            icon={Building2}
          />
          <StatCard
            label="Usuarios"
            value={loadingUsers ? "—" : activeUsers.length}
            icon={Users}
          />
          <StatCard
            label="Zonas"
            value={loadingZonas ? "—" : zonas.length}
            icon={MapPin}
          />
          <StatCard
            label="Sucursales / cajas"
            value={loadingSuc ? "—" : `${sucursales.length} / ${totalCajas}`}
            icon={Store}
            hint="Puntos de venta registrados"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Productos"
            value={loadingProducts ? "—" : products.length}
            icon={Package}
          />
          <StatCard
            label="Ventas registradas"
            value={loadingVentas ? "—" : ventas.length}
            icon={ShoppingCart}
            hint={loadingVentas ? undefined : formatPrice(ventasTotal)}
          />
          <StatCard
            label="Cortes"
            value={loadingCortes ? "—" : cortes.length}
            icon={ClipboardList}
          />
          <StatCard
            label="Inventarios"
            value="Ver reporte"
            icon={Warehouse}
            hint="Consulta por concesión"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[1.8rem] font-semibold text-green-dark">
                Concesiones recientes
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/superAdmin/concesiones">Ver todas</Link>
              </Button>
            </div>
            <DataTable<Concession>
              loading={loadingCon}
              data={activeConcessions.slice(0, 6)}
              getRowKey={(r) => r.id}
              emptyMessage="No hay concesiones registradas"
              columns={[
                {
                  key: "nombre",
                  header: "Nombre",
                  cell: (r) => (
                    <span className="font-medium">{r.nombre}</span>
                  ),
                },
                {
                  key: "activo",
                  header: "Estado",
                  cell: (r) => (
                    <Badge variant={r.activo ? "default" : "secondary"}>
                      {r.activo ? "Activa" : "Inactiva"}
                    </Badge>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[1.8rem] font-semibold text-green-dark">
                Ventas recientes
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/ventas">Ver reporte</Link>
              </Button>
            </div>
            <DataTable<ComprobanteVenta>
              loading={loadingVentas}
              data={ventas.slice(0, 6)}
              getRowKey={(r) => r.id}
              emptyMessage="Sin ventas registradas"
              columns={[
                {
                  key: "fecha",
                  header: "Fecha",
                  cell: (r) => formatDateTime(r.fecha ?? r.createdAt),
                },
                {
                  key: "concesion",
                  header: "Concesión",
                  cell: (r) => concesionNombre(r.concesionId),
                },
                {
                  key: "caja",
                  header: "Caja",
                  cell: (r) => r.cajaNombre ?? "—",
                },
                {
                  key: "total",
                  header: "Total",
                  cell: (r) => formatPrice(Number(r.total)),
                },
                {
                  key: "detalle",
                  header: "",
                  cell: (r) => (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDetalleVenta(r)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <VentaDetalleDialog
          venta={detalleVenta}
          open={Boolean(detalleVenta)}
          onOpenChange={(open) => !open && setDetalleVenta(null)}
          productoNombre={productoNombre}
          sucursalNombre={
            detalleVenta ? sucursalNombre(detalleVenta.sucursalId) : undefined
          }
          concesionNombre={
            detalleVenta ? concesionNombre(detalleVenta.concesionId) : undefined
          }
        />
      </div>
    </RequireRole>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Package, Store, TrendingUp, Users } from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { DashboardBanner } from "@/components/dashboard/dashboard-banner";
import { DataTable } from "@/components/dashboard/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { VentaDetalleDialog } from "@/components/dashboard/venta-detalle-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useDetalleVentas } from "@/hooks/use-cortes";
import { useEquipoVendedores } from "@/hooks/use-equipo";
import { useJornadas } from "@/hooks/use-inventarios";
import { useProducts } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { formatPrice } from "@/lib/format";
import { buildJornadaId } from "@/lib/jornada";
import type { ComprobanteVenta } from "@/lib/types";

export default function AdminDashboardPage() {
  const { posUser } = useAuth();
  const { products, loading: loadingProducts } = useProducts();
  const { sucursales, loading: loadingSuc } = useSucursales();
  const { vendedores, loading: loadingVendedores } = useEquipoVendedores();
  const { jornadaActiva } = useJornadas();
  const { ventas: ventasAll, loading: loadingVentas } = useDetalleVentas();
  const [detalleVenta, setDetalleVenta] = useState<ComprobanteVenta | null>(null);

  // Ventas de la jornada activa (el inventario ahora es por sucursal,
  // por lo que se filtra por jornadaId en lugar de inventarioId).
  const jornadaId = useMemo(() => {
    const entries = Object.values(jornadaActiva);
    const activa = entries.find((j) => j.activo) ?? entries[0];
    if (!activa?.fecha || activa.jornada == null) return null;
    return buildJornadaId(String(activa.fecha), Number(activa.jornada));
  }, [jornadaActiva]);

  const ventas = useMemo(
    () => (jornadaId ? ventasAll.filter((v) => v.jornadaId === jornadaId) : []),
    [ventasAll, jornadaId],
  );

  const productoNombre = (id: string) =>
    products.find((p) => p.id === id)?.nombre ?? id;

  const sucursalNombre = (id?: string | null) =>
    sucursales.find((s) => s.id === id)?.nombre ?? id ?? "—";

  const totalCajas = sucursales.reduce(
    (acc, s) =>
      s.activo === false
        ? acc
        : acc + (s.cajas?.filter((c) => c.activo !== false).length ?? 0),
    0,
  );
  const sucursalesActivas = sucursales.filter((s) => s.activo !== false);
  const ventasTotal = useMemo(
    () => ventas.reduce((acc, v) => acc + Number(v.total ?? 0), 0),
    [ventas],
  );

  const ventasPorCaja = useMemo(() => {
    const map = new Map<string, { caja: string; total: number; count: number }>();
    for (const v of ventas) {
      const key = v.cajaId ?? "sin-caja";
      const label = v.cajaNombre ?? "Sin caja";
      const prev = map.get(key) ?? { caja: label, total: 0, count: 0 };
      prev.total += Number(v.total ?? 0);
      prev.count += 1;
      map.set(key, prev);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [ventas]);

  return (
    <RequireRole adminOrAbove>
      <div className="space-y-6">
        <DashboardBanner
          title={`Hola, ${posUser?.nombre ?? "Admin"}`}
          subtitle="Resumen de tu concesión — productos, sucursales e inventario de jornada."
          action={
            <Button asChild variant="on-dark" size="sm">
              <Link href="/inventarios">Ir a inventario</Link>
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Productos activos"
            value={loadingProducts ? "—" : products.filter((p) => p.activo).length}
            icon={Package}
          />
          <StatCard
            label="Sucursales / cajas"
            value={loadingSuc ? "—" : `${sucursalesActivas.length} / ${totalCajas}`}
            icon={Store}
          />
          <StatCard
            label="Vendedores"
            value={loadingVendedores ? "—" : vendedores.length}
            icon={Users}
          />
          <StatCard
            label="Ventas jornada"
            value={loadingVentas ? "—" : formatPrice(ventasTotal)}
            icon={TrendingUp}
            hint={`${ventas.length} comprobantes`}
          />
        </div>

        {ventasPorCaja.length > 0 && (
          <div className="dashboard-card p-5">
            <h2 className="mb-4 text-[1.8rem] font-semibold text-green-dark">
              Ventas por caja
            </h2>
            <div className="space-y-3">
              {ventasPorCaja.map((row) => {
                const max = ventasPorCaja[0]?.total || 1;
                const pct = Math.round((row.total / max) * 100);
                return (
                  <div key={row.caja}>
                    <div className="mb-1 flex justify-between text-[1.3rem]">
                      <span>{row.caja}</span>
                      <span className="font-medium">{formatPrice(row.total)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-cool">
                      <div
                        className="h-full rounded-full bg-green-accent transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[1.8rem] font-semibold text-green-dark">
              Ventas recientes por caja
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/ventas">Ver todas</Link>
            </Button>
          </div>
          <DataTable<ComprobanteVenta>
            loading={loadingVentas}
            data={ventas.slice(0, 10)}
            getRowKey={(r) => r.id}
            emptyMessage="Sin ventas en la jornada activa"
            columns={[
              {
                key: "caja",
                header: "Caja",
                cell: (r) => r.cajaNombre ?? "—",
              },
              {
                key: "cajero",
                header: "Cajero",
                cell: (r) => r.cajeroNombre ?? "—",
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

        <VentaDetalleDialog
          venta={detalleVenta}
          open={Boolean(detalleVenta)}
          onOpenChange={(open) => !open && setDetalleVenta(null)}
          productoNombre={productoNombre}
          sucursalNombre={
            detalleVenta ? sucursalNombre(detalleVenta.sucursalId) : undefined
          }
        />
      </div>
    </RequireRole>
  );
}

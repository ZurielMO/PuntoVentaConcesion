"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Minus, Plus, RefreshCw, ShoppingBag, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { VentaDetalleDialog } from "@/components/dashboard/venta-detalle-dialog";
import { MetricCard } from "@/components/pos/metric-card";
import { PosProductTile } from "@/components/pos/pos-product-tile";
import { useDetalleVentas } from "@/hooks/use-cortes";
import { useInventarioJornadaActiva } from "@/hooks/use-inventarios";
import { useProducts, type Product } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { useConcessions } from "@/hooks/use-concessions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAsignacionesCajas } from "@/hooks/use-asignaciones-cajas";
import { formatDateTime, formatPrice } from "@/lib/format";
import { buildJornadaId } from "@/lib/jornada";
import type { ComprobanteVenta } from "@/lib/types";

export default function VentasPage() {
  const perms = usePermissions();
  const { concessions } = useConcessions();
  const { products } = useProducts();
  const { sucursales } = useSucursales();
  const { fetchMiCaja } = useAsignacionesCajas();

  const [filterConcesionId, setFilterConcesionId] = useState("");
  const [filterSucursalId, setFilterSucursalId] = useState("");
  const [filterCajaId, setFilterCajaId] = useState("");
  const [miCajaNombre, setMiCajaNombre] = useState<string | null>(null);
  const [detalleVenta, setDetalleVenta] = useState<ComprobanteVenta | null>(null);

  const sucursalId = perms.sucursalId ?? filterSucursalId;

  // El inventario ahora es por sucursal: vendedor usa la suya, admin/superadmin
  // usan la sucursal seleccionada en el filtro.
  const inventarioSucursalId = perms.isVendedor
    ? perms.sucursalId ?? undefined
    : filterSucursalId || undefined;

  const {
    inventario,
    jornada,
    loading: inventarioLoading,
    error: inventarioError,
    refetch: refetchInventario,
  } = useInventarioJornadaActiva(inventarioSucursalId, {
    enabled: Boolean(inventarioSucursalId),
  });
  const jornadaId =
    inventario?.jornada_fecha && inventario?.jornada_numero != null
      ? buildJornadaId(inventario.jornada_fecha, inventario.jornada_numero)
      : jornada?.fecha && jornada?.jornada != null
        ? buildJornadaId(String(jornada.fecha), Number(jornada.jornada))
        : undefined;

  const ventaFilters = useMemo(() => {
    if (perms.isSuperAdmin) {
      return {
        concesionId: filterConcesionId || undefined,
        sucursalId: filterSucursalId || undefined,
        cajaId: filterCajaId || undefined,
        inventarioId: inventario?.id,
      };
    }
    if (perms.isAdmin) {
      return {
        inventarioId: inventario?.id,
        sucursalId: filterSucursalId || undefined,
        cajaId: filterCajaId || undefined,
      };
    }
    return {
      inventarioId: inventario?.id,
      sucursalId: sucursalId || undefined,
      cajaId: filterCajaId || perms.cajaId || undefined,
    };
  }, [
    perms.isSuperAdmin,
    perms.isAdmin,
    perms.cajaId,
    filterConcesionId,
    filterSucursalId,
    filterCajaId,
    inventario?.id,
    sucursalId,
  ]);

  const { ventas, loading, error, refetch, createVenta } =
    useDetalleVentas(ventaFilters);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showPos = perms.canManageVentas && !perms.isSuperAdmin;

  const sucursalesFiltradas = useMemo(() => {
    const activas = sucursales.filter((s) => s.activo !== false);
    if (perms.isSuperAdmin && filterConcesionId) {
      return activas.filter((s) => s.concesion_id === filterConcesionId);
    }
    return activas;
  }, [sucursales, perms.isSuperAdmin, filterConcesionId]);

  const cajasFiltradas = useMemo(() => {
    const sid = perms.isAdmin || perms.isSuperAdmin ? filterSucursalId : sucursalId;
    if (!sid) return [];
    return (sucursales.find((s) => s.id === sid)?.cajas ?? []).filter(
      (c) => c.activo !== false,
    );
  }, [sucursales, filterSucursalId, sucursalId, perms.isAdmin, perms.isSuperAdmin]);

  useEffect(() => {
    if (!jornadaId || !sucursalId || !perms.isVendedor) return;
    void fetchMiCaja(jornadaId, sucursalId).then((caja) => {
      setMiCajaNombre(caja?.nombre ?? null);
      if (caja?.id) setFilterCajaId(caja.id);
    });
  }, [jornadaId, sucursalId, perms.isVendedor, fetchMiCaja]);

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of inventario?.productos ?? []) {
      const final = Number(p.cantidad_final ?? p.cantidad_inicial ?? 0);
      map.set(p.producto_id, final);
    }
    return map;
  }, [inventario]);

  const productosEnVenta = useMemo(() => {
    const ids = new Set(stockMap.keys());
    return products.filter((p) => ids.has(p.id));
  }, [products, stockMap]);

  const productoNombre = (id: string) =>
    products.find((p) => p.id === id)?.nombre ?? id;

  const concesionNombre = (id?: string | null) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  const sucursalNombreLabel = (id?: string | null) =>
    sucursales.find((s) => s.id === id)?.nombre ?? id ?? "—";

  const jornadaLabel = jornada
    ? `Jornada ${jornada.jornada ?? "—"}${jornada.fecha ? ` · ${jornada.fecha}` : ""}${
        jornada.equipo_local && jornada.equipo_visitante
          ? ` · ${jornada.equipo_local} vs ${jornada.equipo_visitante}`
          : ""
      }`
    : "Sin jornada activa";

  const cajaLabel =
    miCajaNombre ??
    cajasFiltradas.find((c) => c.id === filterCajaId)?.nombre ??
    (perms.cajaId ? "Caja asignada" : "Sin caja");

  const canSell = Boolean(
    showPos && inventario?.id && perms.concesionId && sucursalId,
  );

  const openCart = (product: Product) => {
    const stock = stockMap.get(product.id) ?? 0;
    if (stock <= 0) {
      toast.error(`"${product.nombre}" no tiene stock disponible`);
      return;
    }
    setSelectedProduct(product);
    setCantidad(1);
    setCartOpen(true);
  };

  const closeCart = () => {
    setCartOpen(false);
    setSelectedProduct(null);
    setCantidad(1);
  };

  const stockDisponible = selectedProduct
    ? (stockMap.get(selectedProduct.id) ?? 0)
    : 0;
  const lineTotal = selectedProduct
    ? cantidad * Number(selectedProduct.precio ?? 0)
    : 0;

  const handleConfirmVenta = async () => {
    if (!selectedProduct || !inventario?.id || !perms.concesionId || !sucursalId)
      return;

    if (cantidad < 1) {
      toast.error("La cantidad debe ser al menos 1");
      return;
    }
    if (cantidad > stockDisponible) {
      toast.error(`Solo hay ${stockDisponible} unidades disponibles`);
      return;
    }

    setSubmitting(true);
    try {
      await createVenta({
        ventaId: `V-${Date.now()}`,
        concesionId: perms.concesionId,
        sucursalId,
        inventarioId: inventario.id,
        productos: [
          {
            producto: selectedProduct.id,
            cantidad,
            precio_actual: Number(selectedProduct.precio ?? 0),
          },
        ],
      });
      toast.success("Venta registrada", {
        description: `${cantidad}× ${selectedProduct.nombre} · ${formatPrice(lineTotal)}`,
      });
      closeCart();
      await refetchInventario();
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar venta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole authenticated>
      <PageHeader
        title="Ventas"
        description={
          perms.isSuperAdmin
            ? "Reporte de ventas por concesión, sucursal y caja."
            : perms.isAdmin
              ? "Consulta ventas por caja y registra ventas de la jornada."
              : `${jornadaLabel} · ${sucursalNombreLabel(sucursalId)} · ${cajaLabel}`
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        }
      />

      {showPos && (
        <div className="pb-6">
          <div className="pos-gradient-header mb-6 rounded-[12px] p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[1.3rem] font-medium uppercase tracking-wider text-white/70">
                  Punto de venta
                </p>
                <p className="mt-2 flex items-center gap-2 text-[1.5rem] text-white/85">
                  <CalendarDays className="size-5" />
                  {jornadaLabel}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Productos en jornada"
                  value={productosEnVenta.length}
                  className="!bg-white/95"
                />
                <MetricCard
                  label="Ventas registradas"
                  value={ventas.length}
                  className="!bg-white/95"
                />
              </div>
            </div>
          </div>

          {inventarioLoading && (
            <p className="text-[1.6rem] text-muted-foreground">Cargando inventario…</p>
          )}
          {inventarioError && <p className="text-destructive">{inventarioError}</p>}
          {!inventarioLoading && !inventarioSucursalId && (
            <div className="glass-card mb-6 p-6 text-center">
              <p className="text-[1.6rem] text-muted-foreground">
                {perms.isVendedor
                  ? "Tu usuario no tiene una sucursal asignada. Contacta al SuperAdmin."
                  : "Selecciona una sucursal en los filtros para ver su punto de venta."}
              </p>
            </div>
          )}
          {!inventarioLoading && inventarioSucursalId && !inventario && (
            <div className="glass-card mb-6 p-6 text-center">
              <p className="text-[1.6rem] text-muted-foreground">
                No hay inventario abierto para esta sucursal en la jornada. El
                SuperAdmin debe abrirlo desde{" "}
                <Link href="/inventarios" className="text-green-accent underline">
                  Inventario
                </Link>
                .
              </p>
            </div>
          )}

          {canSell && productosEnVenta.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {productosEnVenta.map((product) => (
                <PosProductTile
                  key={product.id}
                  product={product}
                  disponible={stockMap.get(product.id) ?? 0}
                  onSelect={() => openCart(product)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 className="flex items-center gap-2 text-[1.8rem] font-semibold text-green-dark">
            <ShoppingBag className="size-5" />
            {perms.isAdmin || perms.isSuperAdmin
              ? "Ventas por caja"
              : "Mis ventas"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {perms.isSuperAdmin && (
              <NativeSelect
                className="w-52"
                value={filterConcesionId}
                aria-label="Filtrar por concesión"
                onChange={(e) => {
                  setFilterConcesionId(e.target.value);
                  setFilterSucursalId("");
                  setFilterCajaId("");
                }}
              >
                <option value="">Todas las concesiones</option>
                {concessions
                  .filter((c) => c.activo !== false)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </NativeSelect>
            )}
            {(perms.isAdmin || perms.isSuperAdmin) && (
              <>
                <NativeSelect
                  className="w-52"
                  value={filterSucursalId}
                  aria-label="Filtrar por sucursal"
                  onChange={(e) => {
                    setFilterSucursalId(e.target.value);
                    setFilterCajaId("");
                  }}
                >
                  <option value="">Todas las sucursales</option>
                  {sucursalesFiltradas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre ?? s.id}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  className="w-44"
                  value={filterCajaId}
                  aria-label="Filtrar por caja"
                  onChange={(e) => setFilterCajaId(e.target.value)}
                  disabled={!filterSucursalId}
                >
                  <option value="">Todas las cajas</option>
                  {cajasFiltradas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre ?? c.id}
                    </option>
                  ))}
                </NativeSelect>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
            {error}
          </div>
        )}

        <DataTable<ComprobanteVenta>
          loading={loading}
          data={ventas}
          getRowKey={(v) => v.id}
          emptyMessage="No hay ventas para los filtros seleccionados."
          columns={[
            {
              key: "fecha",
              header: "Fecha",
              cell: (v) => formatDateTime(v.fecha ?? v.createdAt),
            },
            ...(perms.isSuperAdmin
              ? [
                  {
                    key: "concesion",
                    header: "Concesión",
                    cell: (v: ComprobanteVenta) => concesionNombre(v.concesionId),
                  },
                ]
              : []),
            {
              key: "sucursal",
              header: "Sucursal",
              cell: (v) => sucursalNombreLabel(v.sucursalId),
            },
            {
              key: "caja",
              header: "Caja",
              cell: (v) => v.cajaNombre ?? "—",
            },
            {
              key: "cajero",
              header: "Cajero",
              cell: (v) => v.cajeroNombre ?? "—",
            },
            {
              key: "total",
              header: "Total",
              cell: (v) => (
                <span className="font-semibold text-green-dark">
                  {formatPrice(Number(v.total))}
                </span>
              ),
            },
            {
              key: "acciones",
              header: "Detalle",
              cell: (v) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDetalleVenta(v)}
                >
                  <Eye className="size-4" />
                  Ver detalle
                </Button>
              ),
            },
          ]}
        />
      </section>

      <VentaDetalleDialog
        venta={detalleVenta}
        open={Boolean(detalleVenta)}
        onOpenChange={(open) => !open && setDetalleVenta(null)}
        productoNombre={productoNombre}
        sucursalNombre={
          detalleVenta ? sucursalNombreLabel(detalleVenta.sucursalId) : undefined
        }
        concesionNombre={
          detalleVenta ? concesionNombre(detalleVenta.concesionId) : undefined
        }
      />

      <Dialog open={cartOpen} onOpenChange={(open) => !open && closeCart()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.nombre}</DialogTitle>
            <DialogDescription>
              Disponible: {stockDisponible} · {sucursalNombreLabel(sucursalId)} ·{" "}
              {cajaLabel}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-12"
                  disabled={cantidad <= 1}
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                >
                  <Minus className="size-5" />
                </Button>
                <span className="min-w-[3rem] text-center text-[3rem] font-bold">
                  {cantidad}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-12"
                  disabled={cantidad >= stockDisponible}
                  onClick={() =>
                    setCantidad((c) => Math.min(stockDisponible, c + 1))
                  }
                >
                  <Plus className="size-5" />
                </Button>
              </div>

              <div className="rounded-[12px] bg-green-soft/60 p-4 text-center">
                <p className="text-[1.3rem] text-muted-foreground">Total</p>
                <p className="text-[2.8rem] font-bold text-green-dark">
                  {formatPrice(lineTotal)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeCart}>
              Cancelar
            </Button>
            <Button
              disabled={submitting || cantidad < 1 || cantidad > stockDisponible}
              onClick={() => void handleConfirmVenta()}
            >
              {submitting ? "Procesando…" : "Confirmar venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

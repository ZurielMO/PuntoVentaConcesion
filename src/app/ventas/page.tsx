"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import { MetricCard } from "@/components/pos/metric-card";
import { PosProductTile } from "@/components/pos/pos-product-tile";
import { useDetalleVentas } from "@/hooks/use-cortes";
import { useInventarioJornadaActiva } from "@/hooks/use-inventarios";
import { useProducts, type Product } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { usePermissions } from "@/hooks/use-permissions";
import { useAsignacionesCajas } from "@/hooks/use-asignaciones-cajas";
import { buildJornadaId } from "@/lib/jornada";

function formatPrice(precio: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(precio);
}

function formatVentaTime(fecha?: unknown) {
  if (!fecha) return "";
  if (typeof fecha === "string") {
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? fecha : d.toLocaleString("es-MX");
  }
  if (typeof fecha === "object" && fecha !== null && "_seconds" in fecha) {
    const sec = (fecha as { _seconds: number })._seconds;
    return new Date(sec * 1000).toLocaleString("es-MX");
  }
  return "";
}

export default function VentasPage() {
  const perms = usePermissions();
  const {
    inventario,
    jornada,
    loading: inventarioLoading,
    error: inventarioError,
    refetch: refetchInventario,
  } = useInventarioJornadaActiva();
  const { products } = useProducts();
  const { sucursales } = useSucursales();
  const { fetchMiCaja } = useAsignacionesCajas();

  const [filterSucursalId, setFilterSucursalId] = useState("");
  const [filterCajaId, setFilterCajaId] = useState("");
  const [miCajaNombre, setMiCajaNombre] = useState<string | null>(null);

  const sucursalId = perms.sucursalId ?? filterSucursalId;
  const jornadaId =
    inventario?.jornada_fecha && inventario?.jornada_numero != null
      ? buildJornadaId(inventario.jornada_fecha, inventario.jornada_numero)
      : jornada?.fecha && jornada?.jornada != null
        ? buildJornadaId(String(jornada.fecha), Number(jornada.jornada))
        : undefined;

  const ventaFilters = useMemo(
    () => ({
      inventarioId: inventario?.id,
      sucursalId: perms.isAdmin ? filterSucursalId || undefined : sucursalId ?? undefined,
      cajaId: perms.isAdmin
        ? filterCajaId || undefined
        : filterCajaId || perms.cajaId || undefined,
    }),
    [inventario?.id, perms.isAdmin, filterSucursalId, filterCajaId, sucursalId, perms.cajaId],
  );

  const { ventas, loading, error, refetch, createVenta } = useDetalleVentas(ventaFilters);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sucursalNombre =
    sucursales.find((s) => s.id === sucursalId)?.nombre ?? "Tu sucursal";

  const cajasFiltradas = useMemo(() => {
    const sid = perms.isAdmin ? filterSucursalId : sucursalId;
    if (!sid) return [];
    return (sucursales.find((s) => s.id === sid)?.cajas ?? []).filter(
      (c) => c.activo !== false,
    );
  }, [sucursales, filterSucursalId, sucursalId, perms.isAdmin]);

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
    products.find((p) => p.id === id)?.nombre ?? "Producto";

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

  const canSell = Boolean(inventario?.id && perms.concesionId && sucursalId);

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

  const stockDisponible = selectedProduct ? (stockMap.get(selectedProduct.id) ?? 0) : 0;
  const lineTotal = selectedProduct
    ? cantidad * Number(selectedProduct.precio ?? 0)
    : 0;

  const handleConfirmVenta = async () => {
    if (!selectedProduct || !inventario?.id || !perms.concesionId || !sucursalId) return;

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
        action: {
          label: "Ver inventario",
          onClick: () => window.location.assign("/inventarios"),
        },
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
      <div className="min-h-screen bg-neutral-warm pb-[var(--space-6)]">
        <div className="pos-gradient-header mx-auto max-w-[1400px] px-[var(--outer-gutter)] py-8 lg:px-[var(--outer-gutter-lg)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[1.3rem] font-medium uppercase tracking-wider text-white/70">
                Punto de venta
              </p>
              <h1 className="!text-[3rem] !text-white">Ventas</h1>
              <p className="mt-2 flex items-center gap-2 text-[1.5rem] text-white/85">
                <CalendarDays className="size-5" />
                {jornadaLabel}
              </p>
              <p className="mt-1 text-[1.4rem] text-white/70">
                {sucursalNombre} · {cajaLabel}
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

        <div className="mx-auto max-w-[1400px] px-[var(--outer-gutter)] pt-8 lg:px-[var(--outer-gutter-lg)]">
          {inventarioLoading && (
            <p className="text-[1.6rem] text-muted-foreground">Cargando inventario…</p>
          )}
          {inventarioError && (
            <p className="text-destructive">{inventarioError}</p>
          )}
          {!inventarioLoading && !inventario && (
            <div className="glass-card p-6 text-center">
              <p className="text-[1.6rem] text-muted-foreground">
                No hay inventario abierto para esta jornada. El administrador debe abrirlo
                desde{" "}
                <Link href="/inventarios" className="text-green-accent underline">
                  Inventario
                </Link>
                .
              </p>
            </div>
          )}

          {canSell && productosEnVenta.length === 0 && (
            <div className="glass-card p-6 text-center">
              <p className="text-[1.6rem] text-muted-foreground">
                El inventario no tiene productos cargados aún.
              </p>
            </div>
          )}

          {canSell && productosEnVenta.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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

          {!canSell && !inventarioLoading && inventario && (
            <p className="text-destructive">Tu perfil no tiene sucursal asignada.</p>
          )}

          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <h2 className="flex items-center gap-2 text-[2rem] font-semibold text-starbucks-green">
                <ShoppingBag className="size-6" />
                Ventas por caja
              </h2>
              <div className="flex flex-wrap gap-2">
                {perms.isAdmin && (
                  <>
                    <select
                      className="h-10 rounded-md border px-3 text-[1.4rem]"
                      value={filterSucursalId}
                      onChange={(e) => {
                        setFilterSucursalId(e.target.value);
                        setFilterCajaId("");
                      }}
                    >
                      <option value="">Todas las sucursales</option>
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre ?? s.id}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-md border px-3 text-[1.4rem]"
                      value={filterCajaId}
                      onChange={(e) => setFilterCajaId(e.target.value)}
                      disabled={!filterSucursalId}
                    >
                      <option value="">Todas las cajas</option>
                      {cajasFiltradas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre ?? c.id}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  Actualizar
                </Button>
              </div>
            </div>

            {loading && <p className="text-muted-foreground">Cargando ventas…</p>}
            {error && <p className="text-destructive">{error}</p>}

            <div className="grid gap-3">
              {ventas.slice(0, 50).map((v) => {
                const items =
                  v.detalle?.map(
                    (d) => `${d.cantidad}× ${productoNombre(d.producto)}`,
                  ).join(", ") ?? "Venta";
                const sucNombre =
                  sucursales.find((s) => s.id === v.sucursalId)?.nombre ?? v.sucursalId;
                return (
                  <div key={v.id} className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-[1.6rem] font-medium">{items}</p>
                      <p className="text-[1.3rem] text-muted-foreground">
                        {formatVentaTime(v.fecha ?? v.createdAt)}
                        {v.cajaNombre ? ` · ${v.cajaNombre}` : " · Caja no registrada"}
                        {v.cajeroNombre ? ` · ${v.cajeroNombre}` : ""}
                        {` · ${sucNombre}`}
                      </p>
                    </div>
                    <p className="text-[2rem] font-bold text-starbucks-green">
                      {formatPrice(Number(v.total))}
                    </p>
                  </div>
                );
              })}
              {!loading && ventas.length === 0 && (
                <p className="text-[1.4rem] text-muted-foreground">
                  No hay ventas para los filtros seleccionados.
                </p>
              )}
            </div>
          </section>
        </div>

        <Dialog open={cartOpen} onOpenChange={(open) => !open && closeCart()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedProduct?.nombre}</DialogTitle>
              <DialogDescription>
                Disponible: {stockDisponible} · {sucursalNombre} · {cajaLabel}
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

                <div className="rounded-[var(--card-border-radius)] bg-green-light/40 p-4 text-center">
                  <p className="text-[1.3rem] text-muted-foreground">Total</p>
                  <p className="text-[2.8rem] font-bold text-starbucks-green">
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
      </div>
    </RequireRole>
  );
}

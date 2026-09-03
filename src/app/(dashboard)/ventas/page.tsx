"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Minus, Plus, RefreshCw, ShoppingBag } from "lucide-react";
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
import {
  useInventarioJornadaActiva,
  useJornadas,
  useJornadasDisponibles,
} from "@/hooks/use-inventarios";
import { useProducts, type Product } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { useConcessions } from "@/hooks/use-concessions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAsignacionesCajas } from "@/hooks/use-asignaciones-cajas";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  buildJornadaSelectLabel,
  formatJornadaLabel,
  isJornadaTodas,
  JORNADA_TODAS_LABEL,
  normalizeRama,
  parseJornadaId,
  type JornadaRama,
} from "@/lib/jornada";
import { buildJornadaSelectOptions } from "@/lib/jornada-select-options";
import { isVentaPalcos } from "@/lib/venta-palcos";
import type { ComprobanteVenta } from "@/lib/types";
import {
  JornadaSelect,
  type JornadaSelectOption,
} from "@/components/dashboard/jornada-select";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";

export default function VentasPage() {
  const perms = usePermissions();
  const { concessions } = useConcessions();
  const { products } = useProducts();
  const { sucursales } = useSucursales();
  const { fetchMiCaja } = useAsignacionesCajas();
  const { activas, loading: activasLoading } = useJornadas();

  const [filterConcesionId, setFilterConcesionId] = useState("");
  const [filterSucursalId, setFilterSucursalId] = useState("");
  const [filterCajaId, setFilterCajaId] = useState("");
  const [selectedJornadaId, setSelectedJornadaId] = useState("");
  const [miCajaNombre, setMiCajaNombre] = useState<string | null>(null);
  const [detalleVenta, setDetalleVenta] = useState<ComprobanteVenta | null>(null);

  const effectiveConcesionId = useMemo(() => {
    if (perms.isSuperAdmin) return filterConcesionId;
    return perms.concesionId ?? filterConcesionId;
  }, [perms.isSuperAdmin, perms.concesionId, filterConcesionId]);

  const { jornadas, loading: jornadasLoading } = useJornadasDisponibles({
    concesionId: effectiveConcesionId || undefined,
    sucursalId: filterSucursalId || undefined,
  });

  const jornadaOptions = useMemo<JornadaSelectOption[]>(
    () => buildJornadaSelectOptions(jornadas, activas),
    [jornadas, activas],
  );

  const jornadasReady = !jornadasLoading && !activasLoading;

  useEffect(() => {
    if (!jornadasReady) return;
    if (
      selectedJornadaId &&
      (isJornadaTodas(selectedJornadaId) ||
        jornadaOptions.some((j) => j.jornadaId === selectedJornadaId))
    ) {
      return;
    }
    const activaOpt = jornadaOptions.find((j) => j.activa);
    if (activaOpt) {
      setSelectedJornadaId(activaOpt.jornadaId);
    } else if (jornadaOptions.length > 0) {
      setSelectedJornadaId(jornadaOptions[0].jornadaId);
    } else if (selectedJornadaId) {
      setSelectedJornadaId("");
    }
  }, [jornadasReady, jornadaOptions, selectedJornadaId]);

  const todasLasJornadas = isJornadaTodas(selectedJornadaId);

  const selectedJornada = todasLasJornadas
    ? undefined
    : jornadaOptions.find((j) => j.jornadaId === selectedJornadaId);
  const rama: JornadaRama =
    parseJornadaId(selectedJornadaId)?.rama ??
    normalizeRama(selectedJornada?.rama);
  const selectedIsActive = Boolean(selectedJornada?.activa);

  const sucursalId = perms.sucursalId ?? filterSucursalId;

  // Inventario solo para POS en jornada activa.
  const inventarioSucursalId = perms.isVendedor
    ? perms.sucursalId ?? undefined
    : filterSucursalId || undefined;

  const showPos = perms.canManageVentas && !perms.isSuperAdmin;

  const {
    inventario,
    jornada,
    loading: inventarioLoading,
    error: inventarioError,
    refetch: refetchInventario,
  } = useInventarioJornadaActiva(inventarioSucursalId, {
    enabled:
      showPos &&
      selectedIsActive &&
      Boolean(inventarioSucursalId) &&
      Boolean(selectedJornadaId),
    rama,
  });

  const jornadaId = todasLasJornadas ? undefined : selectedJornadaId || undefined;

  const ventaFilters = useMemo(() => {
    const base: {
      concesionId?: string;
      sucursalId?: string;
      cajaId?: string;
      jornadaId?: string;
    } = {};

    if (!todasLasJornadas && selectedJornadaId) {
      base.jornadaId = selectedJornadaId;
    }

    if (perms.isSuperAdmin) {
      return {
        ...base,
        concesionId: filterConcesionId || undefined,
        sucursalId: filterSucursalId || undefined,
        cajaId: filterCajaId || undefined,
      };
    }
    if (perms.isAdmin) {
      return {
        ...base,
        concesionId: perms.concesionId || undefined,
        sucursalId: filterSucursalId || undefined,
        cajaId: filterCajaId || undefined,
      };
    }
    return {
      ...base,
      concesionId: perms.concesionId || undefined,
      sucursalId: sucursalId || undefined,
      cajaId: filterCajaId || perms.cajaId || undefined,
    };
  }, [
    perms.isSuperAdmin,
    perms.isAdmin,
    perms.concesionId,
    perms.cajaId,
    filterConcesionId,
    filterSucursalId,
    filterCajaId,
    selectedJornadaId,
    todasLasJornadas,
    sucursalId,
  ]);

  const { ventas, loading, error, refetch, createVenta } =
    useDetalleVentas(ventaFilters);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sucursalesFiltradas = useMemo(() => {
    const list = sucursales.filter((s) => s.activo !== false);
    if (perms.isSuperAdmin && filterConcesionId) {
      return list.filter((s) => s.concesion_id === filterConcesionId);
    }
    return list;
  }, [sucursales, perms.isSuperAdmin, filterConcesionId]);

  const cajasFiltradas = useMemo(() => {
    const sid = perms.isAdmin || perms.isSuperAdmin ? filterSucursalId : sucursalId;
    if (!sid) return [];
    return (sucursales.find((s) => s.id === sid)?.cajas ?? []).filter(
      (c) => c.activo !== false,
    );
  }, [sucursales, filterSucursalId, sucursalId, perms.isAdmin, perms.isSuperAdmin]);

  useEffect(() => {
    if (!jornadaId || !sucursalId || !perms.isVendedor || !selectedIsActive) {
      return;
    }
    void fetchMiCaja(jornadaId, sucursalId).then((caja) => {
      setMiCajaNombre(caja?.nombre ?? null);
      if (caja?.id) setFilterCajaId(caja.id);
    });
  }, [jornadaId, sucursalId, perms.isVendedor, selectedIsActive, fetchMiCaja]);

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

  const jornadaLabel = todasLasJornadas
    ? JORNADA_TODAS_LABEL
    : selectedJornada
      ? buildJornadaSelectLabel({
          numero: selectedJornada.numero,
          fecha: selectedJornada.fecha,
          rama: selectedJornada.rama,
          equipoLocal: selectedJornada.equipoLocal,
          equipoVisitante: selectedJornada.equipoVisitante,
          activa: selectedIsActive,
        })
      : jornada
        ? buildJornadaSelectLabel({
            numero: Number(jornada.jornada ?? 0),
            fecha: String(jornada.fecha ?? ""),
            rama,
            equipoLocal: jornada.equipo_local,
            equipoVisitante: jornada.equipo_visitante,
            activa: selectedIsActive,
          })
        : "Sin jornada seleccionada";

  const cajaLabel =
    miCajaNombre ??
    cajasFiltradas.find((c) => c.id === filterCajaId)?.nombre ??
    (perms.cajaId ? "Caja asignada" : "Sin caja");

  const canSell = Boolean(
    showPos &&
      selectedIsActive &&
      inventario?.id &&
      perms.concesionId &&
      sucursalId,
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

      

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 className="flex items-center gap-2 text-[1.8rem] font-semibold text-green-dark">
            <ShoppingBag className="size-5" />
            {perms.isAdmin || perms.isSuperAdmin
              ? "Ventas por caja"
              : "Mis ventas"}
          </h2>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Jornada" htmlFor="filtro-jornada-ventas">
            <JornadaSelect
              id="filtro-jornada-ventas"
              value={selectedJornadaId}
              onValueChange={setSelectedJornadaId}
              options={jornadaOptions}
              loading={!jornadasReady}
              placeholder="Selecciona jornada"
              includeAllOption
            />
          </Field>
          {perms.isSuperAdmin && (
            <Field label="Concesión" htmlFor="filtro-concesion-ventas">
              <NativeSelect
                id="filtro-concesion-ventas"
                value={filterConcesionId}
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
            </Field>
          )}
          {(perms.isAdmin || perms.isSuperAdmin) && (
            <>
              <Field label="Sucursal" htmlFor="filtro-sucursal-ventas">
                <NativeSelect
                  id="filtro-sucursal-ventas"
                  value={filterSucursalId}
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
              </Field>
              <Field label="Caja" htmlFor="filtro-caja-ventas">
                <NativeSelect
                  id="filtro-caja-ventas"
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
                </NativeSelect>
              </Field>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
            {error}
          </div>
        )}

        <DataTable<ComprobanteVenta>
          loading={loading}
          data={ventas}
          getRowKey={(v) => v.id}
          pageSize={20}
          emptyMessage={
            todasLasJornadas
              ? "No hay ventas con los filtros seleccionados."
              : selectedJornadaId
                ? "No hay ventas para esta jornada con los filtros seleccionados."
                : "Selecciona una jornada para ver las ventas."
          }
          columns={[
            {
              key: "fecha",
              header: "Fecha",
              cell: (v) => formatDateTime(v.fecha ?? v.createdAt),
            },
            ...(todasLasJornadas
              ? [
                  {
                    key: "jornada",
                    header: "Jornada",
                    cell: (v: ComprobanteVenta) =>
                      v.jornadaId
                        ? formatJornadaLabel(v.jornadaId, v.inventarioId)
                        : "—",
                  },
                ]
              : []),
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
              cell: (v) => (
                <div className="flex flex-wrap items-center gap-2">
                  <span>{v.cajaNombre ?? "—"}</span>
                  {isVentaPalcos(v) && (
                    <Badge
                      variant="secondary"
                      className="border-sky-200 bg-sky-50 text-sky-900"
                    >
                      Palcos
                    </Badge>
                  )}
                </div>
              ),
            },
            {
              key: "cajero",
              header: "Cajero",
              cell: (v) => v.cajeroNombre ?? "—",
            },
            {
              key: "total",
              header: "Total",
              mobileRole: "primary",
              cell: (v) => (
                <span className="font-semibold text-green-dark">
                  {formatPrice(Number(v.total))}
                </span>
              ),
            },
            {
              key: "acciones",
              header: "Detalle",
              mobileRole: "action",
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

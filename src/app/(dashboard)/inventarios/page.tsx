"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PackagePlus, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import { useInventarioJornadaActiva, useJornadas } from "@/hooks/use-inventarios";
import { useProducts } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { useConcessions } from "@/hooks/use-concessions";
import { useConcesionFilterParam } from "@/hooks/use-concesion-filter-param";
import { useDeepLinkParam } from "@/hooks/use-deep-link-params";
import { useActiveConcesionOptional } from "@/hooks/use-active-concesion";
import { usePermissions } from "@/hooks/use-permissions";
import type { InventarioMovimiento, InventarioProducto } from "@/lib/types";
import "@/styles/wizard-alta.css";

type DetailTab = "stock" | "movimientos";

function stockRow(p: InventarioProducto) {
  const inicial = Number(p.cantidad_inicial ?? 0);
  const final = Number(p.cantidad_final ?? inicial);
  const vendido = Math.max(0, inicial - final);
  return { inicial, final, vendido, disponible: final };
}

function movimientoLabel(m: InventarioMovimiento) {
  if (m.tipo === "VENTA") return "Venta";
  if (m.tipo === "CARGA_INICIAL") return "Carga inicial";
  if (m.tipo === "AJUSTE") {
    return m.cantidad >= 0 ? "Ajuste entrada" : "Ajuste salida";
  }
  return "Ajuste";
}

export default function InventariosPage() {
  const perms = usePermissions();
  const activeCtx = useActiveConcesionOptional();
  const { jornadaActiva, loading: jornadaLoading } = useJornadas();
  const { products } = useProducts();
  const { sucursales } = useSucursales();
  const { concessions } = useConcessions();

  const [concesionSel, setConcesionSel] = useConcesionFilterParam();
  const deepSucursalId = useDeepLinkParam("sucursalId");
  const [sucursalSel, setSucursalSel] = useState("");
  const deepSucursalApplied = useRef(false);
  const autoOpenAttemptedFor = useRef<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("stock");
  const [cargaOpen, setCargaOpen] = useState(false);
  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [productoId, setProductoId] = useState("");
  const [cantidadInicial, setCantidadInicial] = useState("");
  const [ajusteProductoId, setAjusteProductoId] = useState("");
  const [ajusteDireccion, setAjusteDireccion] = useState<"entrada" | "salida">(
    "entrada",
  );
  const [ajusteCantidad, setAjusteCantidad] = useState("");
  const [ajusteMotivo, setAjusteMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const sucursalesVisibles = useMemo(() => {
    const activas = sucursales.filter((s) => s.activo !== false);
    if (perms.isSuperAdmin && concesionSel) {
      return activas.filter((s) => s.concesion_id === concesionSel);
    }
    return activas;
  }, [sucursales, perms.isSuperAdmin, concesionSel]);

  useEffect(() => {
    if (perms.isVendedor) return;
    if (sucursalesVisibles.length === 0) {
      setSucursalSel("");
      return;
    }
    if (
      !deepSucursalApplied.current &&
      deepSucursalId &&
      sucursalesVisibles.some((s) => s.id === deepSucursalId)
    ) {
      deepSucursalApplied.current = true;
      setSucursalSel(deepSucursalId);
      return;
    }
    // Sin deep-link: no auto-seleccionar; solo limpiar si ya no es válida.
    if (sucursalSel && !sucursalesVisibles.some((s) => s.id === sucursalSel)) {
      setSucursalSel("");
    }
  }, [perms.isVendedor, sucursalesVisibles, deepSucursalId, sucursalSel]);

  const setConcesion = (value: string) => {
    setConcesionSel(value);
    activeCtx?.setActiveConcesionId(value || null);
    setSucursalSel("");
  };

  const effectiveSucursalId = perms.isVendedor
    ? perms.sucursalId ?? ""
    : sucursalSel;

  const sucursalActual = sucursales.find((s) => s.id === effectiveSucursalId);

  const {
    inventario,
    jornada,
    movimientos,
    loading,
    error,
    refetch,
    openInventarioJornadaActiva,
    upsertProducto,
    ajustarProducto,
  } = useInventarioJornadaActiva(effectiveSucursalId || undefined, {
    enabled: Boolean(effectiveSucursalId),
  });

  const jornadaBanner = useMemo(() => {
    const fromApi = jornada;
    if (fromApi) return fromApi;
    const entries = Object.values(jornadaActiva);
    return entries.find((j) => j.activo) ?? entries[0];
  }, [jornada, jornadaActiva]);

  // Al elegir sucursal: abrir inventario automáticamente (getOrCreate; no-op si ya existe).
  useEffect(() => {
    autoOpenAttemptedFor.current = null;
    setActionError(null);
    setSubmitting(false);
  }, [effectiveSucursalId]);

  useEffect(() => {
    if (!perms.canManageInventario) return;
    if (!effectiveSucursalId) return;
    if (loading || jornadaLoading || submitting) return;
    if (inventario) return;
    if (!jornadaBanner) return;
    if (autoOpenAttemptedFor.current === effectiveSucursalId) return;

    const openingFor = effectiveSucursalId;
    autoOpenAttemptedFor.current = openingFor;
    setSubmitting(true);
    setActionError(null);

    void openInventarioJornadaActiva()
      .catch((err) => {
        if (autoOpenAttemptedFor.current !== openingFor) return;
        setActionError(
          err instanceof Error ? err.message : "Error al abrir inventario",
        );
      })
      .finally(() => {
        if (autoOpenAttemptedFor.current !== openingFor) return;
        setSubmitting(false);
      });
  }, [
    perms.canManageInventario,
    effectiveSucursalId,
    loading,
    jornadaLoading,
    submitting,
    inventario,
    jornadaBanner,
    openInventarioJornadaActiva,
  ]);

  const productoNombre = (id: string) =>
    products.find((p) => p.id === id)?.nombre ?? id;

  const sucursalNombre = (id?: string | null) =>
    sucursales.find((s) => s.id === id)?.nombre ?? id ?? "—";

  const concesionNombre = (id?: string | null) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  const productosEnInventario = inventario?.productos ?? [];

  const productosCatalogo = useMemo(() => {
    const concesionId = sucursalActual?.concesion_id;
    const yaCargados = new Set(
      productosEnInventario.map((p) => p.producto_id),
    );
    const base =
      perms.isSuperAdmin && concesionId
        ? products.filter((p) => p.concesion_id === concesionId)
        : products;
    return base.filter((p) => !yaCargados.has(p.id));
  }, [
    products,
    perms.isSuperAdmin,
    sucursalActual?.concesion_id,
    productosEnInventario,
  ]);

  const needsConcesionPick = perms.isSuperAdmin && !concesionSel;
  const showSidebarContent = !perms.isSuperAdmin || Boolean(concesionSel);

  const handleRefresh = () => {
    autoOpenAttemptedFor.current = null;
    setActionError(null);
    void refetch();
  };

  const openCarga = () => {
    setProductoId("");
    setCantidadInicial("");
    setCargaOpen(true);
  };

  const closeCarga = () => {
    setCargaOpen(false);
    setProductoId("");
    setCantidadInicial("");
  };

  const openAjuste = (preselectProductoId?: string) => {
    setAjusteProductoId(preselectProductoId ?? "");
    setAjusteDireccion("entrada");
    setAjusteCantidad("");
    setAjusteMotivo("");
    setAjusteOpen(true);
  };

  const closeAjuste = () => {
    setAjusteOpen(false);
    setAjusteProductoId("");
    setAjusteDireccion("entrada");
    setAjusteCantidad("");
    setAjusteMotivo("");
  };

  const handleCarga = async (e: FormEvent) => {
    e.preventDefault();
    if (!productoId || !cantidadInicial) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await upsertProducto(productoId, {
        cantidad_inicial: Number(cantidadInicial),
      });
      closeCarga();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al cargar producto",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAjuste = async (e: FormEvent) => {
    e.preventDefault();
    if (!ajusteProductoId || !ajusteCantidad) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await ajustarProducto(ajusteProductoId, {
        direccion: ajusteDireccion,
        cantidad: Number(ajusteCantidad),
        ...(ajusteMotivo.trim() ? { motivo: ajusteMotivo.trim() } : {}),
      });
      closeAjuste();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al ajustar stock",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const heroDescription = perms.canManageInventario
    ? "Stock por sucursal para la jornada activa. Carga el inventario inicial o aplica ajustes de entrada/salida."
    : perms.isVendedor
      ? "Stock de tu sucursal para la jornada activa."
      : "Consulta el inventario por sucursal (solo lectura).";

  return (
    <RequireRole authenticated>
      <div className="wizard-alta wizard-alta__shell wizard-alta__shell--fill">
        <header className="wizard-alta__hero">
          <div className="wizard-alta__hero-inner">
            <div>
              <h1>Inventario</h1>
              <p>{heroDescription}</p>
            </div>
            <div className="wizard-alta__hero-actions">
              <button
                type="button"
                className="wizard-alta__exit"
                onClick={handleRefresh}
                disabled={loading || submitting}
              >
                <RefreshCw className="size-4" />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {(error || actionError) && (
          <div className="mt-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
            {error ?? actionError}
          </div>
        )}

        <div className="wizard-alta__layout">
          <aside className="wizard-alta__sidebar">
            {perms.isSuperAdmin && (
              <div className="wizard-alta__sidebar-filter">
                <Field label="1) Elige concesión" htmlFor="concesionSel">
                  <NativeSelect
                    id="concesionSel"
                    value={concesionSel}
                    onChange={(e) => setConcesion(e.target.value)}
                  >
                    <option value="">Selecciona una concesión</option>
                    {concessions
                      .filter((c) => c.activo !== false)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                  </NativeSelect>
                </Field>
              </div>
            )}

            {perms.isVendedor ? (
              <div className="wizard-alta__sidebar-head mt-2">
                <h2 className="wizard-alta__sidebar-title">Tu sucursal</h2>
                <p className="wizard-alta__hint mt-2">
                  {effectiveSucursalId
                    ? sucursalNombre(effectiveSucursalId)
                    : "Sin sucursal asignada"}
                </p>
              </div>
            ) : !showSidebarContent ? (
              <p className="wizard-alta__empty">
                Primero elige la concesión. Después verás sus sucursales e
                inventario.
              </p>
            ) : (
              <>
                <div className="wizard-alta__sidebar-head mt-2">
                  <h2 className="wizard-alta__sidebar-title">Sucursales</h2>
                </div>

                {sucursalesVisibles.length === 0 ? (
                  <p className="wizard-alta__empty">
                    No hay sucursales activas
                    {perms.isSuperAdmin ? " en esta concesión" : ""}.
                  </p>
                ) : (
                  <ul className="wizard-alta__sidebar-list">
                    {sucursalesVisibles.map((s) => {
                      const isSelected = s.id === sucursalSel;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSucursalSel(s.id);
                              setDetailTab("stock");
                              setActionError(null);
                            }}
                            className={`wizard-alta__sidebar-item${
                              isSelected
                                ? " wizard-alta__sidebar-item--active"
                                : ""
                            }`}
                          >
                            <div className="wizard-alta__sidebar-item-top">
                              <p className="wizard-alta__sidebar-item-name">
                                {s.nombre ?? s.id}
                              </p>
                            </div>
                            {perms.isSuperAdmin && (
                              <p className="wizard-alta__sidebar-item-meta">
                                {concesionNombre(s.concesion_id)}
                              </p>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </aside>

          <div className="wizard-alta__panel">
            {needsConcesionPick ? (
              <div className="wizard-alta__panel-body">
                <p className="wizard-alta__hint">
                  1) Elige la concesión a la izquierda → 2) Selecciona una
                  sucursal para ver su inventario.
                </p>
                <p className="wizard-alta__empty">
                  Selecciona una concesión para ver el inventario.
                </p>
              </div>
            ) : !effectiveSucursalId ? (
              <div className="wizard-alta__panel-body">
                <p className="wizard-alta__hint">
                  {perms.isVendedor
                    ? "Tu usuario no tiene una sucursal asignada. Contacta al administrador."
                    : "Elige una sucursal a la izquierda para ver su inventario de jornada."}
                </p>
                <p className="wizard-alta__empty">
                  {perms.isVendedor
                    ? "Sin sucursal asignada."
                    : "Cuando elijas una sucursal, aquí verás stock y movimientos."}
                </p>
              </div>
            ) : (
              <>
                <div className="wizard-alta__panel-head">
                  <div className="wizard-alta__identity">
                    <div>
                      <h2 className="wizard-alta__panel-title">
                        {sucursalNombre(effectiveSucursalId)}
                      </h2>
                      <p className="wizard-alta__panel-sub">
                        {jornadaLoading && !jornadaBanner
                          ? "Cargando jornada…"
                          : jornadaBanner
                            ? `Jornada ${jornadaBanner.jornada ?? "—"}${
                                jornadaBanner.fecha
                                  ? ` · ${jornadaBanner.fecha}`
                                  : ""
                              }${
                                jornadaBanner.hora
                                  ? ` · ${jornadaBanner.hora}`
                                  : ""
                              }${
                                jornadaBanner.equipo_local ||
                                jornadaBanner.equipo_visitante
                                  ? ` · ${jornadaBanner.equipo_local ?? "—"} vs ${jornadaBanner.equipo_visitante ?? "—"}`
                                  : ""
                              }${
                                jornadaBanner.estadio
                                  ? ` · ${jornadaBanner.estadio}`
                                  : ""
                              }`
                            : "No hay jornada activa configurada"}
                      </p>
                    </div>
                  </div>

                  {inventario && (
                    <nav
                      className="wizard-alta__panel-tabs"
                      aria-label="Secciones del inventario"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={detailTab === "stock"}
                        className={`wizard-alta__panel-tab${
                          detailTab === "stock"
                            ? " wizard-alta__panel-tab--active"
                            : ""
                        }`}
                        onClick={() => setDetailTab("stock")}
                      >
                        Stock
                        <span className="wizard-alta__panel-tab-count">
                          {productosEnInventario.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={detailTab === "movimientos"}
                        className={`wizard-alta__panel-tab${
                          detailTab === "movimientos"
                            ? " wizard-alta__panel-tab--active"
                            : ""
                        }`}
                        onClick={() => setDetailTab("movimientos")}
                      >
                        Movimientos
                        <span className="wizard-alta__panel-tab-count">
                          {movimientos.length}
                        </span>
                      </button>
                    </nav>
                  )}
                </div>

                <div className="wizard-alta__panel-body wizard-alta__panel-body--stack">
                  {loading ? (
                    <p className="wizard-alta__empty">Cargando inventario…</p>
                  ) : submitting && !inventario ? (
                    <p className="wizard-alta__empty">Abriendo inventario…</p>
                  ) : !inventario && jornadaBanner ? (
                    <div>
                      <p className="wizard-alta__hint">
                        {perms.canManageInventario
                          ? "No se pudo abrir el inventario de esta sucursal. Usa Actualizar para reintentar."
                          : "Aún no se ha abierto el inventario de esta sucursal para la jornada."}
                      </p>
                      <p className="wizard-alta__empty">
                        Sin inventario abierto.
                      </p>
                    </div>
                  ) : !inventario ? (
                    <p className="wizard-alta__empty">
                      No hay jornada activa ni inventario disponible.
                    </p>
                  ) : detailTab === "stock" ? (
                    <section className="wizard-alta__section">
                      <div className="wizard-alta__section-head">
                        <div>
                          <h3 className="wizard-alta__section-title">Stock</h3>
                          <p className="wizard-alta__section-sub">
                            Productos cargados para la jornada
                          </p>
                        </div>
                        {perms.canManageInventario && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                              onClick={openCarga}
                            >
                              <PackagePlus className="size-3.5" />
                              Cargar producto
                            </button>
                            {productosEnInventario.length > 0 && (
                              <button
                                type="button"
                                className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                onClick={() => openAjuste()}
                              >
                                <SlidersHorizontal className="size-3.5" />
                                Ajustar stock
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {productosEnInventario.length === 0 ? (
                        <div>
                          <p className="wizard-alta__hint">
                            {perms.canManageInventario
                              ? "El inventario está vacío. Carga el primer producto con su cantidad inicial."
                              : "No hay productos cargados en este inventario."}
                          </p>
                          <p className="wizard-alta__empty">
                            Sin productos cargados.
                          </p>
                        </div>
                      ) : (
                        <div
                          className={`wizard-alta__table-wrap${
                            productosEnInventario.length > 8
                              ? " wizard-alta__table-wrap--scroll"
                              : ""
                          }`}
                        >
                          <table className="wizard-alta__table">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Inicial</th>
                                <th>Vendido</th>
                                <th>Disponible</th>
                                {perms.canManageInventario && <th>Acciones</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {productosEnInventario.map((p) => {
                                const row = stockRow(p);
                                return (
                                  <tr key={p.id ?? p.producto_id}>
                                    <td>
                                      <span className="wizard-alta__table-name">
                                        {productoNombre(p.producto_id)}
                                      </span>
                                    </td>
                                    <td className="wizard-alta__table-muted">
                                      {row.inicial}
                                    </td>
                                    <td>
                                      <span className="wizard-alta__chip">
                                        {row.vendido}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className={`wizard-alta__status-pill ${
                                          row.disponible > 0
                                            ? "wizard-alta__status-pill--on"
                                            : "wizard-alta__status-pill--off"
                                        }`}
                                      >
                                        {row.disponible}
                                      </span>
                                    </td>
                                    {perms.canManageInventario && (
                                      <td>
                                        <button
                                          type="button"
                                          className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                          onClick={() =>
                                            openAjuste(p.producto_id)
                                          }
                                          disabled={submitting}
                                        >
                                          Ajustar
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  ) : (
                    <section className="wizard-alta__section">
                      <div className="wizard-alta__section-head">
                        <div>
                          <h3 className="wizard-alta__section-title">
                            Movimientos
                          </h3>
                          <p className="wizard-alta__section-sub">
                            Cargas, ventas y ajustes de la jornada
                          </p>
                        </div>
                      </div>

                      {movimientos.length === 0 ? (
                        <p className="wizard-alta__empty">
                          Sin movimientos registrados.
                        </p>
                      ) : (
                        <div
                          className={`wizard-alta__table-wrap${
                            movimientos.length > 8
                              ? " wizard-alta__table-wrap--scroll"
                              : ""
                          }`}
                        >
                          <table className="wizard-alta__table">
                            <thead>
                              <tr>
                                <th>Tipo</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Detalle</th>
                              </tr>
                            </thead>
                            <tbody>
                              {movimientos.map((m) => (
                                <tr key={m.id}>
                                  <td>
                                    <span className="wizard-alta__chip">
                                      {movimientoLabel(m)}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="wizard-alta__table-name">
                                      {productoNombre(m.producto_id)}
                                    </span>
                                  </td>
                                  <td className="wizard-alta__table-muted">
                                    {m.cantidad > 0 ? "+" : ""}
                                    {m.cantidad} ({m.cantidad_anterior} →{" "}
                                    {m.cantidad_nueva})
                                  </td>
                                  <td className="wizard-alta__table-muted">
                                    {[
                                      m.tipo === "VENTA" && m.sucursal_id
                                        ? `Sucursal ${sucursalNombre(m.sucursal_id)}`
                                        : null,
                                      m.cajaNombre
                                        ? `Caja ${m.cajaNombre}`
                                        : null,
                                      m.ventaId ? `Venta ${m.ventaId}` : null,
                                      m.motivo ? m.motivo : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ") || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={cargaOpen} onOpenChange={(open) => !open && closeCarga()}>
        <DialogContent className="wizard-alta wizard-alta__dialog !flex !max-w-[42rem] !flex-col !gap-0 !p-0">
          <div className="wizard-alta__dialog-head">
            <DialogHeader className="text-left">
              <DialogTitle className="wizard-alta__dialog-title">
                Cargar producto
              </DialogTitle>
              <DialogDescription className="wizard-alta__dialog-sub">
                Agrega un producto al inventario de{" "}
                {sucursalNombre(effectiveSucursalId)} con su cantidad inicial.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleCarga} className="wizard-alta__dialog-body">
            <div className="wizard-alta__dialog-fields">
              <Field label="Producto" htmlFor="cargaProducto">
                <NativeSelect
                  id="cargaProducto"
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  required
                >
                  <option value="">Selecciona producto</option>
                  {productosCatalogo.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Cantidad inicial" htmlFor="cargaCantidad">
                <Input
                  id="cargaCantidad"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cantidadInicial}
                  onChange={(e) => setCantidadInicial(e.target.value)}
                  required
                />
              </Field>
            </div>
            <div className="wizard-alta__footer">
              <button
                type="button"
                className="wizard-alta__btn wizard-alta__btn--secondary"
                onClick={closeCarga}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="wizard-alta__btn wizard-alta__btn--primary"
                disabled={submitting}
              >
                {submitting ? "Cargando…" : "Cargar producto"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={ajusteOpen} onOpenChange={(open) => !open && closeAjuste()}>
        <DialogContent className="wizard-alta wizard-alta__dialog !flex !max-w-[42rem] !flex-col !gap-0 !p-0">
          <div className="wizard-alta__dialog-head">
            <DialogHeader className="text-left">
              <DialogTitle className="wizard-alta__dialog-title">
                Ajustar stock
              </DialogTitle>
              <DialogDescription className="wizard-alta__dialog-sub">
                Entrada o salida de ajuste sobre productos ya cargados en{" "}
                {sucursalNombre(effectiveSucursalId)}.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleAjuste} className="wizard-alta__dialog-body">
            <div className="wizard-alta__dialog-fields">
              <Field label="Producto" htmlFor="ajusteProducto">
                <NativeSelect
                  id="ajusteProducto"
                  value={ajusteProductoId}
                  onChange={(e) => setAjusteProductoId(e.target.value)}
                  required
                >
                  <option value="">Selecciona producto</option>
                  {productosEnInventario.map((p) => (
                    <option key={p.id ?? p.producto_id} value={p.producto_id}>
                      {productoNombre(p.producto_id)} (disp.{" "}
                      {stockRow(p).disponible})
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Tipo de ajuste" htmlFor="ajusteDireccion">
                <NativeSelect
                  id="ajusteDireccion"
                  value={ajusteDireccion}
                  onChange={(e) =>
                    setAjusteDireccion(
                      e.target.value === "salida" ? "salida" : "entrada",
                    )
                  }
                  required
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </NativeSelect>
              </Field>
              <Field label="Cantidad" htmlFor="ajusteCantidad">
                <Input
                  id="ajusteCantidad"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1"
                  value={ajusteCantidad}
                  onChange={(e) => setAjusteCantidad(e.target.value)}
                  required
                />
              </Field>
              <Field label="Motivo (opcional)" htmlFor="ajusteMotivo">
                <Input
                  id="ajusteMotivo"
                  type="text"
                  maxLength={500}
                  placeholder="Ej. reposición, merma, corrección…"
                  value={ajusteMotivo}
                  onChange={(e) => setAjusteMotivo(e.target.value)}
                />
              </Field>
            </div>
            <div className="wizard-alta__footer">
              <button
                type="button"
                className="wizard-alta__btn wizard-alta__btn--secondary"
                onClick={closeAjuste}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="wizard-alta__btn wizard-alta__btn--primary"
                disabled={submitting}
              >
                {submitting ? "Aplicando…" : "Aplicar ajuste"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

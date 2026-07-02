"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import { useInventarioJornadaActiva, useJornadas } from "@/hooks/use-inventarios";
import { useProducts } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { useEquipoVendedores } from "@/hooks/use-equipo";
import { useAsignacionesCajas } from "@/hooks/use-asignaciones-cajas";
import { usePermissions } from "@/hooks/use-permissions";
import { buildJornadaId } from "@/lib/jornada";
import type { InventarioMovimiento, InventarioProducto } from "@/lib/types";

function stockRow(p: InventarioProducto) {
  const inicial = Number(p.cantidad_inicial ?? 0);
  const final = Number(p.cantidad_final ?? inicial);
  const vendido = Math.max(0, inicial - final);
  return { inicial, final, vendido, disponible: final };
}

function movimientoLabel(m: InventarioMovimiento) {
  if (m.tipo === "VENTA") return "Venta";
  if (m.tipo === "CARGA_INICIAL") return "Carga inicial";
  return "Ajuste";
}

export default function InventariosPage() {
  const perms = usePermissions();
  const { jornadaActiva, loading: jornadaLoading } = useJornadas();
  const {
    inventario,
    jornada,
    movimientos,
    loading,
    error,
    refetch,
    openInventarioJornadaActiva,
    upsertProducto,
  } = useInventarioJornadaActiva();
  const { products } = useProducts();
  const { sucursales } = useSucursales();
  const { vendedores } = useEquipoVendedores();
  const { saveAsignaciones, loading: savingAsignaciones } = useAsignacionesCajas();

  const [productoId, setProductoId] = useState("");
  const [cantidadInicial, setCantidadInicial] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSucursalId, setAssignSucursalId] = useState("");
  const [cajaVendedorMap, setCajaVendedorMap] = useState<Record<string, string>>({});

  const jornadaBanner = useMemo(() => {
    const fromApi = jornada;
    if (fromApi) return fromApi;
    const entries = Object.values(jornadaActiva);
    return entries.find((j) => j.activo) ?? entries[0];
  }, [jornada, jornadaActiva]);

  const productoNombre = (id: string) =>
    products.find((p) => p.id === id)?.nombre ?? id;

  const sucursalNombre = (id?: string | null) =>
    sucursales.find((s) => s.id === id)?.nombre ?? id ?? "—";

  const productosEnInventario = inventario?.productos ?? [];

  const jornadaId = useMemo(() => {
    if (inventario?.jornada_fecha && inventario.jornada_numero != null) {
      return buildJornadaId(inventario.jornada_fecha, inventario.jornada_numero);
    }
    if (jornadaBanner?.fecha && jornadaBanner.jornada != null) {
      return buildJornadaId(String(jornadaBanner.fecha), Number(jornadaBanner.jornada));
    }
    return null;
  }, [inventario, jornadaBanner]);

  const cajasSucursal = useMemo(
    () =>
      (sucursales.find((s) => s.id === assignSucursalId)?.cajas ?? []).filter(
        (c) => c.activo !== false,
      ),
    [sucursales, assignSucursalId],
  );

  const openAssignModal = (sucursalId?: string) => {
    const sid = sucursalId ?? sucursales[0]?.id ?? "";
    setAssignSucursalId(sid);
    const defaults: Record<string, string> = {};
    for (const v of vendedores.filter((v) => v.sucursalId === sid && v.cajaId)) {
      defaults[v.cajaId as string] = (v.uid ?? v.id) as string;
    }
    setCajaVendedorMap(defaults);
    setAssignOpen(true);
  };

  const handleOpen = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      await openInventarioJornadaActiva();
      if (perms.canManageInventario) {
        openAssignModal();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al abrir inventario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAsignaciones = async () => {
    if (!jornadaId || !assignSucursalId) return;
    setActionError(null);
    try {
      const asignaciones = cajasSucursal.map((caja) => ({
        cajaId: caja.id,
        vendedorUid: cajaVendedorMap[caja.id] || null,
      }));
      await saveAsignaciones(jornadaId, assignSucursalId, asignaciones);
      setAssignOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al guardar asignaciones");
    }
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
      setProductoId("");
      setCantidadInicial("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al cargar producto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole authenticated>
      <div className="bg-neutral-warm py-[var(--space-5)]">
        <div className="mx-auto max-w-[1100px] px-[var(--outer-gutter)]">
          <h1 className="mb-2">Inventario</h1>
          <p className="mb-8 text-[1.6rem] text-muted-foreground">
            {perms.isVendedor
              ? "Stock compartido de la concesión para la jornada activa."
              : "Gestiona el inventario compartido de tu concesión para la jornada activa."}
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Jornada activa</CardTitle>
            </CardHeader>
            <CardContent>
              {jornadaLoading && !jornadaBanner ? (
                <p className="text-[1.4rem] text-muted-foreground">Cargando jornada…</p>
              ) : jornadaBanner ? (
                <div className="grid gap-1 text-[1.4rem]">
                  <p>
                    <span className="font-medium">Jornada {jornadaBanner.jornada ?? "—"}</span>
                    {jornadaBanner.fecha ? ` · ${jornadaBanner.fecha}` : ""}
                    {jornadaBanner.hora ? ` · ${jornadaBanner.hora}` : ""}
                  </p>
                  {(jornadaBanner.equipo_local || jornadaBanner.equipo_visitante) && (
                    <p className="text-muted-foreground">
                      {jornadaBanner.equipo_local} vs {jornadaBanner.equipo_visitante}
                      {jornadaBanner.estadio ? ` · ${jornadaBanner.estadio}` : ""}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-destructive">No hay jornada activa configurada.</p>
              )}

              {perms.canManageInventario && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => void handleOpen()}
                    disabled={submitting || !jornadaBanner}
                  >
                    Abrir inventario de jornada
                  </Button>
                  {inventario && jornadaId && (
                    <Button variant="outline" onClick={() => openAssignModal()}>
                      Asignar cajeros a cajas
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {loading && <p>Cargando inventario…</p>}
          {error && <p className="text-destructive">{error}</p>}
          {actionError && <p className="mb-4 text-destructive">{actionError}</p>}

          {!loading && !inventario && jornadaBanner && (
            <p className="mb-6 text-[1.4rem] text-muted-foreground">
              {perms.canManageInventario
                ? "Aún no hay inventario para esta jornada. Usa el botón de arriba para abrirlo."
                : "El administrador aún no ha abierto el inventario de esta jornada."}
            </p>
          )}

          {inventario && (
            <>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Stock — {inventario.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  {productosEnInventario.length === 0 ? (
                    <p className="text-[1.4rem] text-muted-foreground">
                      Sin productos cargados.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[1.4rem]">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 pr-4">Producto</th>
                            <th className="py-2 pr-4">Inicial</th>
                            <th className="py-2 pr-4">Vendido</th>
                            <th className="py-2">Disponible</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosEnInventario.map((p) => {
                            const { inicial, vendido, disponible } = stockRow(p);
                            return (
                              <tr key={p.id ?? p.producto_id} className="border-b">
                                <td className="py-2 pr-4">
                                  {productoNombre(p.producto_id)}
                                </td>
                                <td className="py-2 pr-4">{inicial}</td>
                                <td className="py-2 pr-4">{vendido}</td>
                                <td className="py-2">{disponible}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {perms.canManageInventario && (
                    <form
                      onSubmit={handleCarga}
                      className="mt-6 grid gap-4 md:grid-cols-3"
                    >
                      <select
                        className="h-10 rounded-md border px-3 text-[1.4rem]"
                        value={productoId}
                        onChange={(e) => setProductoId(e.target.value)}
                        required
                      >
                        <option value="">Producto</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Cantidad inicial"
                        value={cantidadInicial}
                        onChange={(e) => setCantidadInicial(e.target.value)}
                        required
                      />
                      <Button type="submit" disabled={submitting}>
                        Cargar producto
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Movimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  {movimientos.length === 0 ? (
                    <p className="text-[1.4rem] text-muted-foreground">
                      Sin movimientos registrados.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {movimientos.map((m) => (
                        <li
                          key={m.id}
                          className="rounded-md border px-4 py-3 text-[1.4rem]"
                        >
                          <p className="font-medium">
                            {movimientoLabel(m)} · {productoNombre(m.producto_id)}
                          </p>
                          <p className="text-muted-foreground">
                            Cantidad: {m.cantidad > 0 ? "+" : ""}
                            {m.cantidad} ({m.cantidad_anterior} → {m.cantidad_nueva})
                            {m.tipo === "VENTA" && m.sucursal_id
                              ? ` · Sucursal ${sucursalNombre(m.sucursal_id)}`
                              : ""}
                            {m.cajaNombre ? ` · Caja ${m.cajaNombre}` : ""}
                            {m.ventaId ? ` · Venta ${m.ventaId}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          <Button variant="outline" onClick={() => refetch()} disabled={loading}>
            Actualizar
          </Button>
        </div>

        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Asignar cajeros a cajas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <select
                className="h-10 w-full rounded-md border px-3 text-[1.4rem]"
                value={assignSucursalId}
                onChange={(e) => {
                  setAssignSucursalId(e.target.value);
                  setCajaVendedorMap({});
                }}
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre ?? s.id}
                  </option>
                ))}
              </select>
              {cajasSucursal.length === 0 ? (
                <p className="text-[1.4rem] text-muted-foreground">
                  Esta sucursal no tiene cajas. Créalas en Sucursales.
                </p>
              ) : (
                cajasSucursal.map((caja) => (
                  <div key={caja.id} className="grid gap-2 md:grid-cols-2">
                    <span className="self-center text-[1.4rem] font-medium">
                      {caja.nombre ?? caja.id}
                    </span>
                    <select
                      className="h-10 rounded-md border px-3 text-[1.4rem]"
                      value={cajaVendedorMap[caja.id] ?? ""}
                      onChange={(e) =>
                        setCajaVendedorMap((prev) => ({
                          ...prev,
                          [caja.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Sin vendedor</option>
                      {vendedores
                        .filter((v) => v.sucursalId === assignSucursalId || !v.sucursalId)
                        .map((v) => (
                          <option key={v.id} value={v.uid ?? v.id}>
                            {v.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cerrar
              </Button>
              <Button
                disabled={savingAsignaciones || !jornadaId || cajasSucursal.length === 0}
                onClick={() => void handleSaveAsignaciones()}
              >
                {savingAsignaciones ? "Guardando…" : "Guardar asignaciones"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireRole>
  );
}

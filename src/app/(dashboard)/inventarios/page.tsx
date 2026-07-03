"use client";

import { useMemo, useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventarioJornadaActiva, useJornadas } from "@/hooks/use-inventarios";
import { useProducts } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { useConcessions } from "@/hooks/use-concessions";
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
  const { products } = useProducts();
  const { sucursales } = useSucursales();
  const { concessions } = useConcessions();
  const { saveAsignaciones, loading: savingAsignaciones } = useAsignacionesCajas();

  // Selección: SuperAdmin filtra por concesión y elige sucursal;
  // Admin elige sucursal de su concesión; Vendedor usa su sucursal asignada.
  const [concesionSel, setConcesionSel] = useState("");
  const [sucursalSel, setSucursalSel] = useState("");

  const sucursalesVisibles = useMemo(() => {
    if (perms.isSuperAdmin && concesionSel) {
      return sucursales.filter((s) => s.concesion_id === concesionSel);
    }
    return sucursales;
  }, [sucursales, perms.isSuperAdmin, concesionSel]);

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
  } = useInventarioJornadaActiva(effectiveSucursalId || undefined, {
    enabled: Boolean(effectiveSucursalId),
  });

  const equipoConcesionId = perms.isSuperAdmin
    ? sucursalActual?.concesion_id ?? concesionSel
    : undefined;
  const { vendedores } = useEquipoVendedores(equipoConcesionId || undefined, {
    enabled: !perms.isSuperAdmin || Boolean(equipoConcesionId),
  });

  const [productoId, setProductoId] = useState("");
  const [cantidadInicial, setCantidadInicial] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
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

  // Catálogo cargable: productos de la concesión de la sucursal seleccionada
  const productosCatalogo = useMemo(() => {
    const concesionId = sucursalActual?.concesion_id;
    if (perms.isSuperAdmin && concesionId) {
      return products.filter((p) => p.concesion_id === concesionId);
    }
    return products;
  }, [products, perms.isSuperAdmin, sucursalActual?.concesion_id]);

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
      (sucursalActual?.cajas ?? []).filter((c) => c.activo !== false),
    [sucursalActual],
  );

  const openAssignModal = () => {
    const defaults: Record<string, string> = {};
    for (const v of vendedores.filter(
      (v) => v.sucursalId === effectiveSucursalId && v.cajaId,
    )) {
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
    if (!jornadaId || !effectiveSucursalId) return;
    setActionError(null);
    try {
      const asignaciones = cajasSucursal.map((caja) => ({
        cajaId: caja.id,
        vendedorUid: cajaVendedorMap[caja.id] || null,
      }));
      await saveAsignaciones(jornadaId, effectiveSucursalId, asignaciones);
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
      <PageHeader
        title="Inventario"
        description={
          perms.canManageInventario
            ? "Gestiona el inventario por sucursal para la jornada activa."
            : perms.isVendedor
              ? "Stock de tu sucursal para la jornada activa."
              : "Consulta el inventario por sucursal (solo lectura)."
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        }
      />

      {!perms.isVendedor && (
        <div className="mb-6 flex flex-wrap gap-4">
          {perms.isSuperAdmin && (
            <div className="w-full max-w-xs">
              <Field label="Concesión" htmlFor="concesionSel">
                <NativeSelect
                  id="concesionSel"
                  value={concesionSel}
                  onChange={(e) => {
                    setConcesionSel(e.target.value);
                    setSucursalSel("");
                  }}
                >
                  <option value="">Todas las concesiones</option>
                  {concessions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          )}
          <div className="w-full max-w-xs">
            <Field label="Sucursal" htmlFor="sucursalSel">
              <NativeSelect
                id="sucursalSel"
                value={sucursalSel}
                onChange={(e) => setSucursalSel(e.target.value)}
              >
                <option value="">Selecciona sucursal</option>
                {sucursalesVisibles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre ?? s.id}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        </div>
      )}

      {!effectiveSucursalId ? (
        <p className="mb-6 text-[1.4rem] text-muted-foreground">
          {perms.isVendedor
            ? "Tu usuario no tiene una sucursal asignada. Contacta al administrador."
            : "Selecciona una sucursal para ver su inventario de jornada."}
        </p>
      ) : (
      <>
      <div className="dashboard-card mb-6 p-5">
        <h2 className="mb-3 text-[1.6rem] font-semibold">
          Jornada activa · {sucursalNombre(effectiveSucursalId)}
        </h2>
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
            <Button onClick={() => void handleOpen()} disabled={submitting || !jornadaBanner}>
              Abrir inventario de jornada
            </Button>
            {inventario && jornadaId && (
              <Button variant="outline" onClick={() => openAssignModal()}>
                Asignar cajeros a cajas
              </Button>
            )}
          </div>
        )}
      </div>

      {(error || actionError) && (
        <div className="mb-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
          {error ?? actionError}
        </div>
      )}

      {!loading && !inventario && jornadaBanner && (
        <p className="mb-6 text-[1.4rem] text-muted-foreground">
          {perms.canManageInventario
            ? "Aún no hay inventario para esta sucursal en la jornada. Usa el botón de arriba para abrirlo."
            : "Aún no se ha abierto el inventario de esta sucursal para la jornada."}
        </p>
      )}

      {inventario && (
        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="space-y-6">
            <DataTable<InventarioProducto>
              loading={loading}
              data={productosEnInventario}
              getRowKey={(p) => p.id ?? p.producto_id}
              emptyMessage="Sin productos cargados."
              columns={[
                {
                  key: "producto",
                  header: "Producto",
                  cell: (p) => productoNombre(p.producto_id),
                },
                {
                  key: "inicial",
                  header: "Inicial",
                  cell: (p) => stockRow(p).inicial,
                },
                {
                  key: "vendido",
                  header: "Vendido",
                  cell: (p) => stockRow(p).vendido,
                },
                {
                  key: "disponible",
                  header: "Disponible",
                  cell: (p) => stockRow(p).disponible,
                },
              ]}
            />

            {perms.canManageInventario && (
              <div className="dashboard-card p-5">
                <h3 className="mb-4 text-[1.5rem] font-semibold">Cargar producto</h3>
                <form onSubmit={handleCarga} className="grid gap-4 md:grid-cols-3">
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
                  <Button type="submit" disabled={submitting} className="self-end">
                    Cargar producto
                  </Button>
                </form>
              </div>
            )}
          </TabsContent>

          <TabsContent value="movimientos">
            {movimientos.length === 0 ? (
              <div className="dashboard-card p-8 text-center">
                <p className="text-[1.4rem] text-muted-foreground">
                  Sin movimientos registrados.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {movimientos.map((m) => (
                  <li
                    key={m.id}
                    className="dashboard-card rounded-[var(--card-radius)] px-4 py-3 text-[1.4rem]"
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
          </TabsContent>
        </Tabs>
      )}

        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Asignar cajeros · {sucursalNombre(effectiveSucursalId)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                    <NativeSelect
                      value={cajaVendedorMap[caja.id] ?? ""}
                      aria-label={`Vendedor para ${caja.nombre ?? caja.id}`}
                      onChange={(e) =>
                        setCajaVendedorMap((prev) => ({
                          ...prev,
                          [caja.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Sin vendedor</option>
                      {vendedores
                        .filter(
                          (v) =>
                            v.sucursalId === effectiveSucursalId || !v.sucursalId,
                        )
                        .map((v) => (
                          <option key={v.id} value={v.uid ?? v.id}>
                            {v.nombre}
                          </option>
                        ))}
                    </NativeSelect>
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
      </>
      )}
    </RequireRole>
  );
}

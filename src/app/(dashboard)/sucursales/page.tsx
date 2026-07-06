"use client";

import { useMemo, useEffect, useState, type FormEvent } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/ui/field";
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
import { Badge } from "@/components/ui/badge";
import { useSucursales } from "@/hooks/use-sucursales";
import { useZonas } from "@/hooks/use-zonas";
import { useConcessions } from "@/hooks/use-concessions";
import { useEquipoVendedores } from "@/hooks/use-equipo";
import { useConcesionFilterParam } from "@/hooks/use-concesion-filter-param";
import { useActiveConcesionOptional } from "@/hooks/use-active-concesion";
import { usePermissions } from "@/hooks/use-permissions";
import type { Caja, User } from "@/lib/types";

export default function SucursalesPage() {
  const perms = usePermissions();
  const activeCtx = useActiveConcesionOptional();
  const {
    sucursales,
    loading,
    error,
    refetch,
    createSucursal,
    createCaja,
    updateCaja,
    deleteCaja,
    deleteSucursal,
  } = useSucursales();
  const { zonas } = useZonas();
  const { concessions } = useConcessions();

  const [concesionFilter, setConcesionFilter] = useConcesionFilterParam();

  const {
    vendedores,
    assignVendedor,
    refetch: refetchEquipo,
  } = useEquipoVendedores(
    perms.isSuperAdmin ? concesionFilter || undefined : undefined,
    { enabled: !perms.isSuperAdmin || Boolean(concesionFilter) },
  );

  // Sucursal modal
  const [sucursalDialogOpen, setSucursalDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [zonaId, setZonaId] = useState("");
  const [sucursalConcesionId, setSucursalConcesionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cajas
  const [selectedSucursalId, setSelectedSucursalId] = useState("");
  const [cajaDialogOpen, setCajaDialogOpen] = useState(false);
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null);
  const [cajaNombre, setCajaNombre] = useState("");

  // Equipo
  const [equipoDialogOpen, setEquipoDialogOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignSucursalId, setAssignSucursalId] = useState("");
  const [assignCajaId, setAssignCajaId] = useState("");

  const zonaNombre = (id: string) =>
    zonas.find((z) => z.id === id)?.zona ?? id;

  const concesionNombre = (id: string) =>
    concessions.find((c) => c.id === id)?.nombre ?? id;

  const sucursalesVisibles = useMemo(() => {
    if (perms.isSuperAdmin && concesionFilter) {
      return sucursales.filter((s) => s.concesion_id === concesionFilter);
    }
    return sucursales;
  }, [sucursales, perms.isSuperAdmin, concesionFilter]);

  const selectedSucursal = sucursales.find((s) => s.id === selectedSucursalId);
  const cajasActivas = useMemo(
    () => (selectedSucursal?.cajas ?? []).filter((c) => c.activo !== false),
    [selectedSucursal],
  );

  const cajasDeAsignacion =
    sucursales.find((s) => s.id === assignSucursalId)?.cajas ?? [];

  useEffect(() => {
    if (sucursalesVisibles.length === 0) {
      setSelectedSucursalId("");
      return;
    }
    const stillVisible = sucursalesVisibles.some((s) => s.id === selectedSucursalId);
    if (!stillVisible) {
      setSelectedSucursalId(sucursalesVisibles[0].id);
    }
  }, [sucursalesVisibles, selectedSucursalId]);

  const equipoDeSucursal = useMemo(
    () =>
      vendedores.filter(
        (v) => !selectedSucursalId || v.sucursalId === selectedSucursalId,
      ),
    [vendedores, selectedSucursalId],
  );

  const closeSucursalDialog = () => {
    setSucursalDialogOpen(false);
    setNombre("");
    setZonaId("");
    setSucursalConcesionId("");
  };

  const handleCreateSucursal = async (e: FormEvent) => {
    e.preventDefault();
    const concesionId = perms.isSuperAdmin
      ? sucursalConcesionId || concesionFilter
      : perms.concesionId;
    if (!concesionId) {
      toast.error("Selecciona la concesión de la sucursal");
      return;
    }
    setSubmitting(true);
    try {
      await createSucursal(concesionId, zonaId, {
        sucursal: { nombre },
      });
      toast.success("Sucursal creada");
      closeSucursalDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear sucursal");
    } finally {
      setSubmitting(false);
    }
  };

  const openCajaCreate = () => {
    setEditingCaja(null);
    setCajaNombre("");
    setCajaDialogOpen(true);
  };

  const openCajaEdit = (caja: Caja) => {
    setEditingCaja(caja);
    setCajaNombre(caja.nombre ?? "");
    setCajaDialogOpen(true);
  };

  const handleCajaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSucursalId || !cajaNombre.trim()) return;
    setSubmitting(true);
    try {
      if (editingCaja) {
        await updateCaja(selectedSucursalId, editingCaja.id, {
          nombre: cajaNombre.trim(),
        });
        toast.success("Caja actualizada");
      } else {
        await createCaja(selectedSucursalId, cajaNombre.trim());
        toast.success("Caja creada");
      }
      setCajaDialogOpen(false);
      setCajaNombre("");
      setEditingCaja(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar caja");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignSucursalId) return;
    setSubmitting(true);
    try {
      await assignVendedor(assignUserId, assignSucursalId, assignCajaId || null);
      toast.success("Vendedor asignado");
      setEquipoDialogOpen(false);
      setAssignUserId("");
      setAssignCajaId("");
      await refetchEquipo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al asignar vendedor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole adminOrAbove>
      <PageHeader
        title="Sucursales"
        description={
          perms.canManageSucursales
            ? "1. Crea la sucursal → 2. Agrega cajas → 3. Asigna vendedores."
            : "Consulta las sucursales, cajas y equipo de tu concesión."
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
              void refetchEquipo();
            }}
          >
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
          {error}
        </div>
      )}

      {perms.isSuperAdmin && (
        <div className="mb-6 w-full max-w-xs">
          <Field label="Concesión" htmlFor="concesionFilter">
            <NativeSelect
              id="concesionFilter"
              value={concesionFilter}
              onChange={(e) => {
                const value = e.target.value;
                setConcesionFilter(value);
                activeCtx?.setActiveConcesionId(value || null);
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

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
        {/* Panel izquierdo: lista de sucursales */}
        <div className="dashboard-card flex flex-col p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-[1.6rem] font-semibold text-green-dark">
              Sucursales
            </h2>
            {perms.canManageSucursales &&
              (!perms.isSuperAdmin || Boolean(concesionFilter)) && (
                <Button size="sm" onClick={() => setSucursalDialogOpen(true)}>
                  <Plus className="size-4" />
                </Button>
              )}
          </div>

          {perms.isSuperAdmin && !concesionFilter ? (
            <p className="text-[1.3rem] text-muted-foreground">
              Selecciona una concesión arriba para ver sus sucursales.
            </p>
          ) : loading ? (
            <p className="text-[1.3rem] text-muted-foreground">Cargando…</p>
          ) : sucursalesVisibles.length === 0 ? (
            <p className="text-[1.3rem] text-muted-foreground">
              No hay sucursales. Crea la primera para continuar.
            </p>
          ) : (
            <ul className="space-y-1">
              {sucursalesVisibles.map((s) => {
                const isSelected = s.id === selectedSucursalId;
                const cajasCount = (s.cajas ?? []).filter(
                  (c) => c.activo !== false,
                ).length;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedSucursalId(s.id)}
                      className={`w-full rounded-[8px] px-3 py-3 text-left transition-colors ${
                        isSelected
                          ? "bg-green-soft text-green-dark"
                          : "hover:bg-neutral-cool"
                      }`}
                    >
                      <p className="text-[1.4rem] font-medium">
                        {s.nombre ?? s.id}
                      </p>
                      <p className="text-[1.2rem] text-muted-foreground">
                        {zonaNombre(s.zona_id)} · {cajasCount} caja(s)
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Panel derecho: detalle sucursal → cajas + equipo */}
        <div className="space-y-6">
          {!selectedSucursal ? (
            <div className="dashboard-card p-8 text-center">
              <p className="text-[1.4rem] text-muted-foreground">
                Selecciona una sucursal para administrar cajas y equipo.
              </p>
            </div>
          ) : (
            <>
              <div className="dashboard-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[1.8rem] font-semibold text-green-dark">
                      {selectedSucursal.nombre ?? selectedSucursal.id}
                    </h2>
                    <p className="mt-1 text-[1.3rem] text-muted-foreground">
                      Zona: {zonaNombre(selectedSucursal.zona_id)}
                      {perms.isSuperAdmin &&
                        ` · ${concesionNombre(selectedSucursal.concesion_id)}`}
                    </p>
                  </div>
                  {perms.canManageSucursales && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void deleteSucursal(selectedSucursal.id)}
                    >
                      Desactivar sucursal
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[1.6rem] font-semibold text-green-dark">
                    Paso 2 · Cajas
                  </h3>
                  {perms.canManageSucursales && (
                    <Button size="sm" onClick={openCajaCreate}>
                      <Plus className="size-4" />
                      Agregar caja
                    </Button>
                  )}
                </div>
                <DataTable<Caja>
                  loading={loading}
                  data={cajasActivas}
                  getRowKey={(c) => c.id}
                  emptyMessage="Sin cajas. Agrega la primera caja de esta sucursal."
                  columns={[
                    {
                      key: "nombre",
                      header: "Nombre",
                      cell: (c) => c.nombre ?? c.id,
                    },
                    {
                      key: "estado",
                      header: "Estado",
                      cell: (c) => (
                        <Badge
                          variant={c.activo !== false ? "default" : "secondary"}
                        >
                          {c.activo !== false ? "Activa" : "Inactiva"}
                        </Badge>
                      ),
                    },
                    ...(perms.canManageSucursales
                      ? [
                          {
                            key: "acciones",
                            header: "Acciones",
                            cell: (c: Caja) => (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openCajaEdit(c)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    void deleteCaja(selectedSucursalId, c.id)
                                  }
                                >
                                  Desactivar
                                </Button>
                              </div>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[1.6rem] font-semibold text-green-dark">
                    Paso 3 · Equipo en esta sucursal
                  </h3>
                  {perms.canManageEquipo &&
                    (!perms.isSuperAdmin || Boolean(concesionFilter)) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setAssignSucursalId(selectedSucursalId);
                          setEquipoDialogOpen(true);
                        }}
                      >
                        <Plus className="size-4" />
                        Asignar vendedor
                      </Button>
                    )}
                </div>
                {perms.isSuperAdmin && !concesionFilter ? (
                  <div className="dashboard-card p-6 text-center">
                    <p className="text-[1.4rem] text-muted-foreground">
                      Selecciona una concesión para asignar equipo.
                    </p>
                  </div>
                ) : (
                  <DataTable<User>
                    loading={false}
                    data={equipoDeSucursal}
                    getRowKey={(v) => v.id}
                    emptyMessage="No hay vendedores asignados a esta sucursal."
                    columns={[
                      { key: "nombre", header: "Nombre", cell: (v) => v.nombre },
                      { key: "email", header: "Email", cell: (v) => v.email },
                      {
                        key: "caja",
                        header: "Caja",
                        cell: (v) => {
                          if (!v.cajaId) return "—";
                          return (
                            selectedSucursal.cajas?.find((c) => c.id === v.cajaId)
                              ?.nombre ?? v.cajaId
                          );
                        },
                      },
                    ]}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal sucursal */}
      <Dialog
        open={sucursalDialogOpen}
        onOpenChange={(open) => !open && closeSucursalDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva sucursal</DialogTitle>
            <DialogDescription>
              Paso 1: crea el punto de venta sobre una zona del estadio.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => void handleCreateSucursal(e)}
            className="grid gap-4"
          >
            {perms.isSuperAdmin && (
              <Field label="Concesión" htmlFor="sucursalConcesion">
                <NativeSelect
                  id="sucursalConcesion"
                  value={sucursalConcesionId || concesionFilter}
                  onChange={(e) => setSucursalConcesionId(e.target.value)}
                  required
                >
                  <option value="">Selecciona concesión</option>
                  {concessions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <Field label="Nombre" htmlFor="nombre">
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de sucursal"
                required
              />
            </Field>
            <Field label="Zona" htmlFor="zona">
              <NativeSelect
                id="zona"
                value={zonaId}
                onChange={(e) => setZonaId(e.target.value)}
                required
              >
                <option value="">Selecciona zona</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zona}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeSucursalDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal caja */}
      <Dialog
        open={cajaDialogOpen}
        onOpenChange={(open) => !open && setCajaDialogOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCaja ? "Editar caja" : "Nueva caja"}
            </DialogTitle>
            <DialogDescription>
              Paso 2: agrega cajas a la sucursal seleccionada.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => void handleCajaSubmit(e)}
            className="grid gap-4"
          >
            <Field label="Nombre" htmlFor="cajaNombre">
              <Input
                id="cajaNombre"
                value={cajaNombre}
                onChange={(e) => setCajaNombre(e.target.value)}
                placeholder="Nombre de la caja"
                required
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCajaDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : editingCaja ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal equipo */}
      <Dialog
        open={equipoDialogOpen}
        onOpenChange={(open) => !open && setEquipoDialogOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar vendedor</DialogTitle>
            <DialogDescription>
              Paso 3: vincula un vendedor a sucursal y caja.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleAssign(e)} className="grid gap-4">
            <Field label="Vendedor" htmlFor="vendedor">
              <NativeSelect
                id="vendedor"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                required
              >
                <option value="">Selecciona vendedor</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.uid ?? v.id}>
                    {v.nombre} ({v.email})
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Sucursal" htmlFor="asigSuc">
              <NativeSelect
                id="asigSuc"
                value={assignSucursalId}
                onChange={(e) => {
                  setAssignSucursalId(e.target.value);
                  setAssignCajaId("");
                }}
                required
              >
                <option value="">Selecciona sucursal</option>
                {sucursalesVisibles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre ?? s.id}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Caja" htmlFor="asigCaja" hint="Opcional">
              <NativeSelect
                id="asigCaja"
                value={assignCajaId}
                onChange={(e) => setAssignCajaId(e.target.value)}
              >
                <option value="">Sin caja</option>
                {cajasDeAsignacion
                  .filter((c) => c.activo !== false)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre ?? c.id}
                    </option>
                  ))}
              </NativeSelect>
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEquipoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : "Asignar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

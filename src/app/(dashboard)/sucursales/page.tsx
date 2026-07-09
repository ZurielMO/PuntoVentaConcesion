"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Power,
  PowerOff,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RequireRole } from "@/components/auth/require-role";
import { useSucursales } from "@/hooks/use-sucursales";
import { useZonas } from "@/hooks/use-zonas";
import { useConcessions } from "@/hooks/use-concessions";
import { useEquipoVendedores } from "@/hooks/use-equipo";
import { useConcesionFilterParam } from "@/hooks/use-concesion-filter-param";
import { useSucursalDeepLink } from "@/hooks/use-deep-link-params";
import { useActiveConcesionOptional } from "@/hooks/use-active-concesion";
import { usePermissions } from "@/hooks/use-permissions";
import type { Caja, User } from "@/lib/types";
import "@/styles/wizard-alta.css";

/** Máximo de cajas por sucursal (activas + desactivadas), igual que el asistente. */
const MAX_CAJAS = 3;

/** Número corto para el badge del menú (p. ej. "Caja 2" → "2"). */
function cajaBadgeNumber(nombre: string | undefined, fallbackIndex: number): string {
  const match = (nombre ?? "").match(/(\d+)/);
  return match?.[1] ?? String(fallbackIndex + 1);
}

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
    updateSucursal,
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

  const [sucursalDialogOpen, setSucursalDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [zonaId, setZonaId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [cajaDialogOpen, setCajaDialogOpen] = useState(false);
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null);
  const [cajaNombre, setCajaNombre] = useState("");

  const zonaNombre = (id: string) =>
    zonas.find((z) => z.id === id)?.zona ?? id;

  const concesionNombre = (id: string) =>
    concessions.find((c) => c.id === id)?.nombre ?? id;

  const sucursalesVisibles = useMemo(() => {
    if (perms.isSuperAdmin) {
      if (!concesionFilter) return [];
      return sucursales.filter((s) => s.concesion_id === concesionFilter);
    }
    return sucursales;
  }, [sucursales, perms.isSuperAdmin, concesionFilter]);

  const visibleSucursalIds = useMemo(
    () => sucursalesVisibles.map((s) => s.id),
    [sucursalesVisibles],
  );

  const {
    selectedSucursalId,
    setSelectedSucursalId,
    detailTab,
    setDetailTab,
  } = useSucursalDeepLink(visibleSucursalIds);

  const selectedSucursal = sucursalesVisibles.find(
    (s) => s.id === selectedSucursalId,
  );
  const cajasDeSucursal = selectedSucursal?.cajas ?? [];
  const puedeAgregarCaja = cajasDeSucursal.length < MAX_CAJAS;
  const sucursalActiva = selectedSucursal?.activo !== false;

  const equipoDeSucursal = useMemo(
    () =>
      vendedores.filter(
        (v) => !selectedSucursalId || v.sucursalId === selectedSucursalId,
      ),
    [vendedores, selectedSucursalId],
  );

  const cajasActivasSucursal = useMemo(
    () => cajasDeSucursal.filter((c) => c.activo !== false),
    [cajasDeSucursal],
  );

  /** Cajas activas libres de la sucursal seleccionada. 1 vendedor por caja. */
  const cajasLibresSucursal = useMemo(
    () =>
      cajasActivasSucursal.filter(
        (c) =>
          !vendedores.some(
            (v) => v.cajaId === c.id && v.activo !== false,
          ),
      ),
    [cajasActivasSucursal, vendedores],
  );

  const cajasConVendedorCount = useMemo(
    () =>
      cajasActivasSucursal.filter((c) =>
        equipoDeSucursal.some(
          (v) => v.cajaId === c.id && v.activo !== false,
        ),
      ).length,
    [cajasActivasSucursal, equipoDeSucursal],
  );

  const equipoCompleto =
    cajasActivasSucursal.length > 0 &&
    cajasConVendedorCount >= cajasActivasSucursal.length;
  const puedeAsignarVendedor = sucursalActiva && !equipoCompleto;

  const nextStepHint = (() => {
    if (!selectedSucursal) return null;
    if (!sucursalActiva) {
      return "Sucursal desactivada. Reactívala para agregar cajas o asignar vendedores.";
    }
    if (detailTab === "cajas") {
      if (cajasDeSucursal.length === 0) {
        return "Agrega al menos una caja (máx. 3).";
      }
      if (cajasDeSucursal.length < MAX_CAJAS) {
        return `Puedes agregar hasta ${MAX_CAJAS} cajas. Luego asigna vendedores en Equipo.`;
      }
      return "Máximo de cajas alcanzado. Ve a Equipo para asignar vendedores.";
    }
    if (cajasDeSucursal.length === 0) {
      return "Primero agrega cajas en la pestaña Cajas.";
    }
    if (!equipoCompleto) {
      return "Asigna cada caja activa a un vendedor.";
    }
    return "Equipo completo. Puedes liberar o reasignar cuando haga falta.";
  })();

  const setConcesion = (value: string) => {
    setConcesionFilter(value);
    activeCtx?.setActiveConcesionId(value || null);
  };

  const closeSucursalDialog = () => {
    setSucursalDialogOpen(false);
    setNombre("");
    setZonaId("");
  };

  const openCreateSucursal = () => {
    if (perms.isSuperAdmin && !concesionFilter) {
      toast.error("Selecciona una concesión primero");
      return;
    }
    setSucursalDialogOpen(true);
  };

  const handleCreateSucursal = async (e: FormEvent) => {
    e.preventDefault();
    const concesionId = perms.isSuperAdmin
      ? concesionFilter
      : perms.concesionId;
    if (!concesionId) {
      toast.error("Selecciona una concesión primero");
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
      toast.error(
        err instanceof Error ? err.message : "Error al crear sucursal",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openCajaCreate = () => {
    if (!sucursalActiva) {
      toast.error("Reactiva la sucursal para agregar cajas");
      return;
    }
    if (!puedeAgregarCaja) {
      toast.error(`Máximo ${MAX_CAJAS} cajas por sucursal`);
      return;
    }
    setEditingCaja(null);
    setCajaNombre(`Caja ${cajasDeSucursal.length + 1}`);
    setCajaDialogOpen(true);
  };

  const handleToggleCajaActivo = async (caja: Caja) => {
    if (!selectedSucursalId) return;
    const activar = caja.activo === false;
    try {
      if (activar) {
        await updateCaja(selectedSucursalId, caja.id, { activo: true });
        toast.success("Caja reactivada");
      } else {
        await deleteCaja(selectedSucursalId, caja.id);
        toast.success("Caja desactivada");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : activar
            ? "Error al reactivar caja"
            : "Error al desactivar caja",
      );
    }
  };

  const handleToggleSucursalActivo = async () => {
    if (!selectedSucursal) return;
    const activar = selectedSucursal.activo === false;
    try {
      if (activar) {
        await updateSucursal(selectedSucursal.id, { activo: true });
        toast.success("Sucursal reactivada");
      } else {
        await deleteSucursal(selectedSucursal.id);
        toast.success("Sucursal desactivada");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : activar
            ? "Error al reactivar sucursal"
            : "Error al desactivar sucursal",
      );
    }
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

  const handleAsignarCajaInline = async (v: User, cajaId: string) => {
    const userId = v.uid ?? v.id;
    const sucursalId = v.sucursalId ?? selectedSucursalId;
    if (!userId || !sucursalId || !cajaId) return;

    if (!puedeAsignarVendedor) {
      toast.error(
        equipoCompleto
          ? "Todas las cajas ya tienen vendedor asignado"
          : "Reactiva la sucursal para asignar cajas",
      );
      return;
    }

    const ocupada = vendedores.find(
      (other) =>
        other.cajaId === cajaId &&
        (other.uid ?? other.id) !== userId &&
        other.activo !== false,
    );
    if (ocupada) {
      toast.error(
        `Esta caja ya está asignada a ${ocupada.nombre}. Solo 1 vendedor por caja.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await assignVendedor(userId, sucursalId, cajaId);
      toast.success("Caja asignada");
      await refetchEquipo();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al asignar caja",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLiberarCaja = async (v: User) => {
    const userId = v.uid ?? v.id;
    const sucursalId = v.sucursalId ?? selectedSucursalId;
    if (!userId || !sucursalId || !v.cajaId) return;

    setSubmitting(true);
    try {
      await assignVendedor(userId, sucursalId, null);
      toast.success("Caja liberada");
      await refetchEquipo();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al liberar caja",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canCreateSucursal =
    perms.canManageSucursales &&
    (!perms.isSuperAdmin || Boolean(concesionFilter));

  const canAssignEquipo =
    perms.canManageEquipo &&
    (!perms.isSuperAdmin || Boolean(concesionFilter));

  const showSidebarContent = !(perms.isSuperAdmin && !concesionFilter);

  return (
    <RequireRole adminOrAbove>
      <div className="wizard-alta wizard-alta__shell wizard-alta__shell--fill">
        <header className="wizard-alta__hero">
          <div className="wizard-alta__hero-inner">
            <div>
              <h1>Sucursales y cajas</h1>
              <p>
                {perms.canManageSucursales
                  ? "Puntos de venta, cajas y asignación de vendedores."
                  : "Consulta sucursales, cajas y equipo de tu concesión."}
              </p>
            </div>
            <div className="wizard-alta__hero-actions">
              <button
                type="button"
                className="wizard-alta__exit"
                onClick={() => {
                  void refetch();
                  void refetchEquipo();
                }}
              >
                <RefreshCw className="size-4" />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
            {error}
          </div>
        )}

        <div className="wizard-alta__layout">
          <aside className="wizard-alta__sidebar">
            {perms.isSuperAdmin && (
              <div className="wizard-alta__sidebar-filter">
                <Field label="1) Elige concesión" htmlFor="concesionFilter">
                  <NativeSelect
                    id="concesionFilter"
                    value={concesionFilter}
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

            {!showSidebarContent ? (
              <p className="wizard-alta__empty">
                Primero elige la concesión. Después podrás crear o elegir sus
                sucursales.
              </p>
            ) : (
              <>
                {canCreateSucursal && (
                  <button
                    type="button"
                    className="wizard-alta__btn wizard-alta__btn--primary w-full"
                    onClick={openCreateSucursal}
                  >
                    <Plus className="size-4" />
                    Nueva sucursal
                  </button>
                )}

                <div className="wizard-alta__sidebar-head mt-2">
                  <h2 className="wizard-alta__sidebar-title">Sucursales</h2>
                </div>

                {loading ? (
                  <p className="wizard-alta__empty">Cargando…</p>
                ) : sucursalesVisibles.length === 0 ? (
                  <p className="wizard-alta__empty">
                    Aún no hay sucursales. Pulsa{" "}
                    <strong>Nueva sucursal</strong> para crear la primera.
                  </p>
                ) : (
                  <ul className="wizard-alta__sidebar-list">
                    {sucursalesVisibles.map((s) => {
                      const isSelected = s.id === selectedSucursalId;
                      const cajasCount = (s.cajas ?? []).length;
                      const desactivada = s.activo === false;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedSucursalId(s.id)}
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
                              {desactivada && (
                                <span className="wizard-alta__status-pill wizard-alta__status-pill--off">
                                  Desactivada
                                </span>
                              )}
                            </div>
                            <p className="wizard-alta__sidebar-item-meta">
                              {zonaNombre(s.zona_id)} · {cajasCount}/{MAX_CAJAS}{" "}
                              caja(s)
                            </p>
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
            {perms.isSuperAdmin && !concesionFilter ? (
              <div className="wizard-alta__panel-body">
                <p className="wizard-alta__hint">
                  1) Elige la concesión a la izquierda → 2) Pulsa{" "}
                  <strong>Nueva sucursal</strong> → 3) Agrega cajas → 4) Asigna
                  vendedores.
                </p>
                <p className="wizard-alta__empty">
                  Selecciona una concesión para ver sus sucursales.
                </p>
              </div>
            ) : !selectedSucursal ? (
              <div className="wizard-alta__panel-body">
                <p className="wizard-alta__hint">
                  Elige una sucursal a la izquierda o pulsa{" "}
                  <strong>Nueva sucursal</strong> para crear la primera.
                </p>
                <p className="wizard-alta__empty">
                  Cuando haya una sucursal, aquí administrarás cajas y equipo.
                </p>
                {canCreateSucursal && !loading && (
                  <button
                    type="button"
                    className="wizard-alta__btn wizard-alta__btn--primary mt-3"
                    onClick={openCreateSucursal}
                  >
                    <Plus className="size-4" />
                    Crear sucursal
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="wizard-alta__panel-head">
                  <div className="wizard-alta__identity">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="wizard-alta__panel-title">
                          {selectedSucursal.nombre ?? selectedSucursal.id}
                        </h2>
                        <span
                          className={`wizard-alta__status-pill ${
                            sucursalActiva
                              ? "wizard-alta__status-pill--on"
                              : "wizard-alta__status-pill--off"
                          }`}
                        >
                          {sucursalActiva ? "Activa" : "Desactivada"}
                        </span>
                      </div>
                      <p className="wizard-alta__panel-sub">
                        Zona: {zonaNombre(selectedSucursal.zona_id)}
                        {perms.isSuperAdmin &&
                          ` · ${concesionNombre(selectedSucursal.concesion_id)}`}
                        {` · ${cajasActivasSucursal.length} caja(s) activa(s) · ${equipoDeSucursal.length} vendedor(es)`}
                      </p>
                    </div>
                    {perms.canManageSucursales &&
                      (sucursalActiva ? (
                        <button
                          type="button"
                          className="wizard-alta__btn wizard-alta__btn--danger wizard-alta__btn--sm"
                          onClick={() => void handleToggleSucursalActivo()}
                        >
                          <PowerOff className="size-4" />
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                          onClick={() => void handleToggleSucursalActivo()}
                        >
                          <Power className="size-4" />
                          Reactivar
                        </button>
                      ))}
                  </div>

                  <nav
                    className="wizard-alta__panel-tabs"
                    aria-label="Secciones de la sucursal"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={detailTab === "equipo"}
                      className={`wizard-alta__panel-tab${
                        detailTab === "equipo"
                          ? " wizard-alta__panel-tab--active"
                          : ""
                      }`}
                      onClick={() => setDetailTab("equipo")}
                    >
                      Equipo
                      <span className="wizard-alta__panel-tab-count">
                        {cajasConVendedorCount}/
                        {cajasActivasSucursal.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={detailTab === "cajas"}
                      className={`wizard-alta__panel-tab${
                        detailTab === "cajas"
                          ? " wizard-alta__panel-tab--active"
                          : ""
                      }`}
                      onClick={() => setDetailTab("cajas")}
                    >
                      Cajas
                      <span className="wizard-alta__panel-tab-count">
                        {cajasDeSucursal.length}/{MAX_CAJAS}
                      </span>
                    </button>
                  </nav>
                </div>

                <div className="wizard-alta__panel-body wizard-alta__panel-body--stack">
                  {nextStepHint && (
                    <p className="wizard-alta__hint">{nextStepHint}</p>
                  )}

                  {detailTab === "equipo" ? (
                    <section className="wizard-alta__section">
                      <div className="wizard-alta__section-head">
                        <div>
                          <h3 className="wizard-alta__section-title">Equipo</h3>
                          <p className="wizard-alta__section-sub">
                            1 vendedor por caja activa ·{" "}
                            {cajasConVendedorCount}/
                            {cajasActivasSucursal.length || 0} asignadas
                          </p>
                        </div>
                      </div>

                      {equipoDeSucursal.length === 0 ? (
                        <p className="wizard-alta__empty">
                          Nadie en el equipo de esta sucursal. Asigna vendedores
                          desde Usuarios y luego elige una caja libre en la
                          tabla.
                        </p>
                      ) : (
                        <div
                          className={`wizard-alta__table-wrap${
                            equipoDeSucursal.length > 6
                              ? " wizard-alta__table-wrap--scroll"
                              : ""
                          }`}
                        >
                          <table className="wizard-alta__table">
                            <thead>
                              <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Caja</th>
                                {canAssignEquipo && (
                                  <th className="wizard-alta__table-actions-col">
                                    Acciones
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {equipoDeSucursal.map((v: User) => {
                                const cajaNombreAsignada = v.cajaId
                                  ? (selectedSucursal.cajas?.find(
                                      (c) => c.id === v.cajaId,
                                    )?.nombre ?? v.cajaId)
                                  : "Sin caja";
                                const activo = v.activo !== false;
                                const puedeAsignarFila =
                                  canAssignEquipo &&
                                  activo &&
                                  !v.cajaId &&
                                  puedeAsignarVendedor &&
                                  cajasLibresSucursal.length > 0;
                                return (
                                  <tr
                                    key={v.id}
                                    className={
                                      activo
                                        ? undefined
                                        : "wizard-alta__table-row--off"
                                    }
                                  >
                                    <td>
                                      <span className="wizard-alta__table-name">
                                        {v.nombre}
                                      </span>
                                    </td>
                                    <td className="wizard-alta__table-muted">
                                      {v.email}
                                    </td>
                                    <td>
                                      <span className="wizard-alta__chip">
                                        {cajaNombreAsignada}
                                      </span>
                                    </td>
                                    {canAssignEquipo && (
                                      <td className="wizard-alta__table-actions-col">
                                        <div className="wizard-alta__table-actions">
                                          {v.cajaId ? (
                                            <button
                                              type="button"
                                              className="wizard-alta__btn wizard-alta__btn--danger wizard-alta__btn--sm"
                                              onClick={() =>
                                                void handleLiberarCaja(v)
                                              }
                                              disabled={submitting}
                                              title="Liberar caja del vendedor"
                                            >
                                              <Unlock className="size-3.5" />
                                              Liberar caja
                                            </button>
                                          ) : puedeAsignarFila ? (
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <button
                                                  type="button"
                                                  className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                                  disabled={submitting}
                                                  aria-label={`Asignar caja a ${v.nombre}`}
                                                  title="Asignar caja libre"
                                                >
                                                  <Plus className="size-3.5" />
                                                  Asignar
                                                </button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent
                                                align="end"
                                                sideOffset={8}
                                                className="wizard-alta wizard-alta__assign-menu"
                                              >
                                                <DropdownMenuLabel className="wizard-alta__assign-menu-label">
                                                  Elegir caja
                                                </DropdownMenuLabel>
                                                {cajasLibresSucursal.length ===
                                                0 ? (
                                                  <div
                                                    className="wizard-alta__assign-menu-empty"
                                                    role="status"
                                                  >
                                                    No hay cajas libres
                                                  </div>
                                                ) : (
                                                  cajasLibresSucursal.map(
                                                    (c, idx) => (
                                                      <DropdownMenuItem
                                                        key={c.id}
                                                        disabled={submitting}
                                                        className="wizard-alta__assign-menu-item"
                                                        onSelect={() => {
                                                          void handleAsignarCajaInline(
                                                            v,
                                                            c.id,
                                                          );
                                                        }}
                                                      >
                                                        <span
                                                          className="wizard-alta__assign-menu-badge"
                                                          aria-hidden
                                                        >
                                                          {cajaBadgeNumber(
                                                            c.nombre,
                                                            idx,
                                                          )}
                                                        </span>
                                                        <span className="wizard-alta__assign-menu-item-text">
                                                          {c.nombre ?? c.id}
                                                        </span>
                                                      </DropdownMenuItem>
                                                    ),
                                                  )
                                                )}
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          ) : (
                                            <button
                                              type="button"
                                              className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                              disabled
                                              title={
                                                !sucursalActiva
                                                  ? "Reactiva la sucursal para asignar cajas"
                                                  : equipoCompleto ||
                                                      cajasLibresSucursal.length ===
                                                        0
                                                    ? "No hay cajas libres"
                                                    : !activo
                                                      ? "Vendedor inactivo"
                                                      : "No se puede asignar"
                                              }
                                            >
                                              <Plus className="size-3.5" />
                                              Asignar
                                            </button>
                                          )}
                                        </div>
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
                          <h3 className="wizard-alta__section-title">Cajas</h3>
                          <p className="wizard-alta__section-sub">
                            Máximo {MAX_CAJAS} por sucursal
                          </p>
                        </div>
                        {perms.canManageSucursales && (
                          <button
                            type="button"
                            className="wizard-alta__btn wizard-alta__btn--primary wizard-alta__btn--sm"
                            onClick={openCajaCreate}
                            disabled={!puedeAgregarCaja || !sucursalActiva}
                            title={
                              !sucursalActiva
                                ? "Reactiva la sucursal para agregar cajas"
                                : puedeAgregarCaja
                                  ? undefined
                                  : `Máximo ${MAX_CAJAS} cajas por sucursal`
                            }
                          >
                            <Plus className="size-4" />
                            Agregar caja ({cajasDeSucursal.length}/{MAX_CAJAS})
                          </button>
                        )}
                      </div>

                      {cajasDeSucursal.length === 0 ? (
                        <p className="wizard-alta__empty">
                          Sin cajas. Pulsa <strong>Agregar caja</strong> para
                          crear la primera.
                        </p>
                      ) : (
                        <div
                          className={`wizard-alta__table-wrap${
                            cajasDeSucursal.length > 5
                              ? " wizard-alta__table-wrap--scroll"
                              : ""
                          }`}
                        >
                          <table className="wizard-alta__table">
                            <thead>
                              <tr>
                                <th>Nombre</th>
                                <th>Estado</th>
                                {perms.canManageSucursales && (
                                  <th className="wizard-alta__table-actions-col">
                                    Acciones
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {cajasDeSucursal.map((c) => {
                                const activa = c.activo !== false;
                                return (
                                  <tr
                                    key={c.id}
                                    className={
                                      activa
                                        ? undefined
                                        : "wizard-alta__table-row--off"
                                    }
                                  >
                                    <td>
                                      <span className="wizard-alta__table-name">
                                        {c.nombre ?? c.id}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className={`wizard-alta__status-pill ${
                                          activa
                                            ? "wizard-alta__status-pill--on"
                                            : "wizard-alta__status-pill--off"
                                        }`}
                                      >
                                        {activa ? "Activa" : "Desactivada"}
                                      </span>
                                    </td>
                                    {perms.canManageSucursales && (
                                      <td className="wizard-alta__table-actions-col">
                                        <div className="wizard-alta__table-actions">
                                          <button
                                            type="button"
                                            className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                            onClick={() => openCajaEdit(c)}
                                          >
                                            <Pencil className="size-3.5" />
                                            Editar
                                          </button>
                                          {activa ? (
                                            <button
                                              type="button"
                                              className="wizard-alta__btn wizard-alta__btn--danger wizard-alta__btn--sm"
                                              onClick={() =>
                                                void handleToggleCajaActivo(c)
                                              }
                                            >
                                              <PowerOff className="size-3.5" />
                                              Desactivar
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                              onClick={() =>
                                                void handleToggleCajaActivo(c)
                                              }
                                            >
                                              <Power className="size-3.5" />
                                              Reactivar
                                            </button>
                                          )}
                                        </div>
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
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={sucursalDialogOpen}
        onOpenChange={(open) => !open && closeSucursalDialog()}
      >
        <DialogContent className="wizard-alta wizard-alta__dialog !max-w-[42rem] !gap-0 !p-0">
          <div className="wizard-alta__dialog-head">
            <DialogHeader className="text-left">
              <DialogTitle className="wizard-alta__dialog-title">
                Nueva sucursal
              </DialogTitle>
              <DialogDescription className="wizard-alta__dialog-sub">
                {perms.isSuperAdmin && concesionFilter
                  ? `Punto de venta de ${concesionNombre(concesionFilter)}. Elige zona y un nombre claro.`
                  : "Define el punto de venta físico dentro del estadio (ej. Norte)."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <form
            onSubmit={(e) => void handleCreateSucursal(e)}
            className="wizard-alta__dialog-body"
          >
            <div className="wizard-alta__dialog-fields">
              <Field label="Nombre de sucursal" htmlFor="nombre">
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Punto Norte"
                  required
                />
              </Field>
              <Field label="Zona del estadio" htmlFor="zona">
                <NativeSelect
                  id="zona"
                  value={zonaId}
                  onChange={(e) => setZonaId(e.target.value)}
                  required
                >
                  <option value="">Selecciona zona</option>
                  {zonas
                    .filter((z) => z.activo !== false)
                    .map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.zona}
                      </option>
                    ))}
                </NativeSelect>
              </Field>
            </div>
            <div className="wizard-alta__footer">
              <button
                type="button"
                className="wizard-alta__btn wizard-alta__btn--secondary"
                onClick={closeSucursalDialog}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="wizard-alta__btn wizard-alta__btn--primary"
                disabled={submitting}
              >
                {submitting ? "Guardando…" : "Crear sucursal"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cajaDialogOpen}
        onOpenChange={(open) => !open && setCajaDialogOpen(false)}
      >
        <DialogContent className="wizard-alta wizard-alta__dialog !max-w-[42rem] !gap-0 !p-0">
          <div className="wizard-alta__dialog-head">
            <DialogHeader className="text-left">
              <DialogTitle className="wizard-alta__dialog-title">
                {editingCaja ? "Editar caja" : "Nueva caja"}
              </DialogTitle>
              <DialogDescription className="wizard-alta__dialog-sub">
                Cada caja es un punto de venta. Máximo {MAX_CAJAS} por
                sucursal.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form
            onSubmit={(e) => void handleCajaSubmit(e)}
            className="wizard-alta__dialog-body"
          >
            <div className="wizard-alta__dialog-fields">
              <Field label="Nombre de la caja" htmlFor="cajaNombre">
                <Input
                  id="cajaNombre"
                  value={cajaNombre}
                  onChange={(e) => setCajaNombre(e.target.value)}
                  placeholder="Ej. Caja 1"
                  required
                />
              </Field>
            </div>
            <div className="wizard-alta__footer">
              <button
                type="button"
                className="wizard-alta__btn wizard-alta__btn--secondary"
                onClick={() => setCajaDialogOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="wizard-alta__btn wizard-alta__btn--primary"
                disabled={submitting}
              >
                {submitting
                  ? "Guardando…"
                  : editingCaja
                    ? "Guardar"
                    : "Crear caja"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

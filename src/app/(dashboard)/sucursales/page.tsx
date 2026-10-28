"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Power,
  PowerOff,
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
import { RequireRole } from "@/components/auth/require-role";
import { useSucursales } from "@/hooks/use-sucursales";
import { useZonas } from "@/hooks/use-zonas";
import { useConcessions } from "@/hooks/use-concessions";
import { useUsers } from "@/hooks/use-users";
import { useConcesionFilterParam } from "@/hooks/use-concesion-filter-param";
import { useSucursalDeepLink } from "@/hooks/use-deep-link-params";
import { useActiveConcesionOptional } from "@/hooks/use-active-concesion";
import { usePermissions } from "@/hooks/use-permissions";
import { UserRole, type Caja, type SucursalModoOperacion } from "@/lib/types";
import "@/styles/wizard-alta.css";

/** Máximo de cajas por sucursal (activas + desactivadas), igual que el asistente. */
const MAX_CAJAS = 3;

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

  // Solo se usa createUser (alta del Admin Cervecería); no se listan usuarios aquí.
  const { createUser } = useUsers(undefined, { enabled: false });

  const [sucursalDialogOpen, setSucursalDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [zonaId, setZonaId] = useState("");
  const [modoOperacion, setModoOperacion] = useState<SucursalModoOperacion>("POS");
  const [adminNombre, setAdminNombre] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
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

  const { selectedSucursalId, setSelectedSucursalId } =
    useSucursalDeepLink(visibleSucursalIds);

  const selectedSucursal = sucursalesVisibles.find(
    (s) => s.id === selectedSucursalId,
  );

  /** Concesión objetivo del diálogo de nueva sucursal. */
  const dialogConcesionId = perms.isSuperAdmin
    ? concesionFilter
    : perms.concesionId ?? "";
  const dialogEsCerveceria =
    concessions.find((c) => c.id === dialogConcesionId)?.tipo === "CERVECERIA";

  const selectedEsCerveceria =
    concessions.find((c) => c.id === selectedSucursal?.concesion_id)?.tipo ===
    "CERVECERIA";
  const selectedModoConteo = selectedSucursal?.modo_operacion === "CONTEO";

  const cajasDeSucursal = selectedSucursal?.cajas ?? [];
  const puedeAgregarCaja = cajasDeSucursal.length < MAX_CAJAS;
  const sucursalActiva = selectedSucursal?.activo !== false;

  const cajasActivasSucursal = useMemo(
    () => cajasDeSucursal.filter((c) => c.activo !== false),
    [cajasDeSucursal],
  );

  const nextStepHint = (() => {
    if (!selectedSucursal) return null;
    if (!sucursalActiva) {
      return "Sucursal desactivada. Reactívala para agregar o editar cajas.";
    }
    if (cajasDeSucursal.length === 0) {
      return "Agrega al menos una caja (máx. 3).";
    }
    if (cajasDeSucursal.length < MAX_CAJAS) {
      return `Puedes agregar hasta ${MAX_CAJAS} cajas.`;
    }
    return `Máximo de ${MAX_CAJAS} cajas alcanzado.`;
  })();

  const setConcesion = (value: string) => {
    setConcesionFilter(value);
    activeCtx?.setActiveConcesionId(value || null);
  };

  const closeSucursalDialog = () => {
    setSucursalDialogOpen(false);
    setNombre("");
    setZonaId("");
    setModoOperacion("POS");
    setAdminNombre("");
    setAdminEmail("");
    setAdminPassword("");
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

    const modo: SucursalModoOperacion =
      dialogEsCerveceria && modoOperacion === "CONTEO" ? "CONTEO" : "POS";
    const quiereAdmin =
      modo === "CONTEO" &&
      perms.isSuperAdmin &&
      Boolean(adminNombre.trim() || adminEmail.trim() || adminPassword.trim());
    if (quiereAdmin) {
      if (!adminNombre.trim() || !adminEmail.trim() || !adminPassword.trim()) {
        toast.error(
          "Completa nombre, correo y contraseña del Admin Cervecería, o deja los tres campos vacíos",
        );
        return;
      }
      if (adminPassword.trim().length < 6) {
        toast.error(
          "La contraseña del Admin Cervecería debe tener al menos 6 caracteres",
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const created = await createSucursal(concesionId, zonaId, {
        sucursal: { nombre, modo_operacion: modo },
      });

      if (quiereAdmin) {
        try {
          await createUser({
            nombre: adminNombre.trim(),
            email: adminEmail.trim(),
            password: adminPassword.trim(),
            rol: UserRole.ADMIN_CERVECERIA,
            concesionId,
            sucursalId: created.id,
            activo: true,
          });
          toast.success("Sucursal y Admin Cervecería creados");
        } catch (err) {
          toast.error(
            `Sucursal creada, pero falló el alta del Admin Cervecería: ${
              err instanceof Error ? err.message : "error desconocido"
            }. Créalo desde Usuarios.`,
          );
        }
      } else {
        toast.success("Sucursal creada");
      }
      closeSucursalDialog();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al crear sucursal",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleModoOperacion = async () => {
    if (!selectedSucursal) return;
    const nuevo: SucursalModoOperacion = selectedModoConteo ? "POS" : "CONTEO";
    setSubmitting(true);
    try {
      await updateSucursal(selectedSucursal.id, {
        sucursal: { modo_operacion: nuevo },
      });
      toast.success(
        nuevo === "CONTEO"
          ? "Sucursal cambiada a corte por conteo"
          : "Sucursal cambiada a POS clásico",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al cambiar el modo",
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

  const canCreateSucursal =
    perms.canManageSucursales &&
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
                  ? "Puntos de venta y cajas de cada sucursal."
                  : "Consulta sucursales y cajas de tu concesión."}
              </p>
            </div>
            <div className="wizard-alta__hero-actions">
              <button
                type="button"
                className="wizard-alta__exit"
                onClick={() => {
                  void refetch();
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
                              {s.modo_operacion === "CONTEO" && (
                                <span className="wizard-alta__status-pill wizard-alta__status-pill--pending">
                                  Conteo
                                </span>
                              )}
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
                  <strong>Nueva sucursal</strong> → 3) Agrega cajas.
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
                  Cuando haya una sucursal, aquí administrarás sus cajas.
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
                        {selectedModoConteo && (
                          <span className="wizard-alta__status-pill wizard-alta__status-pill--pending">
                            Corte por conteo
                          </span>
                        )}
                      </div>
                      <p className="wizard-alta__panel-sub">
                        Zona: {zonaNombre(selectedSucursal.zona_id)}
                        {perms.isSuperAdmin &&
                          ` · ${concesionNombre(selectedSucursal.concesion_id)}`}
                        {` · ${cajasActivasSucursal.length} caja(s) activa(s)`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {perms.canManageSucursales && selectedEsCerveceria && (
                        <button
                          type="button"
                          className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                          onClick={() => void handleToggleModoOperacion()}
                          disabled={submitting}
                          title={
                            selectedModoConteo
                              ? "Volver al POS clásico con vendedores"
                              : "El Admin Cervecería cierra el día capturando el inventario final"
                          }
                        >
                          <RefreshCw className="size-4" />
                          {selectedModoConteo
                            ? "Cambiar a POS"
                            : "Cambiar a conteo"}
                        </button>
                      )}
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
                  </div>

                </div>

                <div className="wizard-alta__panel-body wizard-alta__panel-body--stack">
                  {nextStepHint && (
                    <p className="wizard-alta__hint">{nextStepHint}</p>
                  )}

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
                          className={`wizard-alta__table-wrap wizard-alta__table-wrap--cards${
                            cajasDeSucursal.length > 5
                              ? " wizard-alta__table-wrap--scroll"
                              : ""
                          }`}
                        >
                          <table className="wizard-alta__table wizard-alta__table--cards">
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
                                    <td className="wizard-alta__table-card-title">
                                      <span className="wizard-alta__table-name">
                                        {c.nombre ?? c.id}
                                      </span>
                                    </td>
                                    <td data-label="Estado">
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
                                      <td
                                        className="wizard-alta__table-actions-col"
                                        data-label="Acciones"
                                      >
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
              {dialogEsCerveceria && (
                <Field label="Modo de operación" htmlFor="modoOperacion">
                  <NativeSelect
                    id="modoOperacion"
                    value={modoOperacion}
                    onChange={(e) =>
                      setModoOperacion(
                        e.target.value === "CONTEO" ? "CONTEO" : "POS",
                      )
                    }
                  >
                    <option value="POS">POS con vendedores (clásico)</option>
                    <option value="CONTEO">
                      Corte por conteo (Admin Cervecería)
                    </option>
                  </NativeSelect>
                </Field>
              )}
              {dialogEsCerveceria &&
                modoOperacion === "CONTEO" &&
                perms.isSuperAdmin && (
                  <>
                    <p className="wizard-alta__hint">
                      Admin Cervecería (opcional): se crea junto con la
                      sucursal y podrá hacer el corte capturando el inventario
                      final. También puedes darlo de alta después desde
                      Usuarios.
                    </p>
                    <Field label="Nombre del admin" htmlFor="adminNombre">
                      <Input
                        id="adminNombre"
                        value={adminNombre}
                        onChange={(e) => setAdminNombre(e.target.value)}
                        placeholder="Ej. Ana López"
                      />
                    </Field>
                    <Field label="Correo del admin" htmlFor="adminEmail">
                      <Input
                        id="adminEmail"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@correo.com"
                      />
                    </Field>
                    <Field
                      label="Contraseña del admin"
                      htmlFor="adminPassword"
                    >
                      <Input
                        id="adminPassword"
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                      />
                    </Field>
                  </>
                )}
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

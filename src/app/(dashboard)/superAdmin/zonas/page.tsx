"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Power, PowerOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import { useZonas } from "@/hooks/use-zonas";
import type { Zona } from "@/lib/types";
import "@/styles/wizard-alta.css";

export default function ZonasPage() {
  const { zonas, loading, error, refetch, createZona, updateZona, deleteZona } =
    useZonas({ includeInactive: true });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [editing, setEditing] = useState<Zona | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setDialogOpen(true);
  };

  const openEdit = (z: Zona) => {
    setEditing(z);
    setNombre(z.zona);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setNombre("");
  };

  const handleToggleActivo = async (z: Zona) => {
    try {
      if (z.activo === false) {
        await updateZona(z.id, { zona: z.zona, activo: true });
        toast.success("Zona reactivada");
      } else {
        await deleteZona(z.id);
        toast.success("Zona desactivada");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al cambiar estado",
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateZona(editing.id, { zona: nombre });
        toast.success("Zona actualizada");
      } else {
        await createZona({ zona: nombre, activo: true });
        toast.success("Zona creada");
      }
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole superAdminOnly>
      <div className="wizard-alta wizard-alta__shell wizard-alta__shell--fill">
        <header className="wizard-alta__hero">
          <div className="wizard-alta__hero-inner">
            <div>
              <h1>Zonas del estadio</h1>
              <p>
                Las zonas son áreas del estadio (Norte, Sur…). Créalas antes de
                las sucursales.
              </p>
            </div>
            <div className="wizard-alta__hero-actions">
              <button
                type="button"
                className="wizard-alta__exit"
                onClick={() => void refetch()}
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
            <button
              type="button"
              className="wizard-alta__btn wizard-alta__btn--primary w-full"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              Nueva zona
            </button>
            <p className="wizard-alta__hint wizard-alta__hint--optional mt-3">
              Ejemplo: Norte, Sur, Oriente. Luego las usas al crear sucursales.
            </p>
          </aside>

          <div className="wizard-alta__panel">
            <div className="wizard-alta__panel-head">
              <h2 className="wizard-alta__panel-title">Listado de zonas</h2>
              <p className="wizard-alta__panel-sub">
                {loading
                  ? "Cargando…"
                  : `${zonas.length} zona(s) · base para ubicar sucursales`}
              </p>
            </div>

            <div className="wizard-alta__panel-body">
              {loading ? (
                <p className="wizard-alta__empty">Cargando zonas…</p>
              ) : zonas.length === 0 ? (
                <div>
                  <p className="wizard-alta__hint">
                    Sin zonas no podrás ubicar sucursales. Pulsa{" "}
                    <strong>Nueva zona</strong> para registrar la primera área
                    del estadio.
                  </p>
                  <p className="wizard-alta__empty">
                    Aún no hay zonas. Crea la primera para continuar.
                  </p>
                  <button
                    type="button"
                    className="wizard-alta__btn wizard-alta__btn--primary mt-3"
                    onClick={openCreate}
                  >
                    <Plus className="size-4" />
                    Crear zona
                  </button>
                </div>
              ) : (
                <>
                  <p className="wizard-alta__hint">
                    Estas zonas se eligen al crear una sucursal. Edita o
                    desactiva las que ya no uses.
                  </p>
                  <div
                    className={`wizard-alta__table-wrap${
                      zonas.length > 8
                        ? " wizard-alta__table-wrap--scroll"
                        : ""
                    }`}
                  >
                    <table className="wizard-alta__table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Estado</th>
                          <th className="wizard-alta__table-actions-col">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {zonas.map((z) => {
                          const activo = z.activo !== false;
                          return (
                            <tr
                              key={z.id}
                              className={
                                activo
                                  ? undefined
                                  : "wizard-alta__table-row--off"
                              }
                            >
                              <td>
                                <span className="wizard-alta__table-name">
                                  {z.zona}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`wizard-alta__status-pill ${
                                    activo
                                      ? "wizard-alta__status-pill--on"
                                      : "wizard-alta__status-pill--off"
                                  }`}
                                >
                                  {activo ? "Activa" : "Inactiva"}
                                </span>
                              </td>
                              <td className="wizard-alta__table-actions-col">
                                <div className="wizard-alta__table-actions">
                                  <button
                                    type="button"
                                    className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                    onClick={() => openEdit(z)}
                                  >
                                    <Pencil className="size-3.5" />
                                    Editar
                                  </button>
                                  {activo ? (
                                    <button
                                      type="button"
                                      className="wizard-alta__btn wizard-alta__btn--danger wizard-alta__btn--sm"
                                      onClick={() => void handleToggleActivo(z)}
                                    >
                                      <PowerOff className="size-3.5" />
                                      Desactivar
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                      onClick={() => void handleToggleActivo(z)}
                                    >
                                      <Power className="size-3.5" />
                                      Reactivar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="wizard-alta wizard-alta__dialog !flex !max-w-[42rem] !flex-col !gap-0 !p-0">
          <div className="wizard-alta__dialog-head">
            <DialogHeader className="text-left">
              <DialogTitle className="wizard-alta__dialog-title">
                {editing ? "Editar zona" : "Nueva zona"}
              </DialogTitle>
              <DialogDescription className="wizard-alta__dialog-sub">
                Escribe un nombre claro del área (ej. Norte, Sur, Platea).
              </DialogDescription>
            </DialogHeader>
          </div>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="wizard-alta__dialog-body"
          >
            <div className="wizard-alta__dialog-fields">
              <Field label="Nombre" htmlFor="zona">
                <Input
                  id="zona"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Norte"
                  required
                />
              </Field>
            </div>
            <div className="wizard-alta__footer">
              <button
                type="button"
                className="wizard-alta__btn wizard-alta__btn--secondary"
                onClick={closeDialog}
                disabled={submitting}
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
                  : editing
                    ? "Guardar cambios"
                    : "Crear zona"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

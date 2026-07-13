"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ImagePlus,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Settings2,
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
import { useConcessions } from "@/hooks/use-concessions";
import { firstStoredImage } from "@/lib/image-url";
import type { Concession } from "@/lib/types";
import "@/styles/wizard-alta.css";

type StatusFilter = "todos" | "activo" | "inactivo";

export default function ConcesionesPage() {
  const {
    concessions,
    loading,
    error,
    refetch,
    createConcession,
    updateConcession,
    deleteConcession,
    uploadConcessionImages,
  } = useConcessions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [porcentajeComision, setPorcentajeComision] = useState("0");
  const [editing, setEditing] = useState<Concession | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingPreviewBroken, setExistingPreviewBroken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingLogoUrl = firstStoredImage(editing?.imagenes);

  const concessionsVisibles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return concessions.filter((c) => {
      const activo = c.activo !== false;
      if (statusFilter === "activo" && !activo) return false;
      if (statusFilter === "inactivo" && activo) return false;
      if (!q) return true;
      return (c.nombre ?? "").toLowerCase().includes(q);
    });
  }, [concessions, search, statusFilter]);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFiles[0]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFiles]);

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setPorcentajeComision("0");
    setImageFiles([]);
    setExistingPreviewBroken(false);
    setDialogOpen(true);
  };

  const openEdit = (c: Concession) => {
    setEditing(c);
    setNombre(c.nombre);
    setPorcentajeComision(String(c.porcentajeComision ?? 0));
    setImageFiles([]);
    setExistingPreviewBroken(false);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setNombre("");
    setPorcentajeComision("0");
    setImageFiles([]);
  };

  const parsePorcentajeComision = () => {
    const value = Number(porcentajeComision);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      throw new Error("Ingresa un porcentaje de comisión entre 0 y 100");
    }
    return value;
  };

  const handleToggleActivo = async (c: Concession) => {
    const activo = c.activo !== false;
    try {
      if (activo) {
        await deleteConcession(c.id);
        toast.success("Concesión desactivada");
      } else {
        await updateConcession(c.id, {
          nombre: c.nombre,
          activo: true,
          imagenes: c.imagenes ?? [],
          porcentajeComision: c.porcentajeComision ?? 0,
        });
        toast.success("Concesión reactivada");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const comision = parsePorcentajeComision();
      if (editing) {
        await updateConcession(editing.id, {
          nombre,
          activo: editing.activo ?? true,
          imagenes: editing.imagenes ?? [],
          porcentajeComision: comision,
        });
        if (imageFiles.length > 0) {
          await uploadConcessionImages(editing.id, imageFiles);
        }
        toast.success("Concesión actualizada");
      } else {
        const created = await createConcession({
          nombre,
          activo: true,
          imagenes: [],
          porcentajeComision: comision,
        });
        if (imageFiles.length > 0 && created?.id) {
          await uploadConcessionImages(created.id, imageFiles);
        }
        toast.success("Concesión creada");
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
              <h1>Concesiones</h1>
              <p>
                Una concesión es el negocio (ej. Cervecería). Desde aquí la
                administras; el asistente te guía al crearla.
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
            <Link
              href="/superAdmin/concesiones/nueva"
              className="wizard-alta__btn wizard-alta__btn--primary w-full"
            >
              <Settings2 className="size-4" />
              Asistente de configuración
            </Link>
            <button
              type="button"
              className="wizard-alta__btn wizard-alta__btn--outline mt-2 w-full"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              Agregar rápido
            </button>
            <p className="wizard-alta__hint wizard-alta__hint--optional mt-3">
              Recomendado: usa el asistente la primera vez. Agregar rápido solo
              crea el nombre (y logo).
            </p>
          </aside>

          <div className="wizard-alta__panel">
            <div className="wizard-alta__panel-head">
              <h2 className="wizard-alta__panel-title">Listado</h2>
              <p className="wizard-alta__panel-sub">
                {loading
                  ? "Cargando…"
                  : `${concessions.length} concesión(es) · edita, configura o desactiva`}
              </p>
            </div>

            <div className="wizard-alta__panel-body">
              {loading ? (
                <p className="wizard-alta__empty">Cargando concesiones…</p>
              ) : concessions.length === 0 ? (
                <div>
                  <p className="wizard-alta__hint">
                    No hay concesiones. Pulsa{" "}
                    <strong>Asistente de configuración</strong> (recomendado) o{" "}
                    <strong>Agregar rápido</strong>.
                  </p>
                  <p className="wizard-alta__empty">
                    Aún no hay concesiones registradas.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/superAdmin/concesiones/nueva"
                      className="wizard-alta__btn wizard-alta__btn--primary"
                    >
                      <Settings2 className="size-4" />
                      Abrir asistente
                    </Link>
                    <button
                      type="button"
                      className="wizard-alta__btn wizard-alta__btn--outline"
                      onClick={openCreate}
                    >
                      <Plus className="size-4" />
                      Agregar rápido
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="wizard-alta__hint">
                    Después de crear una concesión: configura sucursales,
                    productos y usuarios desde sus módulos o con Configurar.
                  </p>
                  <div className="wizard-alta__toolbar">
                    <div className="wizard-alta__toolbar-search">
                      <Search className="wizard-alta__toolbar-search-icon size-4" />
                      <Input
                        id="concessionSearch"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre…"
                        aria-label="Buscar concesiones"
                      />
                    </div>
                    <div className="wizard-alta__toolbar-filter">
                      <Field label="Estado" htmlFor="statusFilter">
                        <NativeSelect
                          id="statusFilter"
                          value={statusFilter}
                          onChange={(e) =>
                            setStatusFilter(e.target.value as StatusFilter)
                          }
                        >
                          <option value="todos">Todos</option>
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                        </NativeSelect>
                      </Field>
                    </div>
                  </div>
                  {concessionsVisibles.length === 0 ? (
                    <p className="wizard-alta__empty">
                      Ninguna concesión coincide con la búsqueda o el filtro.
                      Prueba otro nombre o estado.
                    </p>
                  ) : (
                    <div
                      className={`wizard-alta__table-wrap${concessionsVisibles.length > 8
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
                          {concessionsVisibles.map((c) => {
                            const activo = c.activo !== false;
                            const img = firstStoredImage(c.imagenes);
                            return (
                              <tr
                                key={c.id}
                                className={
                                  activo
                                    ? undefined
                                    : "wizard-alta__table-row--off"
                                }
                              >
                                <td>
                                  <div className="flex items-center gap-3">
                                    {img ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={img}
                                        alt=""
                                        className="size-8 shrink-0 rounded-md object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display =
                                            "none";
                                        }}
                                      />
                                    ) : null}
                                    <span className="wizard-alta__table-name">
                                      {c.nombre}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className={`wizard-alta__status-pill ${activo
                                      ? "wizard-alta__status-pill--on"
                                      : "wizard-alta__status-pill--off"
                                      }`}
                                  >
                                    {activo ? "Activa" : "Inactiva"}
                                  </span>
                                </td>
                                <td className="wizard-alta__table-actions-col">
                                  <div className="wizard-alta__table-actions">
                                    <Link
                                      href={`/superAdmin/concesiones/${c.id}`}
                                      className="wizard-alta__btn wizard-alta__btn--primary wizard-alta__btn--sm"
                                    >
                                      <Settings2 className="size-3.5" />
                                      Configurar
                                    </Link>
                                    <button
                                      type="button"
                                      className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                      onClick={() => openEdit(c)}
                                    >
                                      <Pencil className="size-3.5" />
                                      Editar
                                    </button>
                                    {activo ? (
                                      <button
                                        type="button"
                                        className="wizard-alta__btn wizard-alta__btn--danger wizard-alta__btn--sm"
                                        onClick={() =>
                                          void handleToggleActivo(c)
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
                                          void handleToggleActivo(c)
                                        }
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
                  )}
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
                {editing ? "Editar concesión" : "Nueva concesión"}
              </DialogTitle>
              <DialogDescription className="wizard-alta__dialog-sub">
                {editing
                  ? "Cambia el nombre o el logo. Para armar todo el negocio usa el asistente."
                  : "Alta rápida: solo nombre y logo. Para sucursales, productos y equipo usa el asistente."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="wizard-alta__dialog-body"
          >
            <div className="wizard-alta__dialog-fields">
              <Field label="Nombre" htmlFor="nombre">
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre de la concesión"
                  required
                />
              </Field>
              <Field
                label="Porcentaje de comisión (%)"
                htmlFor="porcentajeComision"
                hint="Se usa en los reportes de cortes de esta concesión"
              >
                <Input
                  id="porcentajeComision"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={porcentajeComision}
                  onChange={(e) => setPorcentajeComision(e.target.value)}
                  required
                />
              </Field>
              <Field label="Logo / imagen" hint="JPEG, PNG o WebP">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) =>
                    setImageFiles(
                      e.target.files ? Array.from(e.target.files) : [],
                    )
                  }
                />
                <button
                  type="button"
                  className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm w-fit"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  Elegir imagen
                </button>
                {(previewUrl ||
                  (editingLogoUrl && !existingPreviewBroken)) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl ?? editingLogoUrl ?? ""}
                      alt="Vista previa"
                      className="mt-2 max-h-40 rounded-[8px] border object-cover"
                      onError={() => {
                        if (!previewUrl) setExistingPreviewBroken(true);
                      }}
                    />
                  )}
                {editing &&
                  !previewUrl &&
                  !editingLogoUrl &&
                  !existingPreviewBroken && (
                    <p className="mt-2 text-[1.3rem] text-[#6b7280]">
                      Sin logo. Elige una imagen para agregarlo.
                    </p>
                  )}
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
                    : "Crear concesión"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

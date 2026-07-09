"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Plus, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useConcessions } from "@/hooks/use-concessions";
import { normalizeStorageImageUrl } from "@/lib/image-url";
import type { Concession } from "@/lib/types";

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
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setDialogOpen(true);
  };

  const openEdit = (c: Concession) => {
    setEditing(c);
    setNombre(c.nombre);
    setPorcentajeComision(String(c.porcentajeComision ?? 0));
    setImageFiles([]);
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
      <PageHeader
        title="Concesiones"
        description="Crea concesiones con el asistente paso a paso o administra la lista."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/superAdmin/concesiones/nueva">
                <Settings2 className="size-4" />
                Asistente de configuración
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Agregar rápido
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Actualizar
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
          {error}
        </div>
      )}

      <DataTable<Concession>
        loading={loading}
        data={concessions}
        getRowKey={(c) => c.id}
        emptyMessage="No hay concesiones registradas."
        columns={[
          {
            key: "img",
            header: "Logo",
            cell: (c) => {
              const img = normalizeStorageImageUrl(c.imagenes?.[0]);
              return img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="size-10 rounded-md object-cover" />
              ) : (
                "—"
              );
            },
          },
          {
            key: "nombre",
            header: "Nombre",
            cell: (c) => <span className="font-medium">{c.nombre}</span>,
          },
          {
            key: "comision",
            header: "Comisión",
            cell: (c) => `${c.porcentajeComision ?? 0}%`,
          },
          {
            key: "estado",
            header: "Estado",
            cell: (c) => (
              <Badge variant={c.activo !== false ? "default" : "secondary"}>
                {c.activo !== false ? "Activa" : "Inactiva"}
              </Badge>
            ),
          },
          {
            key: "acciones",
            header: "Acciones",
            cell: (c) => (
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={`/superAdmin/concesiones/${c.id}`}>Configurar</Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void deleteConcession(c.id)}
                >
                  Desactivar
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar concesión" : "Nueva concesión"}
            </DialogTitle>
            <DialogDescription>
              Completa los datos de la concesión.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
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
            <Field
              label="Logo / imagen"
              hint="JPEG, PNG o WebP"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) =>
                  setImageFiles(e.target.files ? Array.from(e.target.files) : [])
                }
              />
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="size-4" />
                Elegir imagen
              </Button>
              {(previewUrl || editing?.imagenes?.[0]) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    previewUrl ??
                    normalizeStorageImageUrl(editing?.imagenes?.[0]) ??
                    ""
                  }
                  alt="Vista previa"
                  className="mt-1 max-h-40 rounded-[8px] border object-cover"
                />
              )}
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : editing ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

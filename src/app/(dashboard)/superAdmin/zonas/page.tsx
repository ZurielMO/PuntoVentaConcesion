"use client";

import { useState, type FormEvent } from "react";
import { Plus, RefreshCw } from "lucide-react";
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
import { useZonas } from "@/hooks/use-zonas";
import type { Zona } from "@/lib/types";

export default function ZonasPage() {
  const { zonas, loading, error, refetch, createZona, updateZona, deleteZona } =
    useZonas();
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
      <PageHeader
        title="Zonas del estadio"
        description="Las sucursales de cada concesión se crean sobre estas zonas."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Agregar
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

      <DataTable<Zona>
        loading={loading}
        data={zonas}
        getRowKey={(z) => z.id}
        emptyMessage="No hay zonas registradas."
        columns={[
          { key: "zona", header: "Zona", cell: (z) => z.zona },
          {
            key: "activo",
            header: "Estado",
            cell: (z) => (
              <Badge variant={z.activo !== false ? "default" : "secondary"}>
                {z.activo !== false ? "Activa" : "Inactiva"}
              </Badge>
            ),
          },
          {
            key: "acciones",
            header: "Acciones",
            cell: (z) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(z)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void deleteZona(z.id)}
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
            <DialogTitle>{editing ? "Editar zona" : "Nueva zona"}</DialogTitle>
            <DialogDescription>
              Define el nombre de la zona del estadio.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
            <Field label="Nombre" htmlFor="zona">
              <Input
                id="zona"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la zona"
                required
              />
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

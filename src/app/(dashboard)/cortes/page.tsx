"use client";

import { useState, type FormEvent } from "react";
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
import { useCortes } from "@/hooks/use-cortes";
import { usePermissions } from "@/hooks/use-permissions";
import { formatPrice } from "@/lib/format";
import type { Corte } from "@/lib/types";

export default function CortesPage() {
  const perms = usePermissions();
  const { cortes, loading, error, refetch, createCorte } = useCortes();
  const canManage = perms.canManageCortes;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    estatus: "CERRADO",
    totalReal: "",
    totalCaja: "",
    comentarios: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const closeDialog = () => {
    setDialogOpen(false);
    setForm({
      fecha: new Date().toISOString().slice(0, 10),
      estatus: "CERRADO",
      totalReal: "",
      totalCaja: "",
      comentarios: "",
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCorte({
        fecha: form.fecha,
        estatus: form.estatus,
        totalReal: Number(form.totalReal),
        totalCaja: Number(form.totalCaja),
        comentarios: form.comentarios || undefined,
      });
      toast.success("Corte registrado");
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar corte");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole authenticated>
      <PageHeader
        title="Cortes de caja"
        description={
          perms.isSuperAdmin
            ? "Reporte de cortes de caja (solo lectura)."
            : "Registro de cierres de caja por jornada."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                Agregar
              </Button>
            )}
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

      <DataTable<Corte>
        loading={loading}
        data={cortes}
        getRowKey={(c) => c.id}
        emptyMessage="No hay cortes registrados."
        columns={[
          { key: "fecha", header: "Fecha", cell: (c) => c.fecha },
          {
            key: "estatus",
            header: "Estatus",
            cell: (c) => <Badge variant="secondary">{c.estatus}</Badge>,
          },
          {
            key: "totalReal",
            header: "Total real",
            cell: (c) => formatPrice(Number(c.totalReal)),
          },
          {
            key: "totalCaja",
            header: "Total caja",
            cell: (c) => formatPrice(Number(c.totalCaja)),
          },
          {
            key: "comentarios",
            header: "Comentarios",
            cell: (c) => c.comentarios || "—",
          },
        ]}
      />

      {canManage && (
        <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo corte</DialogTitle>
              <DialogDescription>
                Registra el cierre de caja de la jornada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Fecha" htmlFor="fecha">
                  <Input
                    id="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Estatus" htmlFor="estatus">
                  <NativeSelect
                    id="estatus"
                    value={form.estatus}
                    onChange={(e) => setForm({ ...form, estatus: e.target.value })}
                    required
                  >
                    <option value="CERRADO">CERRADO</option>
                    <option value="ABIERTO">ABIERTO</option>
                  </NativeSelect>
                </Field>
                <Field label="Total real" htmlFor="totalReal">
                  <Input
                    id="totalReal"
                    type="number"
                    step="0.01"
                    value={form.totalReal}
                    onChange={(e) =>
                      setForm({ ...form, totalReal: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Total caja" htmlFor="totalCaja">
                  <Input
                    id="totalCaja"
                    type="number"
                    step="0.01"
                    value={form.totalCaja}
                    onChange={(e) =>
                      setForm({ ...form, totalCaja: e.target.value })
                    }
                    required
                  />
                </Field>
              </div>
              <Field label="Comentarios" htmlFor="comentarios" hint="Opcional">
                <Input
                  id="comentarios"
                  value={form.comentarios}
                  onChange={(e) =>
                    setForm({ ...form, comentarios: e.target.value })
                  }
                />
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Guardando…" : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </RequireRole>
  );
}

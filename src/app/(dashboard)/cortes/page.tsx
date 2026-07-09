"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Eye, Plus, RefreshCw } from "lucide-react";
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
import { CorteResumenPanel } from "@/components/dashboard/corte-resumen-panel";
import { CorteDetalleDialog } from "@/components/dashboard/corte-detalle-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCortes, useCorteResumen, type CorteFilters } from "@/hooks/use-cortes";
import { usePermissions } from "@/hooks/use-permissions";
import { useConcessions } from "@/hooks/use-concessions";
import { useSucursales } from "@/hooks/use-sucursales";
import { formatPrice } from "@/lib/format";
import type { Corte } from "@/lib/types";

const nullableMoney = (value?: number | null) =>
  value == null ? "—" : formatPrice(Number(value));

export default function CortesPage() {
  const perms = usePermissions();
  const canManage = perms.canManageCortes;
  const canFilter = perms.isSuperAdmin || perms.isAdmin;

  const [concesionId, setConcesionId] = useState("");
  const [sucursalId, setSucursalId] = useState("");

  const filters = useMemo<CorteFilters>(() => {
    const f: CorteFilters = {};
    if (perms.isSuperAdmin && concesionId) f.concesionId = concesionId;
    if (sucursalId) f.sucursalId = sucursalId;
    return f;
  }, [perms.isSuperAdmin, concesionId, sucursalId]);

  const { cortes, loading, error, refetch, createCorte } = useCortes(filters);
  const {
    resumen,
    loading: loadingResumen,
    error: errorResumen,
    refetch: refetchResumen,
  } = useCorteResumen(filters);
  const { concessions } = useConcessions();
  const { sucursales } = useSucursales();

  const sucursalesFiltradas = useMemo(() => {
    if (perms.isSuperAdmin && concesionId) {
      return sucursales.filter((s) => s.concesion_id === concesionId);
    }
    return sucursales;
  }, [sucursales, perms.isSuperAdmin, concesionId]);

  const [detalleCorte, setDetalleCorte] = useState<Corte | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    estatus: "CERRADO",
    totalReal: "",
    totalCaja: "",
    comentarios: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const refreshAll = () => {
    void refetch();
    void refetchResumen();
  };

  const handleConcesionChange = (value: string) => {
    setConcesionId(value);
    setSucursalId("");
  };

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
      void refetchResumen();
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
        description="Reporte de ventas por concesión y sucursal: desglose de lo vendido, venta neta y puntos canjeados."
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                Agregar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={refreshAll}>
              <RefreshCw className="size-4" />
              Actualizar
            </Button>
          </div>
        }
      />

      {canFilter && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          {perms.isSuperAdmin && (
            <Field label="Concesión" htmlFor="filtro-concesion">
              <NativeSelect
                id="filtro-concesion"
                value={concesionId}
                onChange={(e) => handleConcesionChange(e.target.value)}
              >
                <option value="">Todas las concesiones</option>
                {concessions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          <Field label="Sucursal" htmlFor="filtro-sucursal">
            <NativeSelect
              id="filtro-sucursal"
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {sucursalesFiltradas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre ?? s.id}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      )}

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-[1.8rem] font-semibold text-green-dark">
            Resumen del corte actual
          </h2>
          {resumen && (
            <Badge variant={resumen.corteCerrado ? "secondary" : "default"}>
              {resumen.corteCerrado ? "Corte cerrado" : "En curso"}
            </Badge>
          )}
        </div>

        {errorResumen && (
          <div className="rounded-sm border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
            {errorResumen}
          </div>
        )}

        {loadingResumen ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-md" />
            ))}
          </div>
        ) : resumen ? (
          <CorteResumenPanel resumen={resumen} />
        ) : (
          !errorResumen && (
            <div className="dashboard-card p-8 text-center">
              <p className="text-[1.4rem] text-muted-foreground">
                No hay datos de ventas para el periodo actual.
              </p>
            </div>
          )
        )}
      </section>

      <section>
        <h2 className="mb-4 text-[1.8rem] font-semibold text-green-dark">
          Historial de cortes
        </h2>

        {error && (
          <div className="mb-4 rounded-sm border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
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
              header: "Venta neta",
              cell: (c) => (
                <span className="font-medium">
                  {formatPrice(Number(c.totalReal))}
                </span>
              ),
            },
            {
              key: "totalEfectivo",
              header: "Efectivo",
              cell: (c) => nullableMoney(c.totalEfectivo ?? c.totalCaja),
            },
            {
              key: "totalTarjeta",
              header: "Tarjeta",
              cell: (c) => nullableMoney(c.totalTarjeta),
            },
            {
              key: "puntos",
              header: "Puntos",
              cell: (c) =>
                c.totalPuntosCanjeados
                  ? `${Number(c.totalPuntosCanjeados).toLocaleString("es-MX")} (${nullableMoney(c.totalPuntosMonto)})`
                  : "—",
            },
            {
              key: "detalle",
              header: "",
              cell: (c) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDetalleCorte(c)}
                >
                  <Eye className="size-4" />
                  Detalle
                </Button>
              ),
            },
          ]}
        />
      </section>

      <CorteDetalleDialog
        corte={detalleCorte}
        open={Boolean(detalleCorte)}
        onOpenChange={(open) => !open && setDetalleCorte(null)}
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

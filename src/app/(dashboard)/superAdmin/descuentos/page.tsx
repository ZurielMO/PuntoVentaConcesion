"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
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
import { useDescuentos } from "@/hooks/use-descuentos";
import { useConcessions } from "@/hooks/use-concessions";
import { useProducts } from "@/hooks/use-products";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Descuento, DescuentoTipo } from "@/lib/types";

const TIPOS: { value: DescuentoTipo; label: string }[] = [
  { value: "2X1", label: "2×1 (paga 1, lleva 2)" },
  { value: "3X2", label: "3×2 (paga 2, lleva 3)" },
  { value: "PORCENTAJE", label: "Porcentaje de descuento" },
  { value: "MONTO", label: "Monto fijo de descuento" },
];

const tipoLabel = (d: Descuento) => {
  if (d.tipo === "PORCENTAJE") return `-${d.valor ?? 0}%`;
  if (d.tipo === "MONTO") return `-${formatPrice(Number(d.valor ?? 0))}`;
  return d.tipo === "2X1" ? "2×1" : "3×2";
};

export default function DescuentosPage() {
  const [concesionFilter, setConcesionFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const {
    descuentos,
    loading,
    error,
    refetch,
    createDescuento,
    updateDescuento,
    softDeleteDescuento,
    hardDeleteDescuento,
  } = useDescuentos({
    concesionId: concesionFilter || undefined,
    includeInactive: showInactive,
  });
  const { concessions } = useConcessions();
  const { products } = useProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDescuento, setEditingDescuento] = useState<Descuento | null>(null);
  const [formConcesionId, setFormConcesionId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<DescuentoTipo>("2X1");
  const [valor, setValor] = useState("");
  const [productoIds, setProductoIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDescuento, setDeletingDescuento] = useState<Descuento | null>(null);

  const requiereValor = tipo === "PORCENTAJE" || tipo === "MONTO";

  const concesionNombre = (id?: string) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  const productoNombre = (id: string) =>
    products.find((p) => p.id === id)?.nombre ?? id;

  const productosDeConcesion = useMemo(() => {
    if (!formConcesionId) return [];
    return products.filter(
      (p) =>
        (p.concesion_id ?? p.concesionId) === formConcesionId &&
        p.activo !== false,
    );
  }, [products, formConcesionId]);

  const openCreate = () => {
    setEditingDescuento(null);
    setFormConcesionId(concesionFilter || "");
    setTitulo("");
    setDescripcion("");
    setTipo("2X1");
    setValor("");
    setProductoIds([]);
    setDialogOpen(true);
  };

  const openEdit = (descuento: Descuento) => {
    setEditingDescuento(descuento);
    setFormConcesionId(descuento.concesion_id);
    setTitulo(descuento.titulo);
    setDescripcion(descuento.descripcion ?? "");
    setTipo(descuento.tipo);
    setValor(descuento.valor != null ? String(descuento.valor) : "");
    setProductoIds(descuento.producto_ids ?? []);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDescuento(null);
  };

  const toggleProducto = (id: string) => {
    setProductoIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDescuento && !formConcesionId) {
      toast.error("Selecciona la concesión del descuento");
      return;
    }
    if (productoIds.length === 0) {
      toast.error("Selecciona al menos un producto");
      return;
    }
    if (requiereValor) {
      const num = Number(valor);
      if (!valor || Number.isNaN(num) || num <= 0) {
        toast.error("Ingresa un valor válido para el descuento");
        return;
      }
      if (tipo === "PORCENTAJE" && num > 100) {
        toast.error("El porcentaje no puede ser mayor a 100");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        tipo,
        valor: requiereValor ? Number(valor) : null,
        producto_ids: productoIds,
      };
      if (editingDescuento) {
        await updateDescuento(editingDescuento.id, payload);
        toast.success("Descuento actualizado");
      } else {
        await createDescuento(formConcesionId, payload);
        toast.success("Descuento creado");
      }
      closeDialog();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo guardar el descuento",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (descuento: Descuento) => {
    try {
      await softDeleteDescuento(descuento.id);
      toast.success(`"${descuento.titulo}" desactivado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desactivar");
    }
  };

  const handleHardDelete = async () => {
    if (!deletingDescuento) return;
    setSubmitting(true);
    try {
      await hardDeleteDescuento(deletingDescuento.id);
      toast.success(`"${deletingDescuento.titulo}" eliminado definitivamente`);
      setDeleteDialogOpen(false);
      setDeletingDescuento(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole superAdminOnly>
      <PageHeader
        title="Descuentos"
        description="Define promociones por concesión: 2×1, 3×2, porcentaje o monto fijo."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Agregar
            </Button>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-full max-w-xs">
          <Field label="Concesión" htmlFor="concesionFilter">
            <NativeSelect
              id="concesionFilter"
              value={concesionFilter}
              onChange={(e) => setConcesionFilter(e.target.value)}
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
        <label
          className="flex items-center gap-3 pb-3 text-[1.4rem]"
          htmlFor="showInactive"
        >
          <Checkbox
            id="showInactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Mostrar desactivados
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
          {error}
        </div>
      )}

      <DataTable<Descuento>
        loading={loading}
        data={descuentos}
        getRowKey={(d) => d.id}
        emptyMessage="No hay descuentos registrados. Crea el primero."
        columns={[
          {
            key: "titulo",
            header: "Promoción",
            cell: (d) => (
              <div>
                <p className="font-medium">{d.titulo}</p>
                {d.descripcion && (
                  <p className="text-[1.2rem] text-muted-foreground">
                    {d.descripcion}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "tipo",
            header: "Tipo",
            cell: (d) => <Badge>{tipoLabel(d)}</Badge>,
          },
          {
            key: "concesion",
            header: "Concesión",
            cell: (d) => concesionNombre(d.concesion_id),
          },
          {
            key: "productos",
            header: "Productos",
            cell: (d) => (
              <div className="flex max-w-xs flex-wrap gap-1">
                {(d.producto_ids ?? []).map((id) => (
                  <Badge key={id} variant="outline">
                    {productoNombre(id)}
                  </Badge>
                ))}
              </div>
            ),
          },
          {
            key: "creado",
            header: "Creado",
            cell: (d) => (
              <div>
                <p>{formatDateTime(d.createdAt)}</p>
                <p className="text-[1.2rem] text-muted-foreground">
                  {d.createdByNombre ?? "—"}
                </p>
              </div>
            ),
          },
          {
            key: "estado",
            header: "Estado",
            cell: (d) => (
              <Badge variant={d.activo !== false ? "default" : "secondary"}>
                {d.activo !== false ? "Activo" : "Inactivo"}
              </Badge>
            ),
          },
          {
            key: "acciones",
            header: "Acciones",
            cell: (d) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                  Editar
                </Button>
                {d.activo !== false && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleSoftDelete(d)}
                  >
                    Desactivar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setDeletingDescuento(d);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Modal crear/editar descuento */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDescuento ? "Editar descuento" : "Nuevo descuento"}
            </DialogTitle>
            <DialogDescription>
              Configura la promoción y los productos a los que aplica.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
            {!editingDescuento ? (
              <Field label="Concesión" htmlFor="descConcesion">
                <NativeSelect
                  id="descConcesion"
                  value={formConcesionId}
                  onChange={(e) => {
                    setFormConcesionId(e.target.value);
                    setProductoIds([]);
                  }}
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
            ) : (
              <p className="text-[1.3rem] text-muted-foreground">
                Concesión: {concesionNombre(editingDescuento.concesion_id)}
              </p>
            )}

            <Field label="Título" htmlFor="descTitulo">
              <Input
                id="descTitulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. 2×1 en Red Cola"
                required
              />
            </Field>

            <Field label="Descripción" htmlFor="descDescripcion" hint="Opcional">
              <Input
                id="descDescripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Única promo durante todo el partido"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo de promoción" htmlFor="descTipo">
                <NativeSelect
                  id="descTipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as DescuentoTipo)}
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              {requiereValor && (
                <Field
                  label={tipo === "PORCENTAJE" ? "Porcentaje (%)" : "Monto ($)"}
                  htmlFor="descValor"
                >
                  <Input
                    id="descValor"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={tipo === "PORCENTAJE" ? 100 : undefined}
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                  />
                </Field>
              )}
            </div>

            <Field
              label="Productos aplicables"
              hint={
                formConcesionId
                  ? "Marca los productos que entran en la promoción"
                  : "Primero selecciona la concesión"
              }
            >
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-sm border p-3">
                {productosDeConcesion.length === 0 ? (
                  <p className="text-[1.3rem] text-muted-foreground">
                    {formConcesionId
                      ? "La concesión no tiene productos activos."
                      : "Sin productos para mostrar."}
                  </p>
                ) : (
                  productosDeConcesion.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 text-[1.4rem]"
                    >
                      <Checkbox
                        checked={productoIds.includes(p.id)}
                        onChange={() => toggleProducto(p.id)}
                      />
                      {p.nombre}
                    </label>
                  ))
                )}
              </div>
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : editingDescuento ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal eliminar definitivamente */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar descuento definitivamente?</DialogTitle>
            <DialogDescription>
              &quot;{deletingDescuento?.titulo}&quot; se borrará de la base de
              datos y no se podrá recuperar. Si solo quieres ocultarlo, usa
              &quot;Desactivar&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={() => void handleHardDelete()}
            >
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

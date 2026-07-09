"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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
import { useCombos } from "@/hooks/use-combos";
import { useConcessions } from "@/hooks/use-concessions";
import { useProducts } from "@/hooks/use-products";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Combo, ComboProducto } from "@/lib/types";

type ComboLinea = { producto_id: string; cantidad: string };

const emptyLinea = (): ComboLinea => ({ producto_id: "", cantidad: "1" });

export default function CombosPage() {
  const [concesionFilter, setConcesionFilter] = useState("");

  const {
    combos,
    loading,
    error,
    refetch,
    createCombo,
    updateCombo,
    softDeleteCombo,
    hardDeleteCombo,
  } = useCombos({
    concesionId: concesionFilter || undefined,
    includeInactive: true,
  });
  const { concessions } = useConcessions();
  const { products } = useProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [formConcesionId, setFormConcesionId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [lineas, setLineas] = useState<ComboLinea[]>([emptyLinea()]);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCombo, setDeletingCombo] = useState<Combo | null>(null);

  const concesionNombre = (id?: string) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  const productoNombre = (id: string) =>
    products.find((p) => p.id === id)?.nombre ?? id;

  // Productos disponibles según la concesión elegida en el formulario
  const productosDeConcesion = useMemo(() => {
    if (!formConcesionId) return [];
    return products.filter(
      (p) =>
        (p.concesion_id ?? p.concesionId) === formConcesionId &&
        p.activo !== false,
    );
  }, [products, formConcesionId]);

  const openCreate = () => {
    setEditingCombo(null);
    setFormConcesionId(concesionFilter || "");
    setTitulo("");
    setDescripcion("");
    setPrecio("");
    setLineas([emptyLinea()]);
    setDialogOpen(true);
  };

  const openEdit = (combo: Combo) => {
    setEditingCombo(combo);
    setFormConcesionId(combo.concesion_id);
    setTitulo(combo.titulo);
    setDescripcion(combo.descripcion ?? "");
    setPrecio(combo.precio != null ? String(combo.precio) : "");
    setLineas(
      combo.productos.length > 0
        ? combo.productos.map((p) => ({
            producto_id: p.producto_id,
            cantidad: String(p.cantidad),
          }))
        : [emptyLinea()],
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCombo(null);
  };

  const setLinea = (idx: number, patch: Partial<ComboLinea>) => {
    setLineas((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  };

  const buildProductos = (): ComboProducto[] | string => {
    const productos: ComboProducto[] = [];
    for (const linea of lineas) {
      if (!linea.producto_id) continue;
      const cantidad = Number(linea.cantidad);
      if (!Number.isInteger(cantidad) || cantidad < 1) {
        return "Las cantidades deben ser enteros mayores a 0";
      }
      if (productos.some((p) => p.producto_id === linea.producto_id)) {
        return "No repitas el mismo producto en el combo";
      }
      productos.push({ producto_id: linea.producto_id, cantidad });
    }
    if (productos.length === 0) {
      return "Agrega al menos un producto al combo";
    }
    return productos;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCombo && !formConcesionId) {
      toast.error("Selecciona la concesión del combo");
      return;
    }
    const productos = buildProductos();
    if (typeof productos === "string") {
      toast.error(productos);
      return;
    }
    const precioNum = Number(precio);
    if (!precio || Number.isNaN(precioNum) || precioNum < 0) {
      toast.error("Ingresa un precio válido para el combo (≥ 0)");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        productos,
        precio: precioNum,
      };
      if (editingCombo) {
        await updateCombo(editingCombo.id, payload);
        toast.success("Combo actualizado");
      } else {
        await createCombo(formConcesionId, payload);
        toast.success("Combo creado");
      }
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el combo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActivo = async (combo: Combo) => {
    try {
      if (combo.activo === false) {
        await updateCombo(combo.id, { activo: true });
        toast.success("Combo reactivado");
      } else {
        await softDeleteCombo(combo.id);
        toast.success("Combo desactivado");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al cambiar estado",
      );
    }
  };

  const handleHardDelete = async () => {
    if (!deletingCombo) return;
    setSubmitting(true);
    try {
      await hardDeleteCombo(deletingCombo.id);
      toast.success(`"${deletingCombo.titulo}" eliminado definitivamente`);
      setDeleteDialogOpen(false);
      setDeletingCombo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole superAdminOnly>
      <PageHeader
        title="Combos"
        description="Crea y administra combos de productos por concesión."
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
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
          {error}
        </div>
      )}

      <DataTable<Combo>
        loading={loading}
        data={combos}
        getRowKey={(c) => c.id}
        emptyMessage="No hay combos registrados. Crea el primero."
        columns={[
          {
            key: "titulo",
            header: "Combo",
            cell: (c) => (
              <div>
                <p className="font-medium">{c.titulo}</p>
                {c.descripcion && (
                  <p className="text-[1.2rem] text-muted-foreground">
                    {c.descripcion}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "concesion",
            header: "Concesión",
            cell: (c) => concesionNombre(c.concesion_id),
          },
          {
            key: "precio",
            header: "Precio",
            cell: (c) => (
              <span className="font-semibold">
                {c.precio != null ? formatPrice(Number(c.precio)) : "—"}
              </span>
            ),
          },
          {
            key: "productos",
            header: "Productos",
            cell: (c) => (
              <div className="flex max-w-xs flex-wrap gap-1">
                {(c.productos ?? []).map((p) => (
                  <Badge key={p.producto_id} variant="outline">
                    {p.cantidad}× {productoNombre(p.producto_id)}
                  </Badge>
                ))}
              </div>
            ),
          },
          {
            key: "creado",
            header: "Creado",
            cell: (c) => (
              <div>
                <p>{formatDateTime(c.createdAt)}</p>
                <p className="text-[1.2rem] text-muted-foreground">
                  {c.createdByNombre ?? "—"}
                </p>
              </div>
            ),
          },
          {
            key: "estado",
            header: "Estado",
            cell: (c) => (
              <Badge variant={c.activo !== false ? "default" : "secondary"}>
                {c.activo !== false ? "Activo" : "Inactivo"}
              </Badge>
            ),
          },
          {
            key: "acciones",
            header: "Acciones",
            cell: (c) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  Editar
                </Button>
                {c.activo !== false ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleToggleActivo(c)}
                  >
                    Desactivar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleToggleActivo(c)}
                  >
                    Reactivar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setDeletingCombo(c);
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

      {/* Modal crear/editar combo */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCombo ? "Editar combo" : "Nuevo combo"}
            </DialogTitle>
            <DialogDescription>
              Selecciona la concesión y arma el combo con sus productos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
            {!editingCombo ? (
              <Field label="Concesión" htmlFor="comboConcesion">
                <NativeSelect
                  id="comboConcesion"
                  value={formConcesionId}
                  onChange={(e) => {
                    setFormConcesionId(e.target.value);
                    setLineas([emptyLinea()]);
                  }}
                  required
                >
                  <option value="">Selecciona concesión</option>
                  {concessions
                    .filter((c) => c.activo !== false)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                </NativeSelect>
              </Field>
            ) : (
              <p className="text-[1.3rem] text-muted-foreground">
                Concesión: {concesionNombre(editingCombo.concesion_id)}
              </p>
            )}

            <Field label="Título" htmlFor="comboTitulo">
              <Input
                id="comboTitulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Combo botanero"
                required
              />
            </Field>

            <Field label="Descripción" htmlFor="comboDescripcion" hint="Opcional">
              <Input
                id="comboDescripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. 2 cervezas + palomitas grandes"
              />
            </Field>

            <Field label="Precio del combo" htmlFor="comboPrecio">
              <Input
                id="comboPrecio"
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej. 150.00"
                required
              />
            </Field>

            <Field label="Productos del combo">
              <div className="space-y-2">
                {lineas.map((linea, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <NativeSelect
                      className="flex-1"
                      value={linea.producto_id}
                      aria-label={`Producto ${idx + 1}`}
                      onChange={(e) =>
                        setLinea(idx, { producto_id: e.target.value })
                      }
                      disabled={!formConcesionId}
                    >
                      <option value="">Selecciona producto</option>
                      {productosDeConcesion.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </NativeSelect>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      className="w-24"
                      value={linea.cantidad}
                      aria-label={`Cantidad ${idx + 1}`}
                      onChange={(e) => setLinea(idx, { cantidad: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar producto"
                      disabled={lineas.length === 1}
                      onClick={() =>
                        setLineas((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!formConcesionId}
                  onClick={() => setLineas((prev) => [...prev, emptyLinea()])}
                >
                  <Plus className="size-4" />
                  Agregar producto
                </Button>
              </div>
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : editingCombo ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal eliminar definitivamente */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar combo definitivamente?</DialogTitle>
            <DialogDescription>
              &quot;{deletingCombo?.titulo}&quot; se borrará de la base de datos
              y no se podrá recuperar. Si solo quieres ocultarlo, usa
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

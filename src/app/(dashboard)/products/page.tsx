"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Plus, RefreshCw } from "lucide-react";
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
import { usePermissions } from "@/hooks/use-permissions";
import { useConcessions } from "@/hooks/use-concessions";
import { useSucursales } from "@/hooks/use-sucursales";
import {
  useProducts,
  MAX_IMAGE_BYTES,
  type Product,
  type ProductPayload,
} from "@/hooks/use-products";
import { formatPrice } from "@/lib/format";
import { normalizeStorageImageUrl } from "@/lib/image-url";

type ProductFormValues = {
  nombre: string;
  unidad_medida: string;
  precio: string;
  activo: boolean;
};

const emptyForm = (): ProductFormValues => ({
  nombre: "",
  unidad_medida: "",
  precio: "",
  activo: true,
});

export default function ProductsPage() {
  const { canManageProducts, isVendedor, isSuperAdmin } = usePermissions();
  const {
    products,
    loading,
    error,
    refetch,
    createProduct,
    createProductWithImages,
    uploadProductImages,
    updateProduct,
    deleteProduct,
  } = useProducts();
  const { concessions } = useConcessions();
  const { sucursales } = useSucursales();
  const [concesionFilter, setConcesionFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(emptyForm());
  const [formConcesionId, setFormConcesionId] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = canManageProducts;

  const filteredProducts = useMemo(() => {
    if (!isSuperAdmin || !concesionFilter) return products;
    return products.filter(
      (p) => (p.concesion_id ?? p.concesionId) === concesionFilter,
    );
  }, [products, isSuperAdmin, concesionFilter]);

  const sucursalesContexto = useMemo(() => {
    if (!concesionFilter) return [];
    return sucursales.filter((s) => s.concesion_id === concesionFilter);
  }, [sucursales, concesionFilter]);

  const concesionNombre = (id?: string) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  useEffect(() => {
    if (imageFiles.length === 0) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFiles[0]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFiles]);

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormValues(emptyForm());
    setFormConcesionId(concesionFilter || "");
    setImageFiles([]);
    setDialogOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormValues({
      nombre: product.nombre ?? "",
      unidad_medida: product.unidad_medida ?? "",
      precio: product.precio?.toString() ?? "",
      activo: product.activo !== false,
    });
    setImageFiles([]);
    setDialogOpen(true);
  };

  const closeForm = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormValues(emptyForm());
    setImageFiles([]);
  };

  const validateForm = (): string | null => {
    if (isSuperAdmin && !editingProduct && !formConcesionId) {
      return "Selecciona la concesión del producto";
    }
    if (!formValues.nombre.trim()) return "El nombre es obligatorio";
    if (!formValues.precio || Number(formValues.precio) < 0) {
      return "Ingresa un precio válido (≥ 0)";
    }
    for (const file of imageFiles) {
      if (file.size > MAX_IMAGE_BYTES) {
        return `"${file.name}" supera 5 MB`;
      }
    }
    return null;
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files?.length) return;
    setImageFiles(Array.from(files).slice(0, 5));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    const payload: ProductPayload = {
      nombre: formValues.nombre.trim(),
      unidad_medida: formValues.unidad_medida.trim() || "Unidad",
      precio: Number(formValues.precio),
      activo: formValues.activo,
      ...(isSuperAdmin && !editingProduct && formConcesionId
        ? { concesionId: formConcesionId }
        : {}),
    };

    try {
      if (editingProduct?.id) {
        await updateProduct(editingProduct.id, payload);
        if (imageFiles.length > 0) {
          await uploadProductImages(editingProduct.id, imageFiles);
        }
        toast.success("Producto actualizado");
      } else {
        if (imageFiles.length > 0) {
          await createProductWithImages(payload, imageFiles);
        } else {
          await createProduct(payload);
        }
        toast.success("Producto creado");
      }
      await refetch();
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el producto");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct?.id) return;
    setSubmitting(true);
    try {
      await deleteProduct(deletingProduct.id);
      toast.success(`"${deletingProduct.nombre}" eliminado`);
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole authenticated>
      <PageHeader
        title="Productos"
        description={
          isSuperAdmin
            ? "Gestiona el catálogo de productos por concesión."
            : isVendedor
              ? "Catálogo disponible para vender."
              : "Gestiona el catálogo de tu concesión con imágenes."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button size="sm" onClick={openCreateForm}>
                <Plus className="size-4" />
                Agregar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              Actualizar
            </Button>
          </div>
        }
      />

      {isSuperAdmin && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-full max-w-xs">
            <NativeSelect
              value={concesionFilter}
              onChange={(e) => setConcesionFilter(e.target.value)}
              aria-label="Filtrar por concesión"
            >
              <option value="">Todas las concesiones</option>
              {concessions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </NativeSelect>
          </div>
          {concesionFilter && (
            <p className="text-[1.3rem] text-muted-foreground">
              Sucursales:{" "}
              {sucursalesContexto.length === 0
                ? "ninguna"
                : sucursalesContexto.map((s) => s.nombre ?? s.id).join(", ")}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
          {error}
        </div>
      )}

      <DataTable<Product>
        loading={loading}
        data={filteredProducts}
        getRowKey={(p) => p.id ?? p.nombre}
        emptyMessage="No hay productos registrados aún."
        columns={[
          {
            key: "img",
            header: "Imagen",
            cell: (p) => {
              const img = normalizeStorageImageUrl(String(p.imagenes?.[0] ?? ""));
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
            cell: (p) => <span className="font-medium">{p.nombre}</span>,
          },
          ...(isSuperAdmin
            ? [
                {
                  key: "concesion",
                  header: "Concesión",
                  cell: (p: Product) =>
                    concesionNombre(
                      (p.concesion_id ?? p.concesionId) as string | undefined,
                    ),
                },
              ]
            : []),
          {
            key: "precio",
            header: "Precio",
            cell: (p) => formatPrice(Number(p.precio)),
          },
          {
            key: "unidad",
            header: "Unidad",
            cell: (p) => p.unidad_medida ?? "—",
          },
          {
            key: "estado",
            header: "Estado",
            cell: (p) => (
              <Badge variant={p.activo !== false ? "default" : "secondary"}>
                {p.activo !== false ? "Activo" : "Inactivo"}
              </Badge>
            ),
          },
          ...(canManage
            ? [
                {
                  key: "acciones",
                  header: "Acciones",
                  cell: (p: Product) => (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditForm(p)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => confirmDelete(p)}>
                        Eliminar
                      </Button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
            <DialogDescription>
              Completa los datos y sube una imagen desde tu dispositivo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {isSuperAdmin && !editingProduct && (
              <Field label="Concesión" htmlFor="productConcesion">
                <NativeSelect
                  id="productConcesion"
                  value={formConcesionId}
                  onChange={(e) => setFormConcesionId(e.target.value)}
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
            )}
            {isSuperAdmin && editingProduct && (
              <p className="text-[1.3rem] text-muted-foreground">
                Concesión:{" "}
                {concesionNombre(
                  (editingProduct.concesion_id ?? editingProduct.concesionId) as
                    | string
                    | undefined,
                )}
              </p>
            )}
            <Field label="Nombre" htmlFor="nombre">
              <Input
                id="nombre"
                value={formValues.nombre}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ej. Hamburguesa clásica"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Unidad" htmlFor="unidad_medida">
                <Input
                  id="unidad_medida"
                  value={formValues.unidad_medida}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, unidad_medida: e.target.value }))
                  }
                  placeholder="pieza, kg"
                />
              </Field>
              <Field label="Precio" htmlFor="precio">
                <Input
                  id="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValues.precio}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, precio: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>
            <Field label="Imagen" hint="JPEG, PNG o WebP · máx. 5 MB">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files)}
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
              {(previewUrl || editingProduct?.imagenes?.[0]) && (
                <div className="mt-1 overflow-hidden rounded-[8px] border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      previewUrl ??
                      normalizeStorageImageUrl(String(editingProduct?.imagenes?.[0]))
                    }
                    alt="Vista previa"
                    className="aspect-video w-full object-cover"
                  />
                </div>
              )}
            </Field>
            <label className="flex items-center gap-3 text-[1.4rem]" htmlFor="activo">
              <Checkbox
                id="activo"
                checked={formValues.activo}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, activo: e.target.checked }))
                }
              />
              Producto activo
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : editingProduct ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              Se eliminará &quot;{deletingProduct?.nombre}&quot; del catálogo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={submitting} onClick={() => void handleDelete()}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

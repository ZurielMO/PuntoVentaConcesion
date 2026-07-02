"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useProducts,
  MAX_IMAGE_BYTES,
  type Product,
  type ProductPayload,
} from "@/hooks/use-products";
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
  const { user, loading: authLoading } = useAuth();
  const { canManageProducts, isVendedor } = usePermissions();
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(emptyForm());
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = canManageProducts;

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

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[1.6rem] text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-[var(--outer-gutter)] py-[var(--space-6)] text-center">
        <h1>Productos</h1>
        <p className="mt-4 text-[1.6rem] text-muted-foreground">
          Inicia sesión para ver el catálogo conectado al backend.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-warm py-[var(--space-5)]">
      <div className="mx-auto max-w-[1440px] px-[var(--outer-gutter)] lg:px-[var(--outer-gutter-lg)]">
        <div className="pos-gradient-header mb-8 p-6 md:p-8">
          <h1 className="!text-white">Productos</h1>
          <p className="mt-2 text-[1.6rem] text-white/80">
            {isVendedor
              ? "Catálogo disponible para vender."
              : "Gestiona el catálogo de tu concesión con imágenes."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {canManage && (
              <Button variant="secondary" onClick={openCreateForm}>
                Agregar producto
              </Button>
            )}
            <Button variant="on-dark" onClick={() => void refetch()}>
              Actualizar
            </Button>
          </div>
        </div>

        {loading && (
          <p className="text-[1.6rem] text-muted-foreground">Cargando productos…</p>
        )}

        {error && (
          <div className="mb-4 rounded-[var(--card-border-radius)] bg-red-50 p-4 text-[1.4rem] text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="text-[1.6rem] text-muted-foreground">
            No hay productos registrados aún.
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-3">
              <ProductCard product={product} />
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditForm(product)}>
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmDelete(product)}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
            <div className="space-y-2">
              <label className="text-[1.4rem] font-medium" htmlFor="nombre">
                Nombre
              </label>
              <Input
                id="nombre"
                value={formValues.nombre}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ej. Hamburguesa clásica"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[1.4rem] font-medium" htmlFor="unidad_medida">
                  Unidad
                </label>
                <Input
                  id="unidad_medida"
                  value={formValues.unidad_medida}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, unidad_medida: e.target.value }))
                  }
                  placeholder="pieza, kg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[1.4rem] font-medium" htmlFor="precio">
                  Precio
                </label>
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
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[1.4rem] font-medium">Imagen</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Elegir imagen
                </Button>
                <span className="text-[1.3rem] text-muted-foreground">
                  JPEG, PNG o WebP · máx. 5 MB
                </span>
              </div>
              {(previewUrl || editingProduct?.imagenes?.[0]) && (
                <div className="mt-2 overflow-hidden rounded-[var(--card-border-radius)] border">
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
            </div>
            <div className="flex items-center gap-3">
              <input
                id="activo"
                type="checkbox"
                checked={formValues.activo}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, activo: e.target.checked }))
                }
              />
              <label className="text-[1.4rem]" htmlFor="activo">
                Producto activo
              </label>
            </div>
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
    </div>
  );
}

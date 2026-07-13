"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ImagePlus,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import { usePermissions } from "@/hooks/use-permissions";
import { useConcesionFilterParam } from "@/hooks/use-concesion-filter-param";
import { useActiveConcesionOptional } from "@/hooks/use-active-concesion";
import { useConcessions } from "@/hooks/use-concessions";
import { useSucursales } from "@/hooks/use-sucursales";
import {
  useProducts,
  MAX_IMAGE_BYTES,
  type Product,
  type ProductPayload,
} from "@/hooks/use-products";
import { formatPrice } from "@/lib/format";
import { firstStoredImage } from "@/lib/image-url";
import "@/styles/wizard-alta.css";

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
  const activeCtx = useActiveConcesionOptional();
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
  } = useProducts({ includeInactive: true });
  const { concessions } = useConcessions();
  const { sucursales } = useSucursales();
  const [concesionFilter, setConcesionFilter] = useConcesionFilterParam();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(emptyForm());
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
    return sucursales.filter(
      (s) => s.concesion_id === concesionFilter && s.activo !== false,
    );
  }, [sucursales, concesionFilter]);

  const concesionNombre = (id?: string) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  const setConcesion = (value: string) => {
    setConcesionFilter(value);
    activeCtx?.setActiveConcesionId(value || null);
  };

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
    if (isSuperAdmin && !concesionFilter) {
      toast.error("Selecciona una concesión primero");
      return;
    }
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
    if (isSuperAdmin && !editingProduct && !concesionFilter) {
      return "Selecciona una concesión primero";
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
      activo: editingProduct ? formValues.activo : true,
      ...(isSuperAdmin && !editingProduct && concesionFilter
        ? { concesionId: concesionFilter }
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
      toast.error(
        err instanceof Error ? err.message : "No se pudo guardar el producto",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActivo = async (product: Product) => {
    if (!product.id) {
      toast.error("Producto sin identificador");
      return;
    }
    try {
      if (product.activo === false) {
        await updateProduct(product.id, { activo: true });
        toast.success("Producto reactivado");
      } else {
        await deleteProduct(product.id);
        toast.success("Producto desactivado");
      }
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al cambiar estado",
      );
    }
  };

  const needsConcesionPick = isSuperAdmin && !concesionFilter;
  const panelTitle = isSuperAdmin
    ? concesionFilter
      ? concesionNombre(concesionFilter)
      : "Productos"
    : "Catálogo";

  return (
    <RequireRole authenticated>
      <div className="wizard-alta wizard-alta__shell wizard-alta__shell--fill">
        <header className="wizard-alta__hero">
          <div className="wizard-alta__hero-inner">
            <div>
              <h1>Productos</h1>
              <p>
                {isSuperAdmin
                  ? "El menú que se vende en el POS. Filtra por concesión y agrega productos con precio."
                  : isVendedor
                    ? "Catálogo disponible para vender en el punto de venta."
                    : "El menú de tu concesión: agrega productos con nombre, precio e imagen."}
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
            {isSuperAdmin && (
              <div className="wizard-alta__sidebar-filter">
                <Field label="1) Elige concesión" htmlFor="concesionFilter">
                  <NativeSelect
                    id="concesionFilter"
                    value={concesionFilter}
                    onChange={(e) => setConcesion(e.target.value)}
                  >
                    <option value="">Selecciona una concesión</option>
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
            )}

            {needsConcesionPick ? (
              <p className="wizard-alta__empty">
                Primero elige la concesión. Después verás y crearás su menú de
                productos.
              </p>
            ) : (
              <>
                {canManage && (
                  <button
                    type="button"
                    className="wizard-alta__btn wizard-alta__btn--primary w-full"
                    onClick={openCreateForm}
                  >
                    <Plus className="size-4" />
                    Nuevo producto
                  </button>
                )}
                {isSuperAdmin && concesionFilter && (
                  <p className="wizard-alta__hint wizard-alta__hint--optional mt-3">
                    Sucursales:{" "}
                    {sucursalesContexto.length === 0
                      ? "ninguna aún (créalas en Sucursales y cajas)"
                      : sucursalesContexto
                          .map((s) => s.nombre ?? s.id)
                          .join(", ")}
                  </p>
                )}
              </>
            )}
          </aside>

          <div className="wizard-alta__panel">
            {needsConcesionPick ? (
              <div className="wizard-alta__panel-body">
                <p className="wizard-alta__hint">
                  1) Elige la concesión a la izquierda → 2) Pulsa{" "}
                  <strong>Nuevo producto</strong> → 3) Indica nombre, precio e
                  imagen.
                </p>
                <p className="wizard-alta__empty">
                  Selecciona una concesión para ver su menú.
                </p>
              </div>
            ) : (
              <>
                <div className="wizard-alta__panel-head">
                  <h2 className="wizard-alta__panel-title">{panelTitle}</h2>
                  <p className="wizard-alta__panel-sub">
                    {loading
                      ? "Cargando…"
                      : `${filteredProducts.length} producto(s) en el menú`}
                  </p>
                </div>

                <div className="wizard-alta__panel-body">
                  {loading ? (
                    <p className="wizard-alta__empty">Cargando productos…</p>
                  ) : filteredProducts.length === 0 ? (
                    <div>
                      <p className="wizard-alta__hint">
                        {canManage
                          ? "El menú está vacío. Pulsa Crear producto para agregar el primero con nombre, precio e imagen."
                          : "No hay productos registrados aún."}
                      </p>
                      <p className="wizard-alta__empty">
                        {canManage
                          ? "Aún no hay productos. Crea el primero para el POS."
                          : "No hay productos en el catálogo."}
                      </p>
                      {canManage && (
                        <button
                          type="button"
                          className="wizard-alta__btn wizard-alta__btn--primary mt-3"
                          onClick={openCreateForm}
                        >
                          <Plus className="size-4" />
                          Crear producto
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {canManage && (
                        <p className="wizard-alta__hint">
                          Estos productos aparecen en el POS. Usa{" "}
                          <strong>Nuevo producto</strong> para agregar más.
                        </p>
                      )}
                      <div
                        className={`wizard-alta__table-wrap${
                          filteredProducts.length > 8
                            ? " wizard-alta__table-wrap--scroll"
                            : ""
                        }`}
                      >
                        <table className="wizard-alta__table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Precio</th>
                              <th>Unidad</th>
                              {isSuperAdmin && !concesionFilter && (
                                <th>Concesión</th>
                              )}
                              <th>Estado</th>
                              {canManage && (
                                <th className="wizard-alta__table-actions-col">
                                  Acciones
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map((p) => {
                              const activo = p.activo !== false;
                              const img = firstStoredImage(p.imagenes);
                              const concesionId = (p.concesion_id ??
                                p.concesionId) as string | undefined;
                              return (
                                <tr
                                  key={p.id ?? p.nombre}
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
                                        />
                                      ) : null}
                                      <span className="wizard-alta__table-name">
                                        {p.nombre}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="wizard-alta__chip">
                                      {formatPrice(Number(p.precio))}
                                    </span>
                                  </td>
                                  <td className="wizard-alta__table-muted">
                                    {p.unidad_medida ?? "Unidad"}
                                  </td>
                                  {isSuperAdmin && !concesionFilter && (
                                    <td className="wizard-alta__table-muted">
                                      {concesionNombre(concesionId)}
                                    </td>
                                  )}
                                  <td>
                                    <span
                                      className={`wizard-alta__status-pill ${
                                        activo
                                          ? "wizard-alta__status-pill--on"
                                          : "wizard-alta__status-pill--off"
                                      }`}
                                    >
                                      {activo ? "Activo" : "Inactivo"}
                                    </span>
                                  </td>
                                  {canManage && (
                                    <td className="wizard-alta__table-actions-col">
                                      <div className="wizard-alta__table-actions">
                                        <button
                                          type="button"
                                          className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                          onClick={() => openEditForm(p)}
                                        >
                                          <Pencil className="size-3.5" />
                                          Editar
                                        </button>
                                        {activo ? (
                                          <button
                                            type="button"
                                            className="wizard-alta__btn wizard-alta__btn--danger wizard-alta__btn--sm"
                                            onClick={() =>
                                              void handleToggleActivo(p)
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
                                              void handleToggleActivo(p)
                                            }
                                          >
                                            <Power className="size-3.5" />
                                            Reactivar
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="wizard-alta wizard-alta__dialog wizard-alta__dialog--wide !flex !max-w-[64rem] !flex-col !gap-0 !p-0">
          <div className="wizard-alta__dialog-head">
            <DialogHeader className="text-left">
              <DialogTitle className="wizard-alta__dialog-title">
                {editingProduct ? "Editar producto" : "Nuevo producto"}
              </DialogTitle>
              <DialogDescription className="wizard-alta__dialog-sub">
                {editingProduct
                  ? "Actualiza nombre, precio o imagen del producto."
                  : isSuperAdmin && concesionFilter
                    ? `Alta para ${concesionNombre(concesionFilter)}. Indica nombre, precio e imagen.`
                    : "Indica nombre, precio e imagen. Así aparecerá en el menú del POS."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="wizard-alta__dialog-body">
            <div className="wizard-alta__dialog-fields wizard-alta__dialog-fields--grid">
              <Field
                label="Nombre"
                htmlFor="nombre"
                className="wizard-alta__field-span"
              >
                <Input
                  id="nombre"
                  value={formValues.nombre}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  placeholder="Ej. Hamburguesa clásica"
                  required
                />
              </Field>
              <Field label="Unidad" htmlFor="unidad_medida">
                <Input
                  id="unidad_medida"
                  value={formValues.unidad_medida}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      unidad_medida: e.target.value,
                    }))
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
                    setFormValues((prev) => ({
                      ...prev,
                      precio: e.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field
                label="Imagen"
                hint="JPEG, PNG o WebP · máx. 5 MB"
                className="wizard-alta__field-span"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files)}
                />
                <button
                  type="button"
                  className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm w-fit"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  Elegir imagen
                </button>
                {(previewUrl || firstStoredImage(editingProduct?.imagenes)) && (
                  <div className="mt-2 overflow-hidden rounded-[8px] border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        previewUrl ??
                        firstStoredImage(editingProduct?.imagenes) ??
                        ""
                      }
                      alt="Vista previa"
                      className="aspect-video w-full max-h-48 object-cover"
                    />
                  </div>
                )}
              </Field>
              {editingProduct && (
                <label
                  className="wizard-alta__field-span flex items-center gap-3 text-[1.4rem]"
                  htmlFor="activo"
                >
                  <Checkbox
                    id="activo"
                    checked={formValues.activo}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        activo: e.target.checked,
                      }))
                    }
                  />
                  Producto activo
                </label>
              )}
            </div>
            <div className="wizard-alta__footer">
              <button
                type="button"
                className="wizard-alta__btn wizard-alta__btn--secondary"
                onClick={closeForm}
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
                  : editingProduct
                    ? "Guardar cambios"
                    : "Crear producto"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

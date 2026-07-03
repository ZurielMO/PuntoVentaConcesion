"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";

export type Product = {
  id: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
  imagenes?: string[];
  activo?: boolean;
  categoria?: string;
  unidad_medida?: string;
  concesion_id?: string;
  concesionId?: string;
  [key: string]: unknown;
};

export type ProductPayload = {
  nombre: string;
  unidad_medida: string;
  precio: number;
  imagenes?: string[];
  activo?: boolean;
  /** Requerido cuando el SuperAdmin crea productos para una concesión. */
  concesionId?: string;
};

export const MAX_IMAGES_PER_PRODUCT = 5;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function buildProductFormData(payload: ProductPayload, files?: File[]): FormData {
  const form = new FormData();
  form.append("nombre", payload.nombre);
  form.append("unidad_medida", payload.unidad_medida);
  form.append("precio", String(payload.precio));
  form.append("activo", String(payload.activo !== false));
  if (payload.concesionId) {
    form.append("concesionId", payload.concesionId);
  }
  files?.forEach((file) => form.append("images", file));
  return form;
}

export function useProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Product[]>>(apiPaths.products, token);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar productos");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createProduct = useCallback(
    async (product: ProductPayload) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.post<ApiResponse<Product>>(apiPaths.products, product, token);
      const createdProduct = res.data;
      if (createdProduct) {
        setProducts((prev) => [createdProduct, ...prev]);
      }
      return createdProduct;
    },
    [token],
  );

  const createProductWithImages = useCallback(
    async (product: ProductPayload, files: File[]) => {
      if (!token) throw new Error("Sin sesión");
      for (const file of files) {
        if (file.size > MAX_IMAGE_BYTES) {
          throw new Error(`"${file.name}" supera el límite de 5 MB`);
        }
      }
      const form = buildProductFormData(product, files);
      const res = await api.postFormData<ApiResponse<Product>>(
        apiPaths.products,
        form,
        token,
      );
      const createdProduct = res.data;
      if (createdProduct) {
        setProducts((prev) => [createdProduct, ...prev]);
      }
      return createdProduct;
    },
    [token],
  );

  const uploadProductImages = useCallback(
    async (id: string, files: File[]) => {
      if (!token) throw new Error("Sin sesión");
      for (const file of files) {
        if (file.size > MAX_IMAGE_BYTES) {
          throw new Error(`"${file.name}" supera el límite de 5 MB`);
        }
      }
      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      const res = await api.postFormData<ApiResponse<Product>>(
        `${apiPaths.products}/${id}/images`,
        form,
        token,
      );
      const updated = res.data;
      if (updated) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      }
      return updated;
    },
    [token],
  );

  const deleteProductImage = useCallback(
    async (id: string, index: number) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.delete<ApiResponse<Product>>(
        `${apiPaths.products}/${id}/images/${index}`,
        token,
      );
      const updated = res.data;
      if (updated) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      }
      return updated;
    },
    [token],
  );

  const updateProduct = useCallback(
    async (id: string, product: Partial<ProductPayload>) => {
      if (!token) throw new Error("Sin sesión");
      const res = await api.put<ApiResponse<Product>>(
        `${apiPaths.products}/${id}`,
        product,
        token,
      );
      const updatedProduct = res.data;
      if (updatedProduct) {
        setProducts((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedProduct } : item)),
        );
      }
      return updatedProduct;
    },
    [token],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Sin sesión");
      await api.delete(`${apiPaths.products}/${id}`, token);
      setProducts((prev) => prev.filter((item) => item.id !== id));
    },
    [token],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    createProductWithImages,
    uploadProductImages,
    deleteProductImage,
    updateProduct,
    deleteProduct,
  };
}

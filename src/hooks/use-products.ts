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
  activo?: boolean;
  categoria?: string;
  [key: string]: unknown;
};

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
      setProducts(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar productos");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

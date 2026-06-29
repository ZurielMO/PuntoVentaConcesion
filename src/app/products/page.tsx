"use client";

import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProducts } from "@/hooks/use-products";

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const { products, loading, error, refetch } = useProducts();

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
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1>Productos</h1>
            <p className="mt-2 text-[1.6rem] text-muted-foreground">
              Catálogo desde GET /api/products
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Actualizar
          </Button>
        </div>

        {loading && (
          <p className="text-[1.6rem] text-muted-foreground">Cargando productos…</p>
        )}

        {error && (
          <div className="rounded-[var(--card-border-radius)] bg-red-50 p-4 text-[1.4rem] text-destructive">
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
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

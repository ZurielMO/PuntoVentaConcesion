import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/hooks/use-products";

type ProductCardProps = {
  product: Product;
};

function formatPrice(precio?: number) {
  if (precio === undefined || precio === null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(precio);
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden transition-transform hover:-translate-y-0.5">
      <CardHeader className="pb-0">
        <div className="mb-3 flex aspect-square items-center justify-center rounded-[var(--card-border-radius)] bg-ceramic text-[4rem]">
          {product.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(product.imagen)}
              alt={product.nombre ?? "Producto"}
              className="size-full object-cover"
            />
          ) : (
            "🍔"
          )}
        </div>
        <CardTitle className="line-clamp-2 text-[1.8rem]">
          {product.nombre ?? "Sin nombre"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-[1.4rem] text-muted-foreground">
          {product.descripcion ?? "Sin descripción"}
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-[1.8rem] font-semibold text-starbucks-green">
          {formatPrice(product.precio as number | undefined)}
        </span>
        {product.activo === false && (
          <span className="text-[1.3rem] text-destructive">Inactivo</span>
        )}
      </CardFooter>
    </Card>
  );
}

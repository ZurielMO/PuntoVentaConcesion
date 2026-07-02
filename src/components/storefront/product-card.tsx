import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/hooks/use-products";
import { firstProductImage } from "@/lib/image-url";
import { Package } from "lucide-react";

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
  const imageUrl = firstProductImage(product.imagenes, product.imagen);

  return (
    <Card className="overflow-hidden transition-transform hover:-translate-y-0.5">
      <CardHeader className="pb-0">
        <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-[var(--card-border-radius)] bg-ceramic">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(imageUrl)}
              alt={product.nombre ?? "Producto"}
              className="size-full object-cover"
            />
          ) : (
            <Package className="size-16 text-green-accent/35" strokeWidth={1.25} />
          )}
        </div>
        <CardTitle className="line-clamp-2 text-[1.8rem]">
          {product.nombre ?? "Sin nombre"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-[1.4rem] text-muted-foreground">
          {product.descripcion ?? product.unidad_medida ?? "Sin descripción"}
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

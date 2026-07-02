"use client";

import { cn } from "@/lib/utils";
import { firstProductImage } from "@/lib/image-url";
import { Package } from "lucide-react";
import type { Product } from "@/hooks/use-products";

type PosProductTileProps = {
  product: Product;
  disponible: number;
  onSelect: () => void;
  disabled?: boolean;
};

function formatPrice(precio?: number) {
  if (precio === undefined || precio === null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(precio);
}

export function PosProductTile({
  product,
  disponible,
  onSelect,
  disabled,
}: PosProductTileProps) {
  const imageUrl = firstProductImage(product.imagenes, product.imagen);
  const outOfStock = disponible <= 0 || disabled;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={outOfStock}
      className={cn(
        "pos-tile glass-card flex w-full flex-col overflow-hidden text-left",
        outOfStock && "cursor-not-allowed opacity-50",
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-ceramic">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={String(imageUrl)}
            alt={product.nombre ?? "Producto"}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-green-accent/40">
            <Package className="size-16" strokeWidth={1.25} />
          </div>
        )}
        <span
          className={cn(
            "absolute right-2 top-2 rounded-full px-3 py-1 text-[1.2rem] font-semibold",
            outOfStock
              ? "bg-destructive/90 text-white"
              : "bg-green-accent/90 text-white",
          )}
        >
          {outOfStock ? "Agotado" : `Disp. ${disponible}`}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 text-[1.7rem] font-semibold text-house-green">
          {product.nombre ?? "Producto"}
        </p>
        <p className="text-[2rem] font-bold text-starbucks-green">
          {formatPrice(product.precio as number | undefined)}
        </p>
      </div>
    </button>
  );
}

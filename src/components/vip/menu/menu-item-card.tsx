"use client";

import React, { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import type { VipProduct } from "@/lib/vip/types";
import { formatVipPrice } from "@/lib/vip/money";
import { useVipProductSheet } from "@/hooks/vip/use-vip-product-sheet";
import { VipMedia } from "../ui/media";

interface VipProductCardProps {
  product: VipProduct;
  /** Se muestra en búsquedas y rieles de inicio, donde el producto viene de varios lugares. */
  restaurantName?: string;
  layout?: "row" | "tile";
  /** Las primeras imágenes de la página cargan antes. */
  priority?: boolean;
}

function QuickAddButton({
  product,
  restaurantName,
  className = "",
}: {
  product: VipProduct;
  restaurantName?: string;
  className?: string;
}) {
  const { quickAdd, availabilityOf } = useVipProductSheet();
  const availability = availabilityOf(product);
  const [done, setDone] = useState(false);
  const hasChoices = (product.gruposOpciones || []).some((group) => group.opciones.length > 0);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(false), 900);
    return () => window.clearTimeout(id);
  }, [done]);

  if (availability.state === "closed" || availability.state === "loading") return null;

  return (
    <button
      type="button"
      disabled={!availability.canAdd}
      onClick={(event) => {
        event.stopPropagation();
        quickAdd(product, restaurantName);
        if (!hasChoices) setDone(true);
      }}
      aria-label={
        !availability.canAdd
          ? `${product.nombre}: ${availability.label}`
          : hasChoices
            ? `Elegir opciones de ${product.nombre}`
            : `Agregar ${product.nombre} al carrito`
      }
      className={`palco-press z-10 flex size-10 items-center justify-center rounded-full shadow-palco-raise ring-1 ring-black/5 ${
        done ? "bg-palco-700 text-white" : "bg-palco-surface text-palco-900 hover:bg-palco-50"
      } disabled:bg-palco-sunken disabled:text-palco-line-strong disabled:shadow-none ${className}`}
    >
      {done ? <Check aria-hidden className="size-5 stroke-[2.5]" /> : <Plus aria-hidden className="size-5 stroke-[2.5]" />}
    </button>
  );
}

function StateLabel({ product }: { product: VipProduct }) {
  const { availabilityOf } = useVipProductSheet();
  const availability = availabilityOf(product);
  if (availability.state === "sold-out") {
    return <span className="text-xs font-semibold text-palco-danger">{availability.label}</span>;
  }
  if (availability.state === "preorder-only") {
    return <span className="text-xs font-semibold text-palco-warning">{availability.label}</span>;
  }
  return null;
}

export const VipMenuItemCard: React.FC<VipProductCardProps> = ({ product, restaurantName, layout = "row", priority = false }) => {
  const { openProduct, availabilityOf } = useVipProductSheet();
  const description = product.descripcion.trim();
  const soldOut = availabilityOf(product).state === "sold-out";

  if (layout === "tile") {
    return (
      <article className="group relative flex w-[9.75rem] shrink-0 flex-col sm:w-44">
        <div className={`relative aspect-square overflow-hidden rounded-[var(--radius-palco-md)] border border-palco-line bg-palco-surface ${soldOut ? "opacity-60" : ""}`}>
          <VipMedia src={product.imagen} alt="" categoria={product.categoria} fit="cover" className="size-full" priority={priority} />
          <QuickAddButton product={product} restaurantName={restaurantName} className="absolute bottom-2 right-2" />
        </div>
        <h3 className="mt-2 line-clamp-2 font-palco-display text-[15px] font-bold leading-snug tracking-[-0.005em] text-palco-ink">
          <button
            type="button"
            onClick={() => openProduct(product, restaurantName)}
            className="palco-card-link text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {product.nombre}
          </button>
        </h3>
        {restaurantName && <p className="mt-0.5 truncate text-[13px] text-palco-ink-3">{restaurantName}</p>}
        <p className="palco-num mt-1 font-palco-display text-[15px] font-bold text-palco-ink">{formatVipPrice(product.precio)}</p>
        <StateLabel product={product} />
        <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-[calc(var(--radius-palco-md)+4px)] ring-2 ring-transparent group-has-[.palco-card-link:focus-visible]:ring-palco-700" />
      </article>
    );
  }

  return (
    <article className="group relative flex items-start gap-4 py-4">
      <div className="min-w-0 flex-1">
        <h3 className="font-palco-display text-base font-bold leading-snug tracking-[-0.005em] text-palco-ink">
          <button
            type="button"
            onClick={() => openProduct(product, restaurantName)}
            className="palco-card-link text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {product.nombre}
          </button>
        </h3>
        {restaurantName && <p className="mt-0.5 text-[13px] text-palco-ink-3">{restaurantName}</p>}
        {description && <p className="mt-1 line-clamp-2 text-sm leading-snug text-palco-ink-3">{description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="palco-num font-palco-display text-[15px] font-bold text-palco-ink">{formatVipPrice(product.precio)}</span>
          <StateLabel product={product} />
        </div>
      </div>
      <div className={`relative shrink-0 ${product.imagen ? "size-24 sm:size-28" : "size-12"}`}>
        {product.imagen && (
          <div className={`size-full overflow-hidden rounded-[var(--radius-palco-md)] border border-palco-line bg-palco-surface ${soldOut ? "opacity-60" : ""}`}>
            <VipMedia src={product.imagen} alt="" categoria={product.categoria} fit="cover" className="size-full" priority={priority} />
          </div>
        )}
        <QuickAddButton
          product={product}
          restaurantName={restaurantName}
          className={product.imagen ? "absolute bottom-1.5 right-1.5" : "absolute right-0 top-1"}
        />
      </div>
      <span aria-hidden className="pointer-events-none absolute -inset-x-2 inset-y-1 rounded-[var(--radius-palco-md)] ring-2 ring-transparent group-has-[.palco-card-link:focus-visible]:ring-palco-700" />
    </article>
  );
};

export { VipMenuItemCard as VipProductCard };

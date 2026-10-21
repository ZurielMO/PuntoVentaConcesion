"use client";

import React from "react";
import { Share2 } from "lucide-react";
import type { VipRestaurant } from "@/lib/vip/types";
import { formatVipPrice } from "@/lib/vip/money";
import { restaurantBadge, type VipSalesState } from "@/lib/vip/availability";
import { VipMedia } from "../ui/media";
import { vipToast } from "@/hooks/vip/use-vip-toast";

export function VipShareMenuButton({ name }: { name: string }) {
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} · Servicio Palcos`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      vipToast.success("Enlace copiado", {
        id: "vip-share-menu",
        description: "Compártelo con quienes están en tu palco.",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      vipToast.error("No se pudo compartir el enlace.");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Compartir el menú de ${name}`}
      className="palco-press flex size-10 items-center justify-center rounded-full text-palco-on-dark hover:bg-white/10"
    >
      <Share2 aria-hidden className="size-[18px]" />
    </button>
  );
}

const STATUS_TONE = {
  live: "text-palco-500",
  preorder: "text-palco-gold-ink",
  muted: "text-palco-ink-3",
} as const;

/** Portada del establecimiento: su arte oficial, el nombre y datos que sí existen. */
export const VipRestaurantHeader: React.FC<{ restaurant: VipRestaurant; sales: VipSalesState }> = ({ restaurant, sales }) => {
  const cover = restaurant.portada || restaurant.imagen;
  const badge = restaurantBadge(restaurant, sales);
  const count = restaurant.productos.length;
  // En la página del establecimiento sí se dice el modo: aquí no hay banda de estado.
  const status = !sales.ready
    ? null
    : badge
      ? { tone: badge.tone, label: badge.label }
      : sales.liveOrdersOpen
        ? { tone: "live" as const, label: "Entrega inmediata" }
        : sales.canOrder
          ? { tone: "preorder" as const, label: "Preventa" }
          : { tone: "muted" as const, label: "Cerrado por ahora" };

  return (
    <section aria-labelledby="palco-restaurant-title" className="mx-auto w-full max-w-6xl md:px-6 md:pt-6">
      <div className="relative h-44 w-full overflow-hidden border-b border-palco-line bg-palco-sunken sm:h-52 md:h-60 md:rounded-[var(--radius-palco-xl)] md:border">
        <VipMedia src={cover} alt="" categoria={restaurant.categoria} fit="brand" priority className="size-full" />
      </div>
      <div className="px-4 pt-4 md:px-0 md:pt-5">
        <h1
          id="palco-restaurant-title"
          className="font-palco-display text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.025em] text-palco-ink md:text-4xl"
        >
          {restaurant.nombre}
        </h1>
        <p className="palco-num mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-palco-ink-3">
          {restaurant.subtitulo && <span>{restaurant.subtitulo}</span>}
          {count > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>Desde {formatVipPrice(restaurant.precioMinimo)}</span>
            </>
          )}
          {status && (
            <>
              <span aria-hidden>·</span>
              <span className={`font-semibold ${STATUS_TONE[status.tone]}`}>{status.label}</span>
            </>
          )}
        </p>
      </div>
    </section>
  );
};

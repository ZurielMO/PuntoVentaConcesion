"use client";

import React from "react";
import Link from "next/link";
import type { VipRestaurant } from "@/lib/vip/types";
import { formatVipPrice } from "@/lib/vip/money";
import { vipRestaurantPath } from "@/lib/vip/vip-routes";
import { restaurantBadge, type VipSalesState } from "@/lib/vip/availability";
import { VipMedia } from "../ui/media";

const BADGE_TONE = {
  live: "bg-palco-surface text-palco-900",
  preorder: "bg-palco-900 text-palco-gold",
  muted: "bg-palco-surface text-palco-ink-2",
} as const;

export function VipRestaurantCard({
  restaurant,
  sales,
  priority = false,
}: {
  restaurant: VipRestaurant;
  sales: VipSalesState;
  priority?: boolean;
}) {
  const badge = restaurantBadge(restaurant, sales);
  const count = restaurant.productos.length;

  return (
    <article className="palco-lift group relative flex flex-col overflow-hidden rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface">
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-palco-line bg-palco-sunken">
        <VipMedia
          src={restaurant.portada || restaurant.imagen}
          alt=""
          categoria={restaurant.categoria}
          fit="brand"
          priority={priority}
          className="size-full"
        />
        {badge && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TONE[badge.tone]}`}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3.5 pt-3 sm:px-4 sm:pb-4">
        <h3 className="font-palco-display text-[15px] font-bold leading-snug tracking-[-0.01em] text-palco-ink sm:text-[17px]">
          <Link
            href={vipRestaurantPath(restaurant.id)}
            className="palco-card-link after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {restaurant.nombre}
          </Link>
        </h3>
        {restaurant.subtitulo && <p className="mt-0.5 truncate text-[13px] text-palco-ink-3">{restaurant.subtitulo}</p>}
        {count > 0 && (
          <p className="palco-num mt-auto pt-1.5 text-[13px] text-palco-ink-2">
            Desde {formatVipPrice(restaurant.precioMinimo)}
            <span className="hidden text-palco-ink-3 sm:inline">
              <span aria-hidden> · </span>
              {count} {count === 1 ? "producto" : "productos"}
            </span>
          </p>
        )}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[var(--radius-palco-lg)] ring-2 ring-inset ring-transparent group-has-[.palco-card-link:focus-visible]:ring-palco-700"
      />
    </article>
  );
}

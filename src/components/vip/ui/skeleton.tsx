"use client";

import React from "react";

export const VipSkeleton: React.FC<{ className?: string; dark?: boolean }> = ({ className = "", dark = false }) => (
  <span aria-hidden className={`palco-skeleton block rounded-[var(--radius-palco-sm)] ${dark ? "palco-skeleton-dark" : ""} ${className}`} />
);

export const VipRestaurantCardSkeleton = () => (
  <div className="overflow-hidden rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface">
    <VipSkeleton className="aspect-[16/9] w-full rounded-none" />
    <div className="flex flex-col gap-2.5 p-4">
      <VipSkeleton className="h-5 w-2/3" />
      <VipSkeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const VipMenuItemSkeleton = () => (
  <div className="flex items-start gap-4 border-b border-palco-line py-4 last:border-b-0">
    <div className="flex flex-1 flex-col gap-2 pt-1">
      <VipSkeleton className="h-5 w-3/5" />
      <VipSkeleton className="h-4 w-4/5" />
      <VipSkeleton className="mt-1 h-5 w-16" />
    </div>
    <VipSkeleton className="size-24 shrink-0 rounded-[var(--radius-palco-md)]" />
  </div>
);

/** Inicio cargando: banda de contexto, búsqueda, chips y tarjetas, en la misma geometría. */
export const VipHomeSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <div className="flex gap-2 overflow-hidden">
      {["w-16", "w-24", "w-20", "w-24"].map((width, index) => (
        <VipSkeleton key={index} className={`h-10 shrink-0 rounded-full ${width}`} />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <VipRestaurantCardSkeleton />
      <VipRestaurantCardSkeleton />
      <VipRestaurantCardSkeleton />
    </div>
  </div>
);

// Compatibilidad con importaciones previas.
export const VipHeroSkeleton = () => <VipSkeleton dark className="h-24 w-full" />;

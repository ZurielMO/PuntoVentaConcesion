"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RotateCw, Store } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipHomeContext } from "@/components/vip/home/hero-banner";
import { VipCatalogBrowser } from "@/components/vip/home/featured-restaurants";
import { VipHomeOrderHelp } from "@/components/vip/preorder/home-preorder-cards";
import { VipPalcoButton } from "@/components/vip/location/palco-button";
import { VipHomeSkeleton } from "@/components/vip/ui/skeleton";
import { VipLegalLinks } from "@/components/vip/legal/legal-links";
import { VipButton } from "@/components/vip/ui/button";
import { VipService } from "@/lib/vip/vip-service";
import type { VipRestaurant } from "@/lib/vip/types";
import { useVipPublicSalesOpen } from "@/hooks/vip/use-vip-public-sales";
import { useVipPreorderAvailability } from "@/hooks/vip/use-vip-preorder-availability";

type CatalogState = { status: "loading" } | { status: "ready"; data: VipRestaurant[] } | { status: "error" };

export default function VipInicioPage() {
  const [catalog, setCatalog] = useState<CatalogState>({ status: "loading" });
  const sales = useVipPublicSalesOpen();
  const preorders = useVipPreorderAvailability(null, { enabled: sales.ready && sales.preordersEnabled, pollMs: 120_000 });
  const nextMatch = preorders.data?.matches[0] || null;

  const load = useCallback(async () => {
    setCatalog({ status: "loading" });
    try {
      const data = await VipService.loadCatalog();
      setCatalog({ status: "ready", data });
    } catch {
      setCatalog({ status: "error" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scrollToMenu = () => document.getElementById("palco-menu")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex min-h-screen flex-col pb-28 md:pb-12">
      <VipTopBar variant="home" actions={<VipPalcoButton />} />
      <VipHomeContext sales={sales} nextMatch={nextMatch} matchLoading={preorders.loading} />

      <main id="palco-menu" className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 md:px-6">
        {catalog.status === "loading" ? (
          <div className="-mt-7 md:-mt-8">
            <div className="palco-skeleton mb-1 h-14 rounded-full md:h-16" />
            <div className="pt-3">
              <VipHomeSkeleton />
            </div>
          </div>
        ) : catalog.status === "error" ? (
          <div className="-mt-7 flex flex-col items-center rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface px-6 py-12 text-center md:-mt-8">
            <RotateCw aria-hidden className="size-8 text-palco-ink-3" />
            <h2 className="mt-3 font-palco-display text-lg font-bold text-palco-ink">No pudimos cargar el menú</h2>
            <p className="mt-1 max-w-xs text-sm text-palco-ink-3">Revisa tu conexión e inténtalo de nuevo.</p>
            <VipButton className="mt-5" onClick={() => void load()}>
              Reintentar
            </VipButton>
          </div>
        ) : catalog.data.length === 0 ? (
          <div className="-mt-7 flex flex-col items-center rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface px-6 py-12 text-center md:-mt-8">
            <Store aria-hidden className="size-8 text-palco-ink-3" />
            <h2 className="mt-3 font-palco-display text-lg font-bold text-palco-ink">Por el momento no está disponible</h2>
            <p className="mt-1 max-w-xs text-sm text-palco-ink-3">
              Los establecimientos aparecen aquí cuando abren su menú para palcos. Vuelve a visitar más tarde.
            </p>
          </div>
        ) : (
          <VipCatalogBrowser restaurants={catalog.data} sales={sales} />
        )}

        <VipHomeOrderHelp sales={sales} nextMatch={nextMatch} onScheduled={scrollToMenu} />
      </main>

      <VipLegalLinks className="mt-10 px-4" />
    </div>
  );
}

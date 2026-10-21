"use client";

import React, { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, RotateCw, Search, SearchX, Store, X } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipRestaurantHeader, VipShareMenuButton } from "@/components/vip/menu/restaurant-header";
import { VipProductCard } from "@/components/vip/menu/menu-item-card";
import { VipMenuItemSkeleton, VipSkeleton } from "@/components/vip/ui/skeleton";
import { VipButton } from "@/components/vip/ui/button";
import { VipLegalLinks } from "@/components/vip/legal/legal-links";
import { VipService } from "@/lib/vip/vip-service";
import type { VipRestaurant } from "@/lib/vip/types";
import { VIP_CATEGORY_LABEL, categoryKeyFromLabel, restaurantCategories, searchCatalog } from "@/lib/vip/catalog";
import {
  VIP_PURCHASE_UNAVAILABLE_HINT,
  VIP_PURCHASE_UNAVAILABLE_TITLE,
} from "@/lib/vip/purchase-availability";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { useVipPublicSalesOpen } from "@/hooks/vip/use-vip-public-sales";

type PageState = { status: "loading" } | { status: "ready"; data: VipRestaurant } | { status: "missing" } | { status: "error" };

const MENU_SEARCH_MIN = 10;

function MenuSections({ restaurant }: { restaurant: VipRestaurant }) {
  const categories = useMemo(() => restaurantCategories(restaurant), [restaurant]);
  const [active, setActive] = useState(categories[0] || null);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const showTabs = categories.length > 1;
  const showSearch = restaurant.productos.length >= MENU_SEARCH_MIN;

  // La pestaña activa sigue a la sección que está a la vista.
  useEffect(() => {
    if (!showTabs) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const key = visible?.target.getAttribute("data-category");
        if (key) setActive(key as typeof active);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    for (const node of Object.values(sectionRefs.current)) if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [showTabs, categories]);

  useEffect(() => {
    if (!active || !tabsRef.current) return;
    tabsRef.current.querySelector<HTMLElement>(`[data-tab="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const results = useMemo(
    () => (deferred.trim() ? searchCatalog([restaurant], deferred).products.map((hit) => hit.product) : null),
    [restaurant, deferred],
  );

  if (restaurant.productos.length === 0) {
    return (
      <div className="mx-4 flex flex-col items-center rounded-[var(--radius-palco-lg)] border border-dashed border-palco-line-strong px-6 py-12 text-center md:mx-0">
        <Store aria-hidden className="size-8 text-palco-ink-3" />
        <h2 className="mt-3 font-palco-display text-lg font-bold text-palco-ink">Sin productos por ahora</h2>
        <p className="mt-1 max-w-xs text-sm text-palco-ink-3">Este establecimiento todavía no publica su menú para palcos.</p>
        <Link href="/servicio-palcos/inicio" className="palco-press mt-5 min-h-11 rounded-full bg-palco-700 px-5 py-3 text-sm font-semibold text-white">
          Ver otros establecimientos
        </Link>
      </div>
    );
  }

  return (
    <div>
      {(showTabs || showSearch) && (
        <div className="sticky top-14 z-20 bg-palco-ground pb-2 pt-3 md:top-16">
          {showSearch && (
            <div className="relative mx-4 mb-2 md:mx-0">
              <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-palco-ink-3" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={`Buscar en el menú de ${restaurant.nombre}`}
                placeholder={`Buscar en ${restaurant.nombre}`}
                enterKeyHint="search"
                className="h-12 w-full rounded-full border border-palco-line bg-palco-surface pl-12 pr-12 text-base outline-none focus:border-palco-700 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Borrar búsqueda"
                  className="palco-press absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-palco-ink-2"
                >
                  <X aria-hidden className="size-5" />
                </button>
              )}
            </div>
          )}
          {showTabs && !results && (
            <div ref={tabsRef} role="tablist" aria-label="Secciones del menú" className="palco-rail flex gap-1 scroll-px-4 px-4 md:scroll-px-0 md:px-0">
              {categories.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  data-tab={key}
                  aria-selected={active === key}
                  onClick={() => {
                    setActive(key);
                    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`palco-press h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
                    active === key ? "bg-palco-900 text-palco-on-dark" : "text-palco-ink-2 hover:bg-palco-sunken"
                  }`}
                >
                  {VIP_CATEGORY_LABEL[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {results ? (
        results.length === 0 ? (
          <div className="mx-4 mt-2 flex flex-col items-center rounded-[var(--radius-palco-lg)] border border-dashed border-palco-line-strong px-6 py-10 text-center md:mx-0">
            <SearchX aria-hidden className="size-7 text-palco-ink-3" />
            <p className="mt-2 font-semibold text-palco-ink">No hay «{deferred.trim()}» en este menú</p>
            <button type="button" onClick={() => setQuery("")} className="mt-3 text-sm font-semibold text-palco-700 underline underline-offset-4">
              Ver todo el menú
            </button>
          </div>
        ) : (
          <div className="mt-2 bg-palco-surface px-4 md:rounded-[var(--radius-palco-lg)] md:border md:border-palco-line md:px-5">
            <div className="divide-y divide-palco-line">
              {results.map((product) => (
                <VipProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-6 pt-2">
          {(categories.length ? categories : [null]).map((key, sectionIndex) => {
            const products = key
              ? restaurant.productos.filter((product) => categoryKeyFromLabel(product.categoria) === key)
              : restaurant.productos;
            return (
              <section
                key={key || "all"}
                ref={(node) => {
                  if (key) sectionRefs.current[key] = node;
                }}
                data-category={key || undefined}
                aria-labelledby={key ? `palco-section-${key}` : undefined}
                className="scroll-mt-32 md:scroll-mt-36"
              >
                {showTabs && key && (
                  <h2 id={`palco-section-${key}`} className="mb-1 px-4 font-palco-display text-xl font-bold tracking-[-0.015em] text-palco-ink md:px-0">
                    {VIP_CATEGORY_LABEL[key]}
                  </h2>
                )}
                <div className="bg-palco-surface px-4 md:rounded-[var(--radius-palco-lg)] md:border md:border-palco-line md:px-5">
                  <div className="divide-y divide-palco-line md:grid md:grid-cols-2 md:gap-x-8 md:divide-y-0">
                    {products.map((product, index) => (
                      <div key={product.id} className="md:border-b md:border-palco-line md:[&:nth-last-child(-n+2)]:border-b-0">
                        <VipProductCard product={product} priority={sectionIndex === 0 && index < 4} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PalcosRestaurantePageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const restaurantId = params.id && params.id !== "_" ? String(params.id) : String(searchParams.get("id") || "");
  const router = useRouter();
  const { setRestaurantInfo } = useVipCart();
  const sales = useVipPublicSalesOpen();
  const [state, setState] = useState<PageState>({ status: "loading" });

  const load = useCallback(async () => {
    if (!restaurantId) {
      setState({ status: "missing" });
      return;
    }
    setState({ status: "loading" });
    try {
      const data = await VipService.loadRestaurant(restaurantId);
      setState(data ? { status: "ready", data } : { status: "missing" });
    } catch {
      setState({ status: "error" });
    }
  }, [restaurantId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (state.status === "ready") setRestaurantInfo(state.data.id, state.data.nombre);
  }, [state, setRestaurantInfo]);

  const restaurant = state.status === "ready" ? state.data : null;
  const goHome = () => router.push("/servicio-palcos/inicio");

  return (
    <div className="flex min-h-screen flex-col pb-28 md:pb-12">
      <VipTopBar
        variant="linear"
        title={restaurant?.nombre || "Menú"}
        subtitle={restaurant ? "Entrega en tu palco" : undefined}
        titleTag="p"
        onBack={goHome}
        actions={restaurant ? <VipShareMenuButton name={restaurant.nombre} /> : undefined}
      />

      {state.status === "loading" && (
        <div aria-hidden className="mx-auto w-full max-w-6xl md:px-6 md:pt-6">
          <VipSkeleton className="h-44 w-full rounded-none sm:h-52 md:h-60 md:rounded-[var(--radius-palco-xl)]" />
          <div className="px-4 pt-4 md:px-0">
            <VipSkeleton className="h-8 w-2/3 max-w-xs" />
            <VipSkeleton className="mt-2 h-4 w-1/2 max-w-[14rem]" />
            <div className="mt-6 bg-palco-surface px-4 md:rounded-[var(--radius-palco-lg)]">
              <VipMenuItemSkeleton />
              <VipMenuItemSkeleton />
              <VipMenuItemSkeleton />
            </div>
          </div>
        </div>
      )}

      {(state.status === "missing" || state.status === "error") && (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          {state.status === "error" ? (
            <RotateCw aria-hidden className="size-9 text-palco-ink-3" />
          ) : (
            <Store aria-hidden className="size-9 text-palco-ink-3" />
          )}
          <h1 className="mt-3 font-palco-display text-xl font-bold text-palco-ink">
            {state.status === "error" ? "No pudimos cargar el menú" : "No encontramos este establecimiento"}
          </h1>
          <p className="mt-1 text-sm text-palco-ink-3">
            {state.status === "error"
              ? "Revisa tu conexión e inténtalo de nuevo."
              : "Puede que ya no esté disponible para palcos. Revisa los demás establecimientos."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {state.status === "error" && <VipButton onClick={() => void load()}>Reintentar</VipButton>}
            <VipButton variant={state.status === "error" ? "outline" : "primary"} onClick={goHome}>
              Ver establecimientos
            </VipButton>
          </div>
        </main>
      )}

      {restaurant && (
        <>
          <VipRestaurantHeader restaurant={restaurant} sales={sales} />
          <main className="mx-auto w-full max-w-6xl md:px-6">
            {sales.ready && !sales.canOrder && (
              <div role="status" className="mx-4 mt-4 flex items-start gap-3 rounded-[var(--radius-palco-md)] bg-palco-warning-50 px-4 py-3 md:mx-0">
                <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-palco-warning" />
                <p className="text-sm text-palco-ink">
                  <span className="font-semibold">{VIP_PURCHASE_UNAVAILABLE_TITLE}.</span> Puedes ver el menú; {VIP_PURCHASE_UNAVAILABLE_HINT.toLowerCase()}
                </p>
              </div>
            )}
            <div className="mt-4">
              <MenuSections restaurant={restaurant} />
            </div>
          </main>
        </>
      )}

      <VipLegalLinks className="mt-10 px-4" />
    </div>
  );
}

export default function PalcosRestaurantePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <div className="h-14 bg-palco-900 md:h-16" />
        </div>
      }
    >
      <PalcosRestaurantePageInner />
    </Suspense>
  );
}

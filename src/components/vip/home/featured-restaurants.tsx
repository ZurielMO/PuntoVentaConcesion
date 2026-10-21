"use client";

import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CupSoda, IceCreamCone, LayoutGrid, Package, Popcorn, Search, SearchX, UtensilsCrossed, X } from "lucide-react";
import type { VipRestaurant } from "@/lib/vip/types";
import {
  VIP_CATEGORY_LABEL,
  VIP_CATEGORY_ORDER,
  categoryKeyFromLabel,
  productKeyword,
  productsByCategory,
  searchCatalog,
  type VipCategoryKey,
} from "@/lib/vip/catalog";
import { vipRestaurantPath } from "@/lib/vip/vip-routes";
import type { VipSalesState } from "@/lib/vip/availability";
import { VipRestaurantCard } from "./restaurant-card";
import { VipProductCard } from "../menu/menu-item-card";
import { VipMedia } from "../ui/media";

type Filter = VipCategoryKey | "all";

const CATEGORY_ICON: Record<VipCategoryKey, typeof CupSoda> = {
  comida: UtensilsCrossed,
  bebidas: CupSoda,
  botanas: Popcorn,
  postres: IceCreamCone,
  combos: Package,
};

const BROWSE_KEY = "vip_home_browse_v1";

/** Ejemplos reales del catálogo para el texto de la búsqueda: "Busca tacos o michelada". */
function searchPlaceholder(byCategory: Map<VipCategoryKey, Array<{ product: { nombre: string } }>>): string {
  const examples: string[] = [];
  for (const key of VIP_CATEGORY_ORDER) {
    const word = (byCategory.get(key) || []).map(({ product }) => productKeyword(product.nombre)).find(Boolean);
    if (word && !examples.includes(word)) examples.push(word);
    if (examples.length === 2) break;
  }
  if (examples.length < 2) return "Busca comida, bebidas o establecimientos";
  return `Busca ${examples.slice(0, -1).join(", ")} o ${examples.at(-1)}`;
}

function SectionHeading({ id, title, meta, action }: { id: string; title: string; meta?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 id={id} className="font-palco-display text-xl font-bold tracking-[-0.015em] text-palco-ink md:text-2xl">
          {title}
        </h2>
        {meta && <span className="palco-num text-sm text-palco-ink-3">{meta}</span>}
      </div>
      {action}
    </div>
  );
}

export function VipCatalogBrowser({ restaurants, sales }: { restaurants: VipRestaurant[]; sales: VipSalesState }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Al volver de un establecimiento se conserva lo que se estaba buscando.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(BROWSE_KEY) || "null") as { query?: string; filter?: Filter } | null;
      if (saved?.query) setQuery(saved.query);
      if (saved?.filter) setFilter(saved.filter);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(BROWSE_KEY, JSON.stringify({ query, filter }));
    } catch {
      // ignore
    }
  }, [query, filter]);

  const byCategory = useMemo(() => productsByCategory(restaurants), [restaurants]);
  const categories = VIP_CATEGORY_ORDER.filter((key) => (byCategory.get(key)?.length || 0) > 0);
  const totalProducts = restaurants.reduce((sum, row) => sum + row.productos.length, 0);
  const showSearch = totalProducts >= 6;
  const activeFilter: Filter = filter !== "all" && !categories.includes(filter) ? "all" : filter;

  const search = useMemo(
    () => (deferredQuery.trim() ? searchCatalog(restaurants, deferredQuery) : null),
    [restaurants, deferredQuery],
  );

  const searchProducts = useMemo(() => {
    if (!search) return [];
    if (activeFilter === "all") return search.products;
    return search.products.filter((hit) => categoryKeyFromLabel(hit.product.categoria) === activeFilter);
  }, [search, activeFilter]);

  const pickFilter = (next: Filter) => {
    setFilter(next);
    if (topRef.current && topRef.current.getBoundingClientRect().top < 0) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const priorityCount = 2;

  return (
    <div ref={topRef} className="scroll-mt-16 md:scroll-mt-20">
      {showSearch && (
        <div className="relative z-10 -mt-7 md:-mt-8">
          <label htmlFor="palco-search" className="sr-only">
            Buscar en el menú del estadio
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-palco-ink-3" />
            <input
              ref={inputRef}
              id="palco-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && query) {
                  event.preventDefault();
                  setQuery("");
                }
              }}
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              placeholder={searchPlaceholder(byCategory)}
              className="h-14 w-full rounded-full border border-palco-line bg-palco-surface pl-13 pr-14 text-base text-palco-ink shadow-palco-float outline-none transition-[border-color,box-shadow] [appearance:none] focus:border-palco-700 md:h-16 md:text-[17px] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Borrar búsqueda"
                className="palco-press absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-palco-ink-2 hover:bg-palco-sunken"
              >
                <X aria-hidden className="size-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {categories.length > 1 && (
        <div className="sticky top-14 z-20 -mx-4 bg-palco-ground px-4 pb-2 pt-3 md:top-16 md:-mx-6 md:px-6">
          <div role="group" aria-label="Categorías" className="palco-rail -mx-4 flex gap-2 scroll-px-4 px-4 md:mx-0 md:scroll-px-0 md:px-0">
            {(["all", ...categories] as Filter[]).map((key) => {
              const selected = activeFilter === key;
              const Icon = key === "all" ? LayoutGrid : CATEGORY_ICON[key];
              const count = key === "all" ? totalProducts : byCategory.get(key)?.length || 0;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pickFilter(key)}
                  className={`palco-press flex h-10 shrink-0 items-center gap-2 rounded-full border pl-3 pr-3.5 text-sm font-semibold ${
                    selected
                      ? "border-palco-900 bg-palco-900 text-palco-on-dark"
                      : "border-palco-line bg-palco-surface text-palco-ink hover:border-palco-line-strong"
                  }`}
                >
                  <Icon aria-hidden className={`size-4 ${selected ? "text-palco-gold" : "text-palco-ink-3"}`} />
                  {key === "all" ? "Todo" : VIP_CATEGORY_LABEL[key]}
                  <span className={`palco-num text-xs ${selected ? "text-palco-on-dark-2" : "text-palco-ink-3"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-4" aria-busy={deferredQuery !== query}>
        <p className="sr-only" role="status">
          {search ? `${searchProducts.length + (activeFilter === "all" ? search.restaurants.length : 0)} resultados para ${deferredQuery.trim()}` : ""}
        </p>
        {search ? (
          <SearchResults
            query={deferredQuery.trim()}
            products={searchProducts}
            restaurants={activeFilter === "all" ? search.restaurants : []}
            filterLabel={activeFilter === "all" ? null : VIP_CATEGORY_LABEL[activeFilter]}
            onClear={clearSearch}
            onClearFilter={() => setFilter("all")}
          />
        ) : activeFilter !== "all" ? (
          <CategoryView category={activeFilter} restaurants={restaurants} />
        ) : (
          <div className="flex flex-col gap-10">
            <section aria-labelledby="palco-establecimientos">
              <SectionHeading
                id="palco-establecimientos"
                title="Establecimientos"
                meta={`${restaurants.length}`}
              />
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {restaurants.map((restaurant, index) => (
                  <VipRestaurantCard key={restaurant.id} restaurant={restaurant} sales={sales} priority={index < priorityCount} />
                ))}
              </div>
            </section>

            {categories.map((key) => {
              const list = byCategory.get(key) || [];
              return (
                <section key={key} aria-labelledby={`palco-rail-${key}`}>
                  <SectionHeading
                    id={`palco-rail-${key}`}
                    title={VIP_CATEGORY_LABEL[key]}
                    meta={`${list.length}`}
                    action={
                      list.length > 3 ? (
                        <button
                          type="button"
                          onClick={() => pickFilter(key)}
                          className="palco-press -mr-2 flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-palco-700 hover:bg-palco-50"
                        >
                          Ver todo
                          <ArrowRight aria-hidden className="size-4" />
                        </button>
                      ) : undefined
                    }
                  />
                  <div className="palco-rail -mx-4 flex gap-3 scroll-px-4 px-4 pb-1 md:-mx-6 md:scroll-px-6 md:px-6">
                    {list.map(({ product, restaurant }) => (
                      <VipProductCard key={product.id} product={product} restaurantName={restaurant.nombre} layout="tile" />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryView({ category, restaurants }: { category: VipCategoryKey; restaurants: VipRestaurant[] }) {
  const groups = restaurants
    .map((restaurant) => ({
      restaurant,
      products: restaurant.productos.filter((product) => categoryKeyFromLabel(product.categoria) === category),
    }))
    .filter((group) => group.products.length > 0);
  const total = groups.reduce((sum, group) => sum + group.products.length, 0);

  return (
    <section aria-labelledby="palco-category-title">
      <SectionHeading id="palco-category-title" title={VIP_CATEGORY_LABEL[category]} meta={`${total}`} />
      <div className="flex flex-col gap-6">
        {groups.map(({ restaurant, products }) => (
          <div key={restaurant.id} className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface px-4 pt-3 md:px-5">
            <div className="flex items-center justify-between gap-3 border-b border-palco-line pb-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="size-10 shrink-0 overflow-hidden rounded-full border border-palco-line">
                  <VipMedia src={restaurant.imagen} alt="" fit="brand" className="size-full" categoria={restaurant.categoria} />
                </span>
                <h3 className="truncate font-palco-display text-base font-bold text-palco-ink">{restaurant.nombre}</h3>
              </div>
              <Link
                href={vipRestaurantPath(restaurant.id)}
                className="palco-press flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-palco-700 hover:bg-palco-50"
              >
                Ver menú
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <div className="divide-y divide-palco-line md:grid md:grid-cols-2 md:gap-x-8 md:divide-y-0">
              {products.map((product) => (
                <div key={product.id} className="md:border-b md:border-palco-line md:[&:nth-last-child(-n+2)]:border-b-0">
                  <VipProductCard product={product} restaurantName={restaurant.nombre} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SearchResults({
  query,
  products,
  restaurants,
  filterLabel,
  onClear,
  onClearFilter,
}: {
  query: string;
  products: ReturnType<typeof searchCatalog>["products"];
  restaurants: VipRestaurant[];
  filterLabel: string | null;
  onClear: () => void;
  onClearFilter: () => void;
}) {
  const total = products.length + restaurants.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius-palco-lg)] border border-dashed border-palco-line-strong px-6 py-12 text-center">
        <SearchX aria-hidden className="size-8 text-palco-ink-3" />
        <h2 className="mt-3 font-palco-display text-lg font-bold text-palco-ink">
          No encontramos «{query}»{filterLabel ? ` en ${filterLabel.toLowerCase()}` : ""}
        </h2>
        <p className="mt-1 max-w-xs text-sm text-palco-ink-3">Prueba con otra palabra o explora el menú por categoría.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {filterLabel && (
            <button
              type="button"
              onClick={onClearFilter}
              className="palco-press min-h-11 rounded-full border border-palco-line-strong bg-palco-surface px-4 text-sm font-semibold text-palco-ink"
            >
              Buscar en todo el menú
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="palco-press min-h-11 rounded-full bg-palco-700 px-4 text-sm font-semibold text-white hover:bg-palco-600"
          >
            Borrar búsqueda
          </button>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="palco-search-title">
      <SectionHeading
        id="palco-search-title"
        title="Resultados"
        meta={`${total} para «${query}»${filterLabel ? ` en ${filterLabel.toLowerCase()}` : ""}`}
      />
      {restaurants.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={vipRestaurantPath(restaurant.id)}
              className="palco-press palco-lift flex items-center gap-3 rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-2.5 pr-4"
            >
              <span className="h-14 w-20 shrink-0 overflow-hidden rounded-[var(--radius-palco-sm)]">
                <VipMedia src={restaurant.imagen} alt="" fit="brand" className="size-full" categoria={restaurant.categoria} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-palco-display text-base font-bold text-palco-ink">{restaurant.nombre}</span>
                <span className="block truncate text-[13px] text-palco-ink-3">{restaurant.subtitulo}</span>
              </span>
              <ArrowRight aria-hidden className="size-5 shrink-0 text-palco-ink-3" />
            </Link>
          ))}
        </div>
      )}
      {products.length > 0 && (
        <div className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface px-4 md:px-5">
          <div className="divide-y divide-palco-line">
            {products.map(({ product, restaurant }) => (
              <VipProductCard key={product.id} product={product} restaurantName={restaurant.nombre} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipHeroBanner } from "@/components/vip/home/hero-banner";
import { VipCategoryChips } from "@/components/vip/home/category-chips";
import { VipFeaturedRestaurants } from "@/components/vip/home/featured-restaurants";
import { VipCartFloatingBar } from "@/components/vip/menu/cart-floating-bar";
import {
  VipHeroSkeleton,
  VipRestaurantCardSkeleton,
} from "@/components/vip/ui/skeleton";
import { VipService } from "@/lib/vip/vip-service";
import type { VipRestaurant, VipCategory } from "@/lib/vip/types";
import { VipMascot } from "@/components/vip/ui/mascot";
import { motion } from "motion/react";

export default function VipInicioPage() {
  const [restaurants, setRestaurants] = useState<VipRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<VipCategory>("Todos");

  const categories: VipCategory[] = ["Todos", "Comida", "Snacks", "Bebidas"];

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const data = await VipService.getRestaurants();
        if (mounted) {
          setRestaurants(data);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRestaurants = useMemo(() => {
    if (activeCategory === "Todos") return restaurants;
    return restaurants.filter(
      (r) =>
        r.categoria.toLowerCase() === activeCategory.toLowerCase() ||
        r.categorias.includes(activeCategory),
    );
  }, [restaurants, activeCategory]);

  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-16 bg-[#F6F8F7] text-[#111614]">
      {/* Top Header */}
      <VipTopBar variant="home" />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto w-full px-3 sm:px-6 flex flex-col gap-4 sm:gap-6 pt-3 sm:pt-5"
      >
        {loading ? (
          <div className="space-y-6">
            <VipHeroSkeleton />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-5">
              <VipRestaurantCardSkeleton />
              <VipRestaurantCardSkeleton />
              <VipRestaurantCardSkeleton />
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <VipHeroBanner />

            {/* Category Filter Chips */}
            {restaurants.length > 0 && (
              <VipCategoryChips
                categories={categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
              />
            )}

            {/* Unified Concession List */}
            {filteredRestaurants.length === 0 ? (
              <div
                id="menu-palcos"
                className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-[#DFE5E2] shadow-2xs gap-3 my-4"
              >
                <VipMascot name="cta" size="empty" className="-mb-2" />
                <h3 className="font-headline-md text-base sm:text-lg font-extrabold text-[#111614]">
                  {activeCategory === "Todos"
                    ? "No hay concesiones activas por ahora"
                    : `No hay concesiones en la categoría ${activeCategory}`}
                </h3>
                <p className="font-body-md text-xs sm:text-sm text-[#4E5C56] max-w-sm">
                  {activeCategory === "Todos"
                    ? "El menú de palcos estará disponible durante los horarios de partido."
                    : "Intenta seleccionando otra categoría o la opción 'Todos'."}
                </p>
                {activeCategory !== "Todos" && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory("Todos")}
                    className="mt-2 text-xs font-bold text-[#187B56] hover:underline cursor-pointer"
                  >
                    Ver todas las categorías
                  </button>
                )}
              </div>
            ) : (
              <div id="menu-palcos">
                <VipFeaturedRestaurants restaurants={filteredRestaurants} />
              </div>
            )}
          </>
        )}
      </motion.main>

      {/* Floating cart bar */}
      <VipCartFloatingBar />
    </div>
  );
}

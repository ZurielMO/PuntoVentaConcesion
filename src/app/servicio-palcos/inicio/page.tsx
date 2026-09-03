"use client";

import React, { useState, useEffect } from "react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipHeroBanner } from "@/components/vip/home/hero-banner";
import { VipFeaturedRestaurants } from "@/components/vip/home/featured-restaurants";
import { VipCartFloatingBar } from "@/components/vip/menu/cart-floating-bar";
import {
  VipHeroSkeleton,
  VipRestaurantCardSkeleton,
} from "@/components/vip/ui/skeleton";
import { VipService } from "@/lib/vip/vip-service";
import type { VipRestaurant } from "@/lib/vip/types";
import { VipMascot } from "@/components/vip/ui/mascot";
import { motion } from "motion/react";

export default function VipInicioPage() {
  const [restaurants, setRestaurants] = useState<VipRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-16 bg-[#F6F8F7] text-[#111614]">
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
            <VipHeroBanner />

            {restaurants.length === 0 ? (
              <div
                id="menu-palcos"
                className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-[#DFE5E2] shadow-2xs gap-3 my-4"
              >
                <VipMascot name="cta" size="empty" className="-mb-2" />
                <h3 className="font-headline-md text-lg sm:text-xl font-extrabold text-[#111614]">
                  No hay concesiones activas por ahora
                </h3>
                <p className="font-body-md text-sm sm:text-base text-[#4E5C56] max-w-sm">
                  El menú de palcos estará disponible durante los horarios de partido.
                </p>
              </div>
            ) : (
              <div id="menu-palcos">
                <VipFeaturedRestaurants restaurants={restaurants} />
              </div>
            )}
          </>
        )}
      </motion.main>

      <VipCartFloatingBar />
    </div>
  );
}

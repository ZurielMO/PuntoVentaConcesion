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
import { VipHospitalityCrest } from "@/components/vip/ui/hospitality-crest";
import { VipSalesClosedNotice } from "@/components/vip/ui/sales-closed-notice";
import { useVipPublicSalesOpen } from "@/hooks/vip/use-vip-public-sales";
import {
  VIP_PURCHASE_UNAVAILABLE_HINT,
  VIP_PURCHASE_UNAVAILABLE_TITLE,
} from "@/lib/vip/purchase-availability";
import {
  VipHomeGuideLookupCard,
  VipHomePreorderCard,
} from "@/components/vip/preorder/home-preorder-cards";
import { VipLegalLinks } from "@/components/vip/legal/legal-links";
import { motion } from "motion/react";

export default function VipInicioPage() {
  const [restaurants, setRestaurants] = useState<VipRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { canOrder, preordersEnabled, ready } = useVipPublicSalesOpen();

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
    <div className="flex flex-col min-h-screen pb-44 md:pb-28 bg-[#F8FAF9] text-[#111827]">
      <VipTopBar variant="home" />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto w-full px-3.5 sm:px-6 flex flex-col gap-4 sm:gap-6 pt-3 sm:pt-5"
      >
        {loading ? (
          <div className="space-y-6">
            <VipHeroSkeleton />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              <VipRestaurantCardSkeleton />
              <VipRestaurantCardSkeleton />
              <VipRestaurantCardSkeleton />
            </div>
          </div>
        ) : (
          <>
            <VipHeroBanner />

            {ready && !canOrder && <VipSalesClosedNotice />}

            <div className={`grid grid-cols-1 gap-4 sm:gap-5 items-stretch ${preordersEnabled ? "md:grid-cols-2" : "max-w-xl mx-auto w-full"}`}>
              {preordersEnabled && <VipHomePreorderCard />}
              <VipHomeGuideLookupCard />
            </div>

            {restaurants.length === 0 ? (
              <div
                id="menu-palcos"
                className="flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-white rounded-3xl border border-[#E5EBE8] shadow-[0_4px_20px_rgba(6,46,32,0.04)] gap-3 my-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#0D4A34]/8 border border-[#0D4A34]/15 flex items-center justify-center text-[#0D4A34] mb-1">
                  <VipHospitalityCrest variant="mini" />
                </div>
                <h3 className="font-[family-name:var(--font-montserrat)] text-lg sm:text-xl font-extrabold text-[#111827]">
                  {VIP_PURCHASE_UNAVAILABLE_TITLE}
                </h3>
                <p className="font-sans text-sm sm:text-base text-[#4B5563] max-w-sm">
                  {VIP_PURCHASE_UNAVAILABLE_HINT}
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

      <VipLegalLinks className="px-4 pb-2" />

      <VipCartFloatingBar />
    </div>
  );
}

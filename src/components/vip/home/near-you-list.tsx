"use client";

import React from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import type { VipRestaurant } from "@/lib/vip/types";
import { formatVipAmount } from "@/lib/vip/money";
import { vipRestaurantPath } from "@/lib/vip/vip-routes";
import { VipMedia } from "../ui/media";
import { motion } from "motion/react";

interface NearYouListProps {
  restaurants: VipRestaurant[];
}

export const VipNearYouList: React.FC<NearYouListProps> = ({ restaurants }) => {
  return (
    <section className="flex flex-col gap-3.5 pb-6">
      <div>
          <span className="text-[11px] font-label-sm text-[#9E7844] font-bold uppercase tracking-wider">
            Entrega a palco
          </span>
          <h2 className="font-headline-md text-lg sm:text-xl font-bold text-[#171A19]">
            Todas las concesiones
          </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {restaurants.map((restaurant) => (
          <motion.article
            key={restaurant.id}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl p-3.5 border border-[#E2E8E5] shadow-sm hover:shadow-md transition-all group"
          >
            <Link
              href={vipRestaurantPath(restaurant.id)}
              className="flex items-center gap-3.5"
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#EEF2F0] shrink-0 border border-[#E2E8E5]">
                <VipMedia
                  src={restaurant.imagen}
                  alt={restaurant.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 min-w-0 justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline-md text-sm sm:text-base font-bold text-[#171A19] group-hover:text-[#187B56] transition-colors truncate">
                      {restaurant.nombre}
                    </h3>
                  </div>

                  <p className="font-body-md text-xs text-[#66706B] truncate mt-0.5">
                    {restaurant.subtitulo}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#F5F7F6]">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#187B56] bg-[#187B56]/10 px-2 py-0.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    <span>Entrega a palco</span>
                  </span>

                  <span className="font-headline-md text-xs font-bold text-[#187B56] flex items-center gap-0.5">
                    <span>${formatVipAmount(restaurant.precioMinimo)}+</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

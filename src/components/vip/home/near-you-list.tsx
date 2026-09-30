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
        <span className="text-[10px] sm:text-[11px] font-bold text-[#A67C2E] uppercase tracking-[0.18em]">
          Entrega Directa
        </span>
        <h2 className="font-[family-name:var(--font-montserrat)] text-lg sm:text-xl font-bold text-[#111827]">
          Todas las Concesiones
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {restaurants.map((restaurant) => (
          <motion.article
            key={restaurant.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl sm:rounded-[22px] p-3.5 border border-[#E5EBE8] shadow-[0_4px_16px_rgba(6,46,32,0.03)] hover:shadow-[0_8px_28px_rgba(6,46,32,0.08)] transition-all group"
          >
            <Link
              href={vipRestaurantPath(restaurant.id)}
              className="flex items-center gap-3.5"
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-[#ECEFEA] shrink-0 border border-[#E5EBE8]">
                <VipMedia
                  src={restaurant.imagen}
                  alt={restaurant.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 min-w-0 justify-between">
                <div>
                  <h3 className="font-[family-name:var(--font-montserrat)] text-sm sm:text-base font-bold text-[#111827] group-hover:text-[#0D4A34] transition-colors truncate">
                    {restaurant.nombre}
                  </h3>

                  <p className="font-sans text-xs text-[#4B5563] truncate mt-0.5">
                    {restaurant.subtitulo || restaurant.descripcion}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#EEF2F0]">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0D4A34] bg-[#0D4A34]/8 border border-[#0D4A34]/20 px-2 py-0.5 rounded-full">
                    <MapPin className="w-3 h-3 text-[#C5A059]" />
                    <span>A tu palco</span>
                  </span>

                  <span className="font-[family-name:var(--font-montserrat)] text-xs font-bold text-[#0D4A34] flex items-center gap-0.5">
                    <span>${formatVipAmount(restaurant.precioMinimo)}+</span>
                    <ArrowRight className="w-3 h-3 text-[#A67C2E] group-hover:translate-x-0.5 transition-transform" />
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

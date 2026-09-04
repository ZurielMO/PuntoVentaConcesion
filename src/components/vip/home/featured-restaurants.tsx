"use client";

import React from "react";
import Link from "next/link";
import { Clock, ArrowRight, MapPin, Sparkles } from "lucide-react";
import type { VipRestaurant } from "@/lib/vip/types";
import { formatVipAmount } from "@/lib/vip/money";
import { vipRestaurantPath } from "@/lib/vip/vip-routes";
import { VipBadge } from "../ui/badge";
import { VipMedia } from "../ui/media";
import { VipMascot } from "../ui/mascot";
import { motion } from "motion/react";

interface FeaturedRestaurantsProps {
  restaurants: VipRestaurant[];
}

export const VipFeaturedRestaurants: React.FC<FeaturedRestaurantsProps> = ({ restaurants }) => {
  return (
    <section className="flex flex-col gap-3 sm:gap-4 pb-4 sm:pb-6" aria-label="Restaurantes y Concesiones en el Estadio">
      <div className="flex justify-between items-end border-b border-[#DFE5E2] pb-2 sm:pb-3 gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-label-sm text-[#9E7844] font-extrabold uppercase tracking-widest">
            Servicio Exclusivo Estadio León
          </span>
          <h2 className="font-headline-md text-lg sm:text-2xl font-extrabold text-[#111614] tracking-tight">
            Restaurantes & Concesiones
          </h2>
        </div>
        <div className="flex items-end gap-2 shrink-0">
          <VipMascot name="pizza" size="card" decorative className="-mb-2" />
          <span className="text-xs text-[#7E8E87] font-semibold hidden sm:inline pb-1">
            {restaurants.length} {restaurants.length === 1 ? "disponible" : "disponibles"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {restaurants.map((restaurant) => (
          <motion.article
            key={restaurant.id}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="group relative bg-white rounded-2xl sm:rounded-[22px] border border-[#DFE5E2] shadow-xs hover:shadow-[0_12px_32px_rgba(10,28,22,0.08)] overflow-hidden flex flex-col transition-all cursor-pointer"
          >
            <Link
              href={vipRestaurantPath(restaurant.id)}
              className="flex flex-col h-full select-none"
              aria-label={`Ver menú de ${restaurant.nombre}`}
            >
              <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden bg-[#ECEFEA]">
                <VipMedia
                  src={restaurant.imagen || restaurant.portada}
                  alt={restaurant.nombre}
                  categoria={restaurant.categoria}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1C16]/75 via-transparent to-black/20" />

                <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    {restaurant.destacado && (
                      <span className="inline-flex items-center gap-0.5 bg-[#9E7844] text-white text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">Destacado</span>
                      </span>
                    )}
                    {restaurant.etiquetaRapido && (
                      <VipBadge variant="fast" size="sm" dot>
                        Rápido
                      </VipBadge>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-0.5 bg-black/65 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-2xs">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#00FF85]" />
                    <span>{restaurant.tiempoEntrega}</span>
                  </span>
                </div>

                <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3">
                  <span className="inline-flex items-center gap-1 bg-[#187B56] text-white text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded-md shadow-2xs">
                    <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>Palco</span>
                  </span>
                </div>
              </div>

              <div className="p-2.5 sm:p-5 flex flex-col flex-1 justify-between gap-2 sm:gap-4">
                <div>
                  <h3 className="font-headline-md text-[13px] sm:text-lg font-extrabold text-[#111614] group-hover:text-[#187B56] transition-colors line-clamp-2 sm:line-clamp-1 tracking-tight leading-tight">
                    {restaurant.nombre}
                  </h3>

                  <p className="hidden sm:block font-body-md text-xs text-[#4E5C56] mt-1 line-clamp-2 leading-relaxed">
                    {restaurant.subtitulo || restaurant.descripcion}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 sm:pt-3.5 border-t border-[#E9EFEB] gap-1">
                  <div className="min-w-0">
                    <span className="text-[9px] sm:text-[11px] text-[#7E8E87] block uppercase font-bold tracking-wider">
                      Desde
                    </span>
                    <span className="font-headline-md text-sm sm:text-base font-extrabold text-[#187B56]">
                      ${formatVipAmount(restaurant.precioMinimo)}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#F6F8F7] group-hover:bg-[#187B56] text-[#111614] group-hover:text-white font-headline-md text-[10px] sm:text-xs font-bold transition-all border border-[#DFE5E2] group-hover:border-[#187B56] shadow-2xs shrink-0">
                    <span>Ver</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

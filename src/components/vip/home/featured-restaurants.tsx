"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Clock, ArrowRight, MapPin, Sparkles, UtensilsCrossed } from "lucide-react";
import type { VipRestaurant } from "@/lib/vip/types";
import { formatVipAmount } from "@/lib/vip/money";
import { vipRestaurantPath } from "@/lib/vip/vip-routes";
import { VipMedia } from "../ui/media";
import { motion } from "motion/react";

interface FeaturedRestaurantsProps {
  restaurants: VipRestaurant[];
}

export const VipFeaturedRestaurants: React.FC<FeaturedRestaurantsProps> = ({ restaurants }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Extract unique categories for horizontal filter chips
  const categories = useMemo(() => {
    const cats = new Set<string>();
    restaurants.forEach((r) => {
      if (r.categoria) {
        cats.add(r.categoria.trim());
      }
    });
    return Array.from(cats);
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    if (selectedCategory === "ALL") return restaurants;
    return restaurants.filter(
      (r) => r.categoria?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [restaurants, selectedCategory]);

  return (
    <section className="flex flex-col gap-4 sm:gap-6 pb-6" aria-label="Restaurantes y Concesiones en el Estadio">
      {/* Header section with refined editorial layout (replaces cartoon mascot) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#E5EBE8] pb-3 sm:pb-4 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#A67C2E] uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>Selección Gastronómica · Estadio León</span>
          </div>
          <h2 className="font-[family-name:var(--font-montserrat)] text-xl sm:text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight mt-0.5">
            Restaurantes disponibles
          </h2>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-2 self-start sm:self-end">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D4A34]/8 border border-[#0D4A34]/20 text-[#0D4A34] text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#0D4A34] animate-pulse" />
            <span>
              {restaurants.length} {restaurants.length === 1 ? "concesión activa" : "concesiones activas"}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal scrollable category chips */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 vip-scroll-hide -mx-1 px-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-[family-name:var(--font-montserrat)] font-bold transition-all shrink-0 cursor-pointer border select-none ${
              selectedCategory === "ALL"
                ? "bg-[#062E20] text-white border-[#062E20] shadow-sm"
                : "bg-white text-[#4B5563] border-[#E5EBE8] hover:border-[#0D4A34]/40 hover:text-[#111827]"
            }`}
          >
            Todas ({restaurants.length})
          </button>
          {categories.map((cat) => {
            const count = restaurants.filter((r) => r.categoria?.toLowerCase() === cat.toLowerCase()).length;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-[family-name:var(--font-montserrat)] font-bold transition-all shrink-0 cursor-pointer border select-none capitalize ${
                  isSelected
                    ? "bg-[#062E20] text-white border-[#062E20] shadow-sm"
                    : "bg-white text-[#4B5563] border-[#E5EBE8] hover:border-[#0D4A34]/40 hover:text-[#111827]"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Gastronomic Showcase Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredRestaurants.map((restaurant) => (
          <motion.article
            key={restaurant.id}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="group relative bg-white rounded-2xl sm:rounded-[24px] border border-[#E5EBE8] shadow-[0_4px_20px_rgba(6,46,32,0.04)] hover:shadow-[0_12px_36px_rgba(6,46,32,0.1)] overflow-hidden flex flex-col transition-all cursor-pointer select-none"
          >
            <Link
              href={vipRestaurantPath(restaurant.id)}
              className="flex flex-col h-full"
              aria-label={`Ver menú de ${restaurant.nombre}`}
            >
              {/* Image Container with 16:10 Vitrina Gastronómica Aspect Ratio */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EAEFEA]">
                <VipMedia
                  src={restaurant.imagen || restaurant.portada}
                  alt={restaurant.nombre}
                  categoria={restaurant.categoria}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-600 ease-out"
                />

                {/* Subtle dark gradient scrim for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

                {/* Top Overlay Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {restaurant.destacado && (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#062319] text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs border border-white/30">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Destacado</span>
                      </span>
                    )}
                    {restaurant.etiquetaRapido && (
                      <span className="inline-flex items-center gap-1 bg-[#062E20]/90 backdrop-blur-md text-[#E6C687] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-[#C5A059]/40 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                        <span>Rápido</span>
                      </span>
                    )}
                  </div>

                  {/* Delivery ETA Pill */}
                  <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow-xs">
                    <Clock className="w-3 h-3 text-[#D4AF37]" />
                    <span>{restaurant.tiempoEntrega}</span>
                  </span>
                </div>

                {/* Bottom Overlay: Suite Delivery Indicator */}
                <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3">
                  <span className="inline-flex items-center gap-1.5 bg-[#062E20]/90 backdrop-blur-md text-[#E6C687] text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border border-[#C5A059]/40 shadow-xs">
                    <MapPin className="w-3 h-3 text-[#D4AF37]" />
                    <span>Entrega a Palco</span>
                  </span>
                </div>
              </div>

              {/* Card Body & Editorial Typography */}
              <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="font-[family-name:var(--font-montserrat)] text-base sm:text-lg font-bold text-[#111827] group-hover:text-[#0D4A34] transition-colors line-clamp-1 tracking-tight">
                    {restaurant.nombre}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-[#4B5563] mt-1 line-clamp-2 leading-relaxed">
                    {restaurant.subtitulo || restaurant.descripcion || "Establecimiento oficial en Estadio León."}
                  </p>
                </div>

                {/* Footer with Price and Interactive Action CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-[#EEF2F0] gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#6B7280] block uppercase font-bold tracking-wider">
                      Desde
                    </span>
                    <span className="font-[family-name:var(--font-montserrat)] text-base sm:text-lg font-extrabold text-[#0D4A34]">
                      ${formatVipAmount(restaurant.precioMinimo)} <span className="text-xs font-semibold text-[#6B7280]">MXN</span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#F8FAF9] group-hover:bg-[#062E20] text-[#111827] group-hover:text-white font-[family-name:var(--font-montserrat)] text-xs font-bold transition-all border border-[#E5EBE8] group-hover:border-[#062E20] shadow-2xs shrink-0">
                    <span>Ver menú</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#A67C2E] group-hover:text-[#E6C687]" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E5EBE8]">
          <UtensilsCrossed className="w-8 h-8 text-[#A67C2E] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#111827]">No hay concesiones en esta categoría</p>
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className="mt-2 text-xs font-bold text-[#0D4A34] underline"
          >
            Ver todas las concesiones
          </button>
        </div>
      )}
    </section>
  );
};

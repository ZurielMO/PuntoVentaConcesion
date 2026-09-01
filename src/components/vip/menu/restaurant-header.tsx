"use client";

import React from "react";
import { Clock, Share2, MapPin, Sparkles } from "lucide-react";
import type { VipRestaurant } from "@/lib/vip/types";
import { VipMedia } from "../ui/media";
import { VipMascot } from "../ui/mascot";
import { vipToast } from "@/hooks/vip/use-vip-toast";

interface RestaurantHeaderProps {
  restaurant: VipRestaurant;
}

export const VipRestaurantHeader: React.FC<RestaurantHeaderProps> = ({ restaurant }) => {
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      vipToast.info("Enlace copiado", {
        id: "vip-share-menu",
        description: "Comparte este menú con tus invitados en el palco.",
      });
    } catch {
      vipToast.error("No se pudo copiar el enlace.");
    }
  };

  const coverImage = restaurant.portada || restaurant.imagen;

  return (
    <section className="relative w-full bg-[#0A1C16] text-white overflow-hidden border-b border-[#234D41]">
      {coverImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={coverImage}
            alt={restaurant.nombre}
            className="w-full h-full object-cover object-center opacity-25 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1C16] via-[#0A1C16]/85 to-[#0A1C16]/60" />
          <div className="absolute inset-0 bg-radial-[at_top_right] from-transparent via-[#0A1C16]/70 to-[#0A1C16]" />
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-8 pb-0 flex flex-row items-end justify-between gap-2 sm:gap-3">
        <div className="flex items-center sm:items-start gap-3 sm:gap-5 min-w-0 pb-3 sm:pb-8">
          <div className="w-14 h-14 sm:w-22 sm:h-22 rounded-xl sm:rounded-2xl overflow-hidden bg-[#16382D] border-2 border-[#187B56]/50 shrink-0 shadow-[0_8px_24px_rgba(10,28,22,0.4)] p-1">
            <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden bg-white/95 flex items-center justify-center">
              <VipMedia
                src={restaurant.logo || restaurant.imagen}
                alt={restaurant.nombre}
                categoria={restaurant.categoria}
                className="w-full h-full object-contain p-1"
              />
            </div>
          </div>

          <div className="flex flex-col min-w-0 gap-1 sm:gap-1.5">
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-[#9E7844]/25 text-[#C5A059] border border-[#9E7844]/40 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Concesión Oficial</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00FF85] bg-[#187B56]/20 border border-[#187B56]/30 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                <span>Entrega a Palco</span>
              </span>
            </div>

            <h1
              className="font-headline-md text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight"
              style={{ color: "#FFFFFF" }}
            >
              {restaurant.nombre}
            </h1>

            {restaurant.descripcion && (
              <p
                className="font-body-md text-xs sm:text-sm text-[#D3DCD7] max-w-xl leading-relaxed line-clamp-1 sm:line-clamp-none"
                style={{ color: "#D3DCD7" }}
              >
                {restaurant.descripcion}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[#D3DCD7] bg-[#16382D] px-2.5 py-1 rounded-lg sm:rounded-xl border border-[#234D41]">
                <Clock className="w-3.5 h-3.5 text-[#00FF85]" />
                <span className="font-semibold">{restaurant.tiempoEntrega}</span>
              </span>

              <span className="hidden sm:inline text-[#D3DCD7] bg-[#16382D] px-3 py-1 rounded-xl border border-[#234D41]">
                Consumo mín: <strong className="text-white">${restaurant.precioMinimo}.00</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-end gap-2 shrink-0 pb-2 sm:pb-0">
          <button
            type="button"
            onClick={handleShare}
            className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#16382D] hover:bg-[#1B4336] border border-[#234D41] text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            aria-label="Compartir menú"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </button>
          <VipMascot
            name="comida"
            size="peek"
            decorative
            className="drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
          />
        </div>
      </div>
    </section>
  );
};

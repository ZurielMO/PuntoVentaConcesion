"use client";

import React from "react";
import { Clock, Share2, MapPin, Sparkles } from "lucide-react";
import type { VipRestaurant } from "@/lib/vip/types";
import { formatVipAmount } from "@/lib/vip/money";
import { VipMedia } from "../ui/media";
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
    <section className="relative w-full bg-[#062319] text-white overflow-hidden border-b border-[#C5A059]/25">
      {coverImage && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={restaurant.nombre}
            className="w-full h-full object-cover object-center opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062319] via-[#062319]/85 to-[#062319]/60" />
          <div className="absolute inset-0 bg-radial-[at_top_right] from-transparent via-[#062319]/70 to-[#062319]" />
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-8 pb-4 sm:pb-8 flex flex-row items-end justify-between gap-3">
        <div className="flex items-center sm:items-start gap-3.5 sm:gap-5 min-w-0">
          {/* Restaurant Logo with Brushed Gold Frame */}
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#0A3224] border-2 border-[#C5A059]/40 shrink-0 shadow-[0_8px_24px_rgba(4,26,18,0.4)] p-1.5 flex items-center justify-center">
            <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
              <VipMedia
                src={restaurant.logo || restaurant.imagen}
                alt={restaurant.nombre}
                categoria={restaurant.categoria}
                className="w-full h-full object-contain p-1"
              />
            </div>
          </div>

          <div className="flex flex-col min-w-0 gap-1 sm:gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 bg-[#C5A059]/15 text-[#E6C687] border border-[#C5A059]/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                <span>Establecimiento Oficial</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] bg-[#0A3224] border border-[#C5A059]/30 px-2.5 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                <span>Entrega a Suite</span>
              </span>
            </div>

            <h1
              className="font-[family-name:var(--font-montserrat)] text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight"
              style={{ color: "#FFFFFF" }}
            >
              {restaurant.nombre}
            </h1>

            {restaurant.descripcion && (
              <p
                className="font-sans text-xs sm:text-sm text-[#D3E0D9] max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-none"
                style={{ color: "#D3E0D9" }}
              >
                {restaurant.descripcion}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[#D3E0D9] bg-[#0A3224] px-2.5 py-1 rounded-xl border border-[#C5A059]/20 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="font-semibold">{restaurant.tiempoEntrega}</span>
              </span>

              <span className="hidden sm:inline text-[#D3E0D9] bg-[#0A3224] px-3 py-1 rounded-xl border border-[#C5A059]/20 shadow-2xs">
                Consumo mín: <strong className="text-white">${formatVipAmount(restaurant.precioMinimo)} MXN</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Share Button (Executive style, no cartoon mascot) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 h-10 px-3.5 sm:px-4 rounded-xl bg-[#0A3224] hover:bg-[#0D4A34] border border-[#C5A059]/30 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
            aria-label="Compartir menú"
          >
            <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        </div>
      </div>
    </section>
  );
};

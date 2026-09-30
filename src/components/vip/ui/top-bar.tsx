"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, ShoppingBag, Sparkles } from "lucide-react";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { VipHospitalityCrest } from "@/components/vip/ui/hospitality-crest";

export interface VipTopBarProps {
  title?: string;
  subtitle?: string;
  variant?: "home" | "linear" | "modal";
  onBack?: () => void;
}

export const VipTopBar: React.FC<VipTopBarProps> = ({
  title,
  subtitle,
  variant = "home",
  onBack,
}) => {
  const router = useRouter();
  const { totalItems } = useVipCart();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#062319]/95 backdrop-blur-md text-white border-b border-[#C5A059]/20 shadow-[0_4px_24px_rgba(6,35,25,0.4)] transition-all">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-[4.25rem] sm:h-[4.5rem] flex items-center justify-between gap-4">
        {/* Left: Brand Identity or Back Button */}
        {variant === "home" ? (
          <Link
            href="/servicio-palcos/inicio"
            className="flex items-center gap-3 text-white hover:opacity-95 transition-opacity group select-none"
            aria-label="Inicio Servicio Palcos VIP Club León"
          >
            <VipHospitalityCrest variant="topbar" />

            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#C5A059] uppercase leading-none">
                Club León
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-[family-name:var(--font-montserrat)] text-base sm:text-xl font-extrabold tracking-tight text-white leading-none">
                  Servicio Palcos
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#C5A059]/25 to-[#D4AF37]/20 text-[#E6C687] border border-[#C5A059]/40 px-2 py-0.5 rounded-md shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                  <span>VIP</span>
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-[#0A3224] hover:bg-[#0D4A34] border border-[#C5A059]/30 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
              aria-label={variant === "modal" ? "Cerrar" : "Regresar"}
            >
              {variant === "modal" ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <ArrowLeft className="w-5 h-5 text-white" />
              )}
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="font-[family-name:var(--font-montserrat)] text-base sm:text-xl font-extrabold text-white truncate max-w-[200px] sm:max-w-sm tracking-tight leading-tight">
                {title || (variant === "modal" ? "Detalle" : "Servicio Palcos VIP")}
              </h1>
              {subtitle && (
                <span className="text-xs sm:text-sm text-[#C9D5CF] truncate">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Right: Cart CTA Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/servicio-palcos/carrito"
            className="relative flex items-center gap-2 h-10 sm:h-11 px-3.5 sm:px-4.5 rounded-xl bg-gradient-to-r from-[#0D4A34] to-[#145C42] hover:from-[#10563D] hover:to-[#176B4D] text-white font-[family-name:var(--font-montserrat)] text-sm sm:text-base font-bold transition-all shadow-[0_4px_16px_rgba(6,46,32,0.35)] hover:shadow-[0_6px_22px_rgba(197,160,89,0.25)] cursor-pointer active:scale-95 border border-[#C5A059]/30 select-none"
            aria-label={`Ver carrito (${totalItems} artículos)`}
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.2] text-[#E6C687]" />
            <span className="hidden sm:inline">Carrito</span>
            {totalItems > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#D4AF37] text-[#062319] font-black text-xs flex items-center justify-center border border-white/40 shadow-xs">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, ShoppingBag } from "lucide-react";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { VipMascot } from "@/components/vip/ui/mascot";

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
    <header className="sticky top-0 z-40 bg-[#0A1C16] text-white border-b border-[#234D41]/80 shadow-[0_4px_20px_rgba(10,28,22,0.3)] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity or Back Button */}
        {variant === "home" ? (
          <Link
            href="/servicio-palcos/inicio"
            className="flex items-center gap-3 text-white hover:opacity-95 transition-opacity group select-none"
          >
            <div className="relative w-11 h-11 rounded-xl bg-[#16382D] border border-[#00FF85]/30 shadow-sm overflow-hidden flex items-center justify-center group-hover:border-[#00FF85]/60 transition-colors shrink-0">
              <VipMascot
                name="icono"
                size="logo"
                className="w-[38px] h-[38px] translate-y-[1px]"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-md text-lg sm:text-xl font-extrabold tracking-tight text-white leading-none">
                  Servicio Palcos
                </span>
                <span className="text-[10px] font-label-sm uppercase font-extrabold tracking-wider bg-[#9E7844]/25 text-[#C5A059] border border-[#9E7844]/40 px-1.5 py-0.2 rounded-md">
                  Palcos
                </span>
              </div>
              <span className="text-xs font-label-sm text-[#7E8E87] tracking-wider uppercase font-semibold mt-0.5">
                Club León
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-[#16382D] hover:bg-[#1B4336] border border-[#234D41] flex items-center justify-center text-white transition-all cursor-pointer shrink-0 active:scale-95"
              aria-label={variant === "modal" ? "Cerrar" : "Regresar"}
            >
              {variant === "modal" ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <ArrowLeft className="w-5 h-5 text-white" />
              )}
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="font-headline-md text-lg sm:text-xl font-extrabold text-white truncate max-w-[220px] sm:max-w-sm tracking-tight leading-tight">
                {title || (variant === "modal" ? "Detalle" : "Servicio Palcos")}
              </h1>
              {subtitle && (
                <span className="text-xs sm:text-sm font-body-md text-[#D3DCD7] truncate">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Cart CTA Button */}
          <Link
            href="/servicio-palcos/carrito"
            className="relative flex items-center gap-2 h-11 px-4 sm:px-4.5 rounded-xl bg-[#187B56] hover:bg-[#136244] text-white font-headline-md text-base font-extrabold transition-all shadow-[0_4px_14px_rgba(24,123,86,0.3)] hover:shadow-[0_6px_18px_rgba(24,123,86,0.4)] cursor-pointer active:scale-95 border border-[#187B56]/30 select-none"
            aria-label={`Ver carrito (${totalItems} artículos)`}
          >
            <ShoppingBag className="w-4.5 h-4.5 stroke-[2.2]" />
            <span className="hidden sm:inline">Carrito</span>
            {totalItems > 0 && (
              <span className="min-w-[22px] h-5.5 px-1.5 rounded-full bg-[#9E7844] text-white font-extrabold text-xs flex items-center justify-center border border-white/20 shadow-xs">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

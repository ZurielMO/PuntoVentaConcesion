"use client";

import React from "react";
import { Sparkles, Crown } from "lucide-react";

interface HospitalityCrestProps {
  variant?: "topbar" | "hero" | "card" | "mini";
  className?: string;
}

export const VipHospitalityCrest: React.FC<HospitalityCrestProps> = ({
  variant = "hero",
  className = "",
}) => {
  if (variant === "topbar" || variant === "mini") {
    return (
      <div
        className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-b from-[#0A3224] to-[#041A12] border border-[#C5A059]/40 p-1 shadow-[0_2px_12px_rgba(197,160,89,0.2)] flex items-center justify-center group-hover:border-[#D4AF37]/80 transition-all shrink-0 select-none ${className}`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/club-leon-fc.png"
            alt="Club León VIP"
            className="w-auto h-[90%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          />
        </div>
        {/* Subtle gold corner spark */}
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37] border border-[#041A12] shadow-xs" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`relative w-12 h-12 rounded-xl bg-gradient-to-b from-[#0D4A34] to-[#062319] border border-[#C5A059]/40 p-1.5 flex items-center justify-center shadow-md ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/club-leon-fc.png"
          alt="Club León VIP"
          className="w-auto h-full object-contain drop-shadow-sm"
        />
      </div>
    );
  }

  // Hero luxury emblem (hospitality badge replacing cartoon)
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-label="Insignia Servicio Palcos VIP Club León"
    >
      {/* Ambient background gold glow */}
      <div className="absolute w-44 sm:w-56 h-44 sm:h-56 rounded-full bg-gradient-to-tr from-[#C5A059]/20 via-[#D4AF37]/15 to-transparent blur-2xl pointer-events-none" />

      {/* Main Luxury Suite Shield Card */}
      <div className="relative w-44 sm:w-52 md:w-56 rounded-2xl bg-gradient-to-b from-[#0D4A34]/90 via-[#062319]/95 to-[#041A12] border border-[#C5A059]/40 p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl flex flex-col items-center text-center overflow-hidden">
        {/* Top Gold Hairline accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

        {/* Top Badge: VIP SUITES */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E6C687] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] mb-3 shadow-xs">
          <Crown className="w-2.5 h-2.5 text-[#D4AF37]" />
          <span>EXPERIENCIA VIP</span>
        </div>

        {/* Club León Crest in Gold Ring */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 my-1 flex items-center justify-center">
          {/* Subtle concentric gold rings */}
          <div className="absolute inset-0 rounded-full border border-[#C5A059]/25 animate-pulse" />
          <div className="absolute inset-1.5 rounded-full border border-[#D4AF37]/40 bg-gradient-to-b from-[#0A3224] to-[#051C14] shadow-inner" />

          {/* Official Shield */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/club-leon-fc.png"
            alt="Club León FC Escudo Oficial"
            className="relative z-10 w-auto h-16 sm:h-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Bottom Text: ESTADIO LEÓN · PALCOS */}
        <div className="mt-2.5 pt-2 border-t border-[#C5A059]/25 w-full flex flex-col items-center">
          <span className="text-[10px] sm:text-[11px] font-black tracking-[0.2em] text-[#E6C687] uppercase">
            Estadio León
          </span>
          <span className="text-[8px] sm:text-[9px] text-[#A3B8AF] tracking-wider uppercase font-semibold mt-0.5">
            Servicio Exclusivo Palcos
          </span>
        </div>

        {/* Decorative corner stars */}
        <Sparkles className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-[#C5A059]/40" />
      </div>
    </div>
  );
};

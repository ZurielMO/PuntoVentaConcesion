"use client";

import React from "react";
import { Sparkles, ShieldCheck, Zap, Clock } from "lucide-react";
import { motion } from "motion/react";
import { VipHospitalityCrest } from "@/components/vip/ui/hospitality-crest";

export const VipHeroBanner: React.FC = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl sm:rounded-[26px] bg-gradient-to-br from-[#041A12] via-[#062319] to-[#0A3224] text-white p-4.5 sm:p-7 md:p-8 shadow-[0_16px_40px_rgba(4,26,18,0.3)] border border-[#C5A059]/30 vip-gold-trim"
    >
      {/* Subtle radial luxury glows */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#C5A059]/10 blur-3xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-[#145C42]/15 blur-2xl pointer-events-none -mb-20" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-5 md:gap-8">
        {/* Left Column: Editorial & Hospitality Details */}
        <div className="flex flex-col justify-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E6C687] text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] w-fit shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Club León</span>
          </div>

          {/* Main Title */}
          <h1 className="font-[family-name:var(--font-montserrat)] text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-extrabold tracking-tight text-white leading-[1.2]">
            Alimentos y Bebidas Directo a tu Palco
          </h1>

          {/* Editorial Subtitle */}
          <p className="font-sans text-xs sm:text-sm md:text-base text-[#D3E0D9] leading-relaxed max-w-xl">
            Ordena desde tu suite durante el partido en el Estadio León. Sin filas, con cobro seguro en línea y entrega personalizada en tu asiento.
          </p>

          {/* Service Guarantee Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#C9D5CF] text-[11px] font-medium backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Cobro seguro</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#C9D5CF] text-[11px] font-medium backdrop-blur-xs">
              <Zap className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Entrega a tu palco</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#C9D5CF] text-[11px] font-medium backdrop-blur-xs">
              <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Rastreo en vivo</span>
            </div>
          </div>
        </div>

        {/* Right Column: Prestigious VIP Insignia (replaces cartoon mascot) */}
        <div className="hidden sm:flex items-center justify-center shrink-0 self-center">
          <VipHospitalityCrest variant="hero" />
        </div>
      </div>
    </motion.section>
  );
};

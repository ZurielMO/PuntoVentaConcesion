"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { VipMascot } from "@/components/vip/ui/mascot";

export const VipHeroBanner: React.FC = () => {
  return (
    <motion.section
      initial={{ opacity: 1, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl sm:rounded-[24px] bg-gradient-to-r from-[#0A1C16] via-[#102D24] to-[#16382D] text-white px-4 pt-4 pb-0 sm:px-7 sm:pt-7 md:px-8 md:pt-8 shadow-[0_12px_32px_rgba(10,28,22,0.22)] border border-[#234D41]/80"
    >
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#187B56]/15 blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-[#9E7844]/10 blur-2xl pointer-events-none -mb-20" />

      <div className="relative z-10 flex flex-row items-end justify-between gap-2 sm:gap-6">
        <div className="flex flex-col gap-2 min-w-0 flex-1 pb-4 sm:pb-7 md:pb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#9E7844]/20 border border-[#9E7844]/40 text-[#C5A059] text-xs sm:text-sm font-label-md font-extrabold w-fit shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Servicio Exclusivo en Palcos</span>
          </div>

          <h1
            className="font-headline-md text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight"
            style={{ color: "#FFFFFF" }}
          >
            Alimentos y Bebidas Directo a tu Palco
          </h1>

          <p
            className="font-body-md text-sm sm:text-base text-[#D3DCD7] leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-none"
            style={{ color: "#D3DCD7" }}
          >
            Ordena desde tu asiento durante el partido en el Estadio León. Sin filas, con cobro seguro en línea y entrega personalizada.
          </p>
        </div>

        <div className="relative flex justify-end shrink-0 self-end">
          <VipMascot
            name="inicio"
            size="hero"
            priority
            className="drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)] translate-y-1 md:translate-y-2"
          />
        </div>
      </div>
    </motion.section>
  );
};

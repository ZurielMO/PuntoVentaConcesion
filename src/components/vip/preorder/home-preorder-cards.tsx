"use client";

import React from "react";
import { CalendarClock, PackageSearch, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { useVipPreorderAvailability } from "@/hooks/vip/use-vip-preorder-availability";
import { vipToast } from "@/hooks/vip/use-vip-toast";
import { formatVipStadiumTime } from "@/lib/vip/types";
import { preorderDateBadge } from "@/lib/vip/preorder";
import { VipGuideLookupForm } from "./guide-lookup-form";

export function VipHomePreorderCard({ menuAnchorId = "menu-palcos" }: { menuAnchorId?: string }) {
  const { setOrderMode } = useVipCart();
  const { data, loading } = useVipPreorderAvailability(null, { pollMs: 120_000 });
  const next = data?.matches[0] || null;
  const badge = next ? preorderDateBadge(next.matchDate) : null;
  const kickoff = next ? formatVipStadiumTime(next.kickoffAt) : "";

  const start = () => {
    setOrderMode("PREORDER");
    vipToast.success("Modo preventa activado", {
      id: "vip-preorder-mode",
      description: "Elige tus productos. Al pagar seleccionas el partido y el horario de entrega.",
    });
    document.getElementById(menuAnchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl sm:rounded-[24px] border border-[#E5EBE8] bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(6,46,32,0.04)] hover:shadow-[0_8px_30px_rgba(6,46,32,0.08)] transition-all flex flex-col justify-between group"
    >
      {/* Top gold hairline trim */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />

      <div>
        <div className="flex items-start gap-4">
          {/* Executive stadium ticket date badge */}
          <div className="flex h-[76px] w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#062419] to-[#0A3224] border border-[#C5A059]/40 text-white shadow-sm">
            {badge ? (
              <>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D4AF37]">
                  {badge.month}
                </span>
                <span className="font-[family-name:var(--font-montserrat)] text-2xl font-black leading-none tabular-nums text-white">
                  {badge.day}
                </span>
                <span className="text-[10px] font-semibold capitalize text-[#C9D5CF]">
                  {badge.weekday}
                </span>
              </>
            ) : (
              <CalendarClock className={`h-7 w-7 text-[#D4AF37] ${loading ? "animate-pulse" : ""}`} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#A67C2E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0D4A34] shadow-[0_0_0_3px_rgba(13,74,52,0.18)] animate-pulse" />
              Preventa Exclusiva
            </span>
            <h2 className="mt-1 font-[family-name:var(--font-montserrat)] text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#111827]">
              Programa tu pedido para el próximo partido
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              {next
                ? `Partido ${next.jornadaNumero} · ${next.matchLabel}${kickoff ? ` · ${kickoff} h` : ""}. `
                : ""}
              Elige el horario de entrega en tu palco y preparamos tu orden con anticipación.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={start}
          className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#062E20] to-[#0D4A34] hover:from-[#093E2B] hover:to-[#115C41] text-white font-[family-name:var(--font-montserrat)] text-sm sm:text-base font-bold transition-all shadow-[0_4px_16px_rgba(6,46,32,0.2)] hover:shadow-[0_6px_22px_rgba(197,160,89,0.2)] active:scale-[0.98] cursor-pointer px-6 border border-[#C5A059]/25"
        >
          <CalendarClock className="h-4 w-4 text-[#D4AF37]" />
          <span>Programar pedido</span>
        </button>
      </div>
    </motion.section>
  );
}

export function VipHomeGuideLookupCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl sm:rounded-[24px] border border-[#E5EBE8] bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(6,46,32,0.04)] hover:shadow-[0_8px_30px_rgba(6,46,32,0.08)] transition-all flex flex-col justify-between group"
    >
      {/* Top gold hairline trim */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />

      <div>
        <div className="mb-4 flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D4A34]/8 text-[#0D4A34] border border-[#0D4A34]/15 shadow-xs">
            <PackageSearch className="h-5 w-5 stroke-[2.2] text-[#0D4A34]" />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#A67C2E]">
              <Sparkles className="w-2.5 h-2.5 text-[#C5A059]" />
              Seguimiento Concierge
            </span>
            <h2 className="mt-1 font-[family-name:var(--font-montserrat)] text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#111827]">
              Consulta tu pedido
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              Escribe la guía que llegó a tu correo para ver el estado de preparación y entrega.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <VipGuideLookupForm />
      </div>
    </motion.section>
  );
}

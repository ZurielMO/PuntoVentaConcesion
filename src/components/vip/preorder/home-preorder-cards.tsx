"use client";

import React from "react";
import { CalendarClock, PackageSearch } from "lucide-react";
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
      className="relative overflow-hidden rounded-[22px] border border-[#DFE5E2] bg-white p-5 sm:p-6 shadow-xs"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#9E7844] via-[#C5A059] to-[#9E7844]" />
      <div className="flex items-start gap-4">
        <div className="flex h-[72px] w-[64px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#102D24] text-white">
          {badge ? (
            <>
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#C5A059]">{badge.month}</span>
              <span className="font-headline-md text-[26px] font-black leading-none tabular-nums">{badge.day}</span>
              <span className="text-[10px] font-semibold capitalize text-[#C9D5CF]">{badge.weekday}</span>
            </>
          ) : (
            <CalendarClock className={`h-7 w-7 text-[#FADC06] ${loading ? "animate-pulse" : ""}`} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#9E7844]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#187B56] shadow-[0_0_0_3px_rgba(24,123,86,0.18)]" />
            Preventa abierta
          </span>
          <h2 className="mt-1 font-headline-md text-lg sm:text-xl font-extrabold tracking-tight text-[#111614]">
            Programa tu pedido para el próximo partido
          </h2>
          <p className="mt-1 text-sm text-[#4E5C56] leading-relaxed">
            {next
              ? `Partido ${next.jornadaNumero} · ${next.matchLabel}${kickoff ? ` · ${kickoff} h` : ""}. `
              : ""}
            Elige una ventana de entrega de {data?.slotMinutes || 25} min y lo preparamos con anticipación.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={start}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#102D24] font-headline-md text-base font-extrabold text-white transition-all hover:bg-[#183C32] active:scale-[0.98] cursor-pointer sm:w-auto sm:px-6"
      >
        <CalendarClock className="h-4 w-4 text-[#FADC06]" />
        Programar pedido
      </button>
    </motion.section>
  );
}

export function VipHomeGuideLookupCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[22px] border border-[#DFE5E2] bg-white p-5 sm:p-6 shadow-xs"
    >
      <div className="mb-4 flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#187B56]/10 text-[#187B56]">
          <PackageSearch className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <h2 className="font-headline-md text-lg sm:text-xl font-extrabold tracking-tight text-[#111614]">
            Consulta tu pedido
          </h2>
          <p className="text-sm text-[#4E5C56] leading-relaxed">
            Escribe la guía que llegó a tu correo para ver si ya está pagado, en preparación o entregado.
          </p>
        </div>
      </div>
      <VipGuideLookupForm />
    </motion.section>
  );
}

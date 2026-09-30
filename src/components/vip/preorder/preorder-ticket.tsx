"use client";

import React from "react";
import { CalendarClock } from "lucide-react";
import { formatVipGuide, type VipPreorderInfo } from "@/lib/vip/types";
import { preorderMatchLine, preorderPhaseLabel } from "@/lib/vip/preorder";

type TicketInfo = Pick<
  VipPreorderInfo,
  "jornadaNumero" | "matchLabel" | "matchDate" | "kickoffAt" | "stadium" | "windowLabel" | "windowStartAt"
>;

/** Resumen tipo boleto de una preventa: partido arriba, ventana de entrega destacada abajo. */
export function VipPreorderTicket({
  info,
  guide,
  palco,
  className = "",
  surface = "#F8FAF9",
}: {
  info: TicketInfo;
  guide?: string | null;
  palco?: string | null;
  className?: string;
  /** Color del fondo donde se coloca, para que las muescas del boleto se integren. */
  surface?: string;
}) {
  const phase = preorderPhaseLabel(info.windowStartAt, info.kickoffAt);
  const guideLabel = formatVipGuide(guide);

  return (
    <section
      aria-label="Detalle de la preventa"
      className={`relative overflow-hidden rounded-2xl sm:rounded-[24px] bg-gradient-to-br from-[#041A12] via-[#062319] to-[#0A3224] text-white shadow-[0_16px_40px_rgba(4,26,18,0.3)] border border-[#C5A059]/35 ${className}`}
    >
      <div className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-[#C5A059]/15 blur-3xl" />

      <div className="relative px-5 pt-5 pb-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C5A059]/40 bg-[#C5A059]/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#E6C687]">
            <CalendarClock className="h-3.5 w-3.5 text-[#D4AF37]" />
            Preventa{info.jornadaNumero ? ` · Partido ${info.jornadaNumero}` : ""}
          </span>
          {guideLabel && (
            <span className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">Guía</span>
              <span className="font-mono text-sm font-bold tracking-[0.14em] text-white">{guideLabel}</span>
            </span>
          )}
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-montserrat)] text-xl sm:text-2xl font-extrabold tracking-tight text-white" style={{ color: "#FFFFFF" }}>
          {info.matchLabel}
        </h3>
        <p className="mt-1 text-sm text-[#C9D5CF]" style={{ color: "#C9D5CF" }}>
          {preorderMatchLine(info)}
        </p>
      </div>

      <div className="relative flex items-center" aria-hidden>
        <span className="-ml-3 h-6 w-6 rounded-full" style={{ backgroundColor: surface }} />
        <span className="mx-2 h-px flex-1 border-t border-dashed border-[#C5A059]/30" />
        <span className="-mr-3 h-6 w-6 rounded-full" style={{ backgroundColor: surface }} />
      </div>

      <div className="relative flex items-end justify-between gap-4 px-5 pt-3 pb-5 sm:px-6">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#A3B8AF]">
            Entrega en tu palco{palco ? ` ${palco}` : ""}
          </span>
          <span className="mt-1 block font-[family-name:var(--font-montserrat)] text-2xl sm:text-[32px] font-black leading-none tracking-tight tabular-nums text-[#D4AF37]">
            {info.windowLabel}
          </span>
        </div>
        {phase && (
          <span className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-[#E6C687] border border-[#C5A059]/30">
            {phase}
          </span>
        )}
      </div>
    </section>
  );
}

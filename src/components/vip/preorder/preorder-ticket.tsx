"use client";

import React from "react";
import { CalendarClock } from "lucide-react";
import { formatVipGuide, type VipPreorderInfo } from "@/lib/vip/types";
import { preorderMatchLine, preorderPhaseLabel } from "@/lib/vip/preorder";
import { GUIDE_CODE_FONT } from "../ui/guide-font";

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
  surface = "var(--color-palco-ground)",
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
      className={`palco-on-dark relative overflow-hidden rounded-[var(--radius-palco-lg)] bg-palco-900 text-palco-on-dark ${className}`}
    >
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-palco-gold">
            <CalendarClock aria-hidden className="size-4" />
            Preventa{info.jornadaNumero ? ` · Partido ${info.jornadaNumero}` : ""}
          </span>
          {guideLabel && (
            <span className="text-right">
              <span className="block text-xs text-palco-on-dark-2">Guía</span>
              <span className={`${GUIDE_CODE_FONT} text-sm font-semibold tracking-[0.12em]`}>{guideLabel}</span>
            </span>
          )}
        </div>
        <h3 className="mt-2 font-palco-display text-xl font-bold tracking-[-0.01em] text-palco-on-dark">{info.matchLabel}</h3>
        <p className="mt-0.5 text-sm text-palco-on-dark-2">{preorderMatchLine(info)}</p>
      </div>

      <div className="relative flex items-center" aria-hidden>
        <span className="-ml-3 size-6 rounded-full" style={{ backgroundColor: surface }} />
        <span className="mx-2 h-px flex-1 border-t border-dashed border-white/20" />
        <span className="-mr-3 size-6 rounded-full" style={{ backgroundColor: surface }} />
      </div>

      <div className="flex items-end justify-between gap-4 px-5 pb-5 pt-3">
        <div>
          <span className="block text-sm text-palco-on-dark-2">Llega a tu palco{palco ? ` ${palco}` : ""}</span>
          <span className="palco-num mt-1 block whitespace-nowrap font-palco-display text-[1.5rem] font-extrabold leading-none tracking-[-0.01em] text-palco-gold sm:text-[1.75rem]">
            {info.windowLabel}
          </span>
        </div>
        {phase && <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-palco-on-dark">{phase}</span>}
      </div>
    </section>
  );
}

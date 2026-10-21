"use client";

import React from "react";
import type { VipPreorderMatch } from "@/lib/vip/types";
import { formatVipStadiumTime } from "@/lib/vip/types";
import { preorderDateBadge } from "@/lib/vip/preorder";
import type { VipServiceStatusView } from "@/hooks/vip/use-vip-public-sales";
import { VipSkeleton } from "../ui/skeleton";

type Tone = "live" | "preorder" | "closed";

export function vipServiceHeadline(
  sales: VipServiceStatusView,
  nextMatch: VipPreorderMatch | null,
): { tone: Tone; title: string; detail: string } {
  if (sales.failed) {
    return { tone: "closed", title: "No pudimos consultar el servicio", detail: "Revisa tu conexión; lo intentamos de nuevo en unos segundos." };
  }
  if (sales.liveOrdersOpen) {
    return { tone: "live", title: "Entrega inmediata abierta", detail: "Pide ahora y te lo llevamos durante el partido." };
  }
  if (sales.preordersEnabled && nextMatch) {
    const badge = preorderDateBadge(nextMatch.matchDate);
    const kickoff = formatVipStadiumTime(nextMatch.kickoffAt);
    return {
      tone: "preorder",
      title: "Preventa abierta",
      detail: `Partido ${nextMatch.jornadaNumero} · ${nextMatch.matchLabel} · ${badge.weekday} ${badge.day} ${badge.month.toLowerCase()}${kickoff ? `, ${kickoff} h` : ""}`,
    };
  }
  if (sales.preordersEnabled) {
    return {
      tone: "preorder",
      title: "Preventa sin horarios por ahora",
      detail: "Puedes armar tu pedido; el pago se activa cuando se publiquen los horarios del próximo partido.",
    };
  }
  return { tone: "closed", title: "Servicio cerrado por ahora", detail: "Vuelve a visitar más tarde." };
}

const DOT: Record<Tone, string> = {
  live: "bg-palco-live",
  preorder: "bg-palco-gold",
  closed: "bg-palco-on-dark-2",
};

/** Banda de contexto de inicio: qué es, dónde llega y si hoy se puede pedir o programar. */
export function VipHomeContext({
  sales,
  nextMatch,
  matchLoading,
}: {
  sales: VipServiceStatusView;
  nextMatch: VipPreorderMatch | null;
  matchLoading: boolean;
}) {
  const waitingMatch = sales.ready && !sales.liveOrdersOpen && sales.preordersEnabled && matchLoading;
  const headline = vipServiceHeadline(sales, nextMatch);

  return (
    <section aria-labelledby="palco-home-title" className="palco-on-dark bg-palco-900 text-palco-on-dark">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-3 md:px-6 md:pb-16 md:pt-9">
        <h1
          id="palco-home-title"
          className="text-balance font-palco-display text-[1.625rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-palco-on-dark md:text-[2.75rem]"
        >
          Pide sin salir de tu palco
        </h1>
        <p className="mt-1.5 max-w-md text-[15px] leading-snug text-palco-on-dark-2 md:text-base">
          Comida y bebida del Estadio León, directo a tu palco.
        </p>

        <div className="mt-3 min-h-10" role="status" aria-live="polite">
          {!sales.ready || waitingMatch ? (
            <div className="flex flex-col gap-1.5">
              <VipSkeleton dark className="h-4 w-48" />
              <VipSkeleton dark className="h-3.5 w-64" />
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <span
                aria-hidden
                className={`mt-[7px] size-2 shrink-0 rounded-full ${DOT[headline.tone]} ${headline.tone === "live" ? "palco-live-dot" : ""}`}
              />
              <p className="text-sm leading-snug">
                <span className="block font-semibold text-palco-on-dark">{headline.title}</span>
                <span className="block text-palco-on-dark-2">{headline.detail}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

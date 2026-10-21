"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { vipToast } from "@/hooks/vip/use-vip-toast";
import type { VipServiceStatusView } from "@/hooks/vip/use-vip-public-sales";
import { formatVipGuide, formatVipStadiumTime, type VipPreorderMatch } from "@/lib/vip/types";
import { preorderDateBadge } from "@/lib/vip/preorder";
import { readRecentOrders, type VipRecentOrder } from "@/lib/vip/recent-orders";
import { VipGuideLookupForm, guideLookupPath } from "./guide-lookup-form";
import { VipButton } from "../ui/button";
import { GUIDE_CODE_FONT } from "../ui/guide-font";

export function VipRecentOrdersList({ title = "Pedidos en este dispositivo" }: { title?: string }) {
  const [orders, setOrders] = useState<VipRecentOrder[]>([]);
  useEffect(() => setOrders(readRecentOrders()), []);
  if (orders.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-palco-ink-2">{title}</h3>
      <ul className="mt-2 divide-y divide-palco-line rounded-[var(--radius-palco-md)] border border-palco-line">
        {orders.map((order) => (
          <li key={order.guide}>
            <Link
              href={guideLookupPath(order.guide)}
              className="palco-press flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-palco-ground"
            >
              <span className="min-w-0 flex-1">
                <span className={`block ${GUIDE_CODE_FONT} text-[15px] font-semibold tracking-[0.12em] text-palco-ink`}>
                  {formatVipGuide(order.guide)}
                </span>
                <span className="block truncate text-[13px] text-palco-ink-3">
                  {order.preorder
                    ? `Preventa · ${order.preorder.matchLabel} · ${order.preorder.windowLabel}`
                    : `Pedido ${order.orderNumber.split("-").at(-1) || order.orderNumber}`}
                </span>
              </span>
              <ChevronRight aria-hidden className="size-5 shrink-0 text-palco-ink-3" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Funciones secundarias de inicio: consultar un pedido y programar para el próximo partido. */
export function VipHomeOrderHelp({
  sales,
  nextMatch,
  onScheduled,
}: {
  sales: VipServiceStatusView;
  nextMatch: VipPreorderMatch | null;
  onScheduled?: () => void;
}) {
  const { orderMode, setOrderMode } = useVipCart();
  // Solo cuando conviven entrega inmediata y preventa hay algo que decidir aquí;
  // si solo hay preventa, la banda de inicio ya lo dice y el pago la toma sola.
  const showSchedule = sales.liveOrdersOpen && sales.preordersEnabled && Boolean(nextMatch);

  const schedule = () => {
    setOrderMode("PREORDER");
    vipToast.success("Pedido programado para el próximo partido", {
      id: "vip-preorder-mode",
      description: "Elige tus productos. Al pagar eliges el horario de entrega en tu palco.",
    });
    onScheduled?.();
  };

  const badge = nextMatch ? preorderDateBadge(nextMatch.matchDate) : null;
  const kickoff = nextMatch ? formatVipStadiumTime(nextMatch.kickoffAt) : "";

  return (
    <div className={`grid grid-cols-1 gap-4 ${showSchedule ? "md:grid-cols-2" : ""}`}>
      <section
        aria-labelledby="palco-help-guide"
        className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-5 md:p-6"
      >
        <h2 id="palco-help-guide" className="font-palco-display text-lg font-bold text-palco-ink">
          Consulta tu pedido
        </h2>
        <p className="mt-1 text-sm text-palco-ink-3">Revisa en qué va tu pedido con la guía que te enviamos.</p>
        <div className="mt-4">
          <VipGuideLookupForm />
        </div>
        <div className="mt-5 empty:hidden">
          <VipRecentOrdersList />
        </div>
      </section>

      {showSchedule && nextMatch && badge && (
        <section
          aria-labelledby="palco-help-preorder"
          className="flex flex-col rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-5 md:p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-[var(--radius-palco-md)] bg-palco-900 text-palco-on-dark">
              <span className="text-[11px] font-semibold text-palco-gold">{badge.month}</span>
              <span className="palco-num font-palco-display text-2xl font-extrabold leading-none">{badge.day}</span>
              <span className="text-[11px] capitalize text-palco-on-dark-2">{badge.weekday}</span>
            </div>
            <div className="min-w-0">
              <h2 id="palco-help-preorder" className="font-palco-display text-lg font-bold text-palco-ink">
                ¿Vienes al próximo partido?
              </h2>
              <p className="mt-1 text-sm text-palco-ink-3">
                Partido {nextMatch.jornadaNumero} · {nextMatch.matchLabel}
                {kickoff ? ` · ${kickoff} h` : ""}. Programa tu pedido y elige a qué hora llega a tu palco.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-auto md:pt-5">
            {orderMode === "PREORDER" ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-palco-50 px-3.5 py-2 text-sm font-semibold text-palco-700">
                  <CalendarClock aria-hidden className="size-4" />
                  Tu pedido está en modo preventa
                </span>
                <button
                  type="button"
                  onClick={() => setOrderMode("NOW")}
                  className="palco-press min-h-11 rounded-full px-3 text-sm font-semibold text-palco-ink-2 hover:bg-palco-sunken"
                >
                  Pedir para hoy
                </button>
              </div>
            ) : (
              <VipButton variant="outline" onClick={schedule}>
                <CalendarClock aria-hidden className="size-4" />
                Programar pedido
              </VipButton>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// Compatibilidad: nombres anteriores.
export { VipHomeOrderHelp as VipHomePreorderCard };

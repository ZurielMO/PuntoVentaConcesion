"use client";

import React from "react";
import { KdsTicketCard } from "./kds-ticket-card";
import type { VipOrder, VipOrderStatus } from "@/lib/vip/types";
import { isVipHistoryStatus, isVipNewStatus, isVipOnTheWayStatus } from "@/lib/vip/types";
import { Sparkles, Bike, History } from "lucide-react";

interface KdsBoardProps {
  orders: VipOrder[];
  onAdvance: (orderId: string, nextStatus: VipOrderStatus) => void;
  onSelectOrder: (order: VipOrder) => void;
}

export const KdsBoard: React.FC<KdsBoardProps> = ({
  orders,
  onAdvance,
  onSelectOrder,
}) => {
  const columns = [
    {
      id: "NEW",
      title: "NUEVOS",
      badgeColor: "bg-[#D99721] text-white",
      borderColor: "border-[#D99721]/30",
      icon: Sparkles,
      empty: "Sin pedidos nuevos",
      orders: orders.filter((order) => isVipNewStatus(order.estado)),
    },
    {
      id: "ON_THE_WAY",
      title: "EN CAMINO",
      badgeColor: "bg-[#3978A8] text-white",
      borderColor: "border-[#3978A8]/30",
      icon: Bike,
      empty: "Sin pedidos en camino",
      orders: orders.filter((order) => isVipOnTheWayStatus(order.estado)),
    },
    {
      id: "HISTORY",
      title: "HISTORIAL",
      badgeColor: "bg-[#187B56] text-white",
      borderColor: "border-[#187B56]/30",
      icon: History,
      empty: "Sin pedidos en historial",
      orders: orders.filter((order) => isVipHistoryStatus(order.estado)),
    },
  ];

  return (
    <section className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 pb-4 min-h-[320px]">
      {columns.map((col) => {
        const IconComponent = col.icon;
        return (
          <div
            key={col.id}
            className={`
              w-full md:flex-1 flex flex-col gap-3 bg-[#EEF2F0] rounded-3xl p-3 border shadow-xs min-h-[220px]
              ${col.borderColor}
            `}
          >
            <div className="flex justify-between items-center px-1 py-1">
              <div className="flex items-center gap-2">
                <IconComponent className="w-5 h-5 text-[#171A19]" />
                <h3 className="font-headline-md text-base font-extrabold text-[#171A19] tracking-wide">
                  {col.title}
                </h3>
              </div>
              <span
                className={`text-sm px-2.5 py-1 rounded-full font-extrabold shadow-xs ${col.badgeColor}`}
              >
                {col.orders.length}
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {col.orders.length === 0 ? (
                <div className="flex-1 min-h-[120px] flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-[#CCD5D1] rounded-2xl bg-white/40">
                  <p className="font-body-md text-base text-[#66706B]">{col.empty}</p>
                </div>
              ) : (
                col.orders.map((order) => (
                  <KdsTicketCard
                    key={order.id}
                    order={order}
                    onAdvance={onAdvance}
                    onSelectOrder={onSelectOrder}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
};

"use client";

import React from "react";
import { CalendarClock, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { VipOrderMode } from "@/hooks/vip/use-vip-cart";
import { VIP_PURCHASE_UNAVAILABLE_HINT } from "@/lib/vip/purchase-availability";

const OPTIONS: Array<{
  mode: VipOrderMode;
  title: string;
  available: string;
  unavailable: string;
  Icon: typeof Zap;
}> = [
  {
    mode: "NOW",
    title: "Entrega ahora",
    available: "Durante el partido en curso",
    unavailable: "Por el momento no está disponible",
    Icon: Zap,
  },
  {
    mode: "PREORDER",
    title: "Preventa",
    available: "Programa partido y horario",
    unavailable: "Por el momento no está disponible",
    Icon: CalendarClock,
  },
];

export function VipOrderModeSwitch({
  value,
  onChange,
  nowAvailable,
  nowClosedLabel = "Por el momento no está disponible",
  preorderAvailable,
}: {
  value: VipOrderMode;
  onChange: (mode: VipOrderMode) => void;
  nowAvailable: boolean;
  nowClosedLabel?: string;
  preorderAvailable: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo de pedido"
      className="grid grid-cols-2 gap-1 rounded-[20px] border border-[#DFE5E2] bg-white p-1.5 shadow-xs"
    >
      {OPTIONS.map(({ mode, title, available, unavailable, Icon }) => {
        const enabled = mode === "NOW" ? nowAvailable : preorderAvailable;
        const selected = value === mode;
        let caption = unavailable;
        if (enabled) caption = available;
        else if (mode === "NOW") caption = nowClosedLabel;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!enabled}
            onClick={() => onChange(mode)}
            className={`relative flex min-h-[64px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C8643] disabled:cursor-not-allowed ${
              selected ? "text-white" : "text-[#111614] hover:bg-[#F6F8F7]"
            } ${!enabled ? "opacity-50" : "cursor-pointer"}`}
          >
            {selected && (
              <motion.span
                layoutId="vip-order-mode-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#102D24] to-[#0A1C16] shadow-[0_6px_18px_rgba(10,28,22,0.25)]"
              />
            )}
            <span
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                selected ? "bg-white/10 text-[#FADC06]" : "bg-[#187B56]/10 text-[#187B56]"
              }`}
            >
              <Icon className="h-[18px] w-[18px] stroke-[2.3]" />
            </span>
            <span className="relative min-w-0">
              <span className="block font-headline-md text-[15px] sm:text-base font-extrabold leading-tight">{title}</span>
              <span
                className={`block text-xs sm:text-[13px] font-medium leading-snug ${
                  enabled ? "truncate" : ""
                } ${selected ? "text-[#C9D5CF]" : "text-[#6E7E77]"}`}
              >
                {caption}
              </span>
              {!enabled && (
                <span className={`block text-[11px] font-medium leading-snug ${selected ? "text-[#C9D5CF]" : "text-[#6E7E77]"}`}>
                  {VIP_PURCHASE_UNAVAILABLE_HINT}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

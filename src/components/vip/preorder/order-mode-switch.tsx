"use client";

import React from "react";
import { CalendarClock, Zap } from "lucide-react";
import type { VipOrderMode } from "@/hooks/vip/use-vip-cart";

const OPTIONS: Array<{ mode: VipOrderMode; title: string; available: string; Icon: typeof Zap }> = [
  { mode: "NOW", title: "Entrega ahora", available: "Durante el partido de hoy", Icon: Zap },
  { mode: "PREORDER", title: "Preventa", available: "Elige partido y horario", Icon: CalendarClock },
];

/** Entrega inmediata o preventa. Una opción cerrada se ve y explica por qué, pero no se elige. */
export function VipOrderModeSwitch({
  value,
  onChange,
  nowAvailable,
  nowClosedLabel = "Hoy no hay entrega inmediata",
  preorderAvailable,
}: {
  value: VipOrderMode;
  onChange: (mode: VipOrderMode) => void;
  nowAvailable: boolean;
  nowClosedLabel?: string;
  preorderAvailable: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Tipo de entrega" className="grid grid-cols-2 gap-2">
      {OPTIONS.map(({ mode, title, available, Icon }) => {
        const enabled = mode === "NOW" ? nowAvailable : preorderAvailable;
        const selected = value === mode;
        const caption = enabled ? available : mode === "NOW" ? nowClosedLabel : "Preventa cerrada por ahora";
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={!enabled || undefined}
            onClick={() => enabled && onChange(mode)}
            className={`palco-press flex min-h-[4.5rem] flex-col items-start justify-center gap-1 rounded-[var(--radius-palco-md)] border px-3.5 py-3 text-left ${
              selected
                ? "border-palco-900 bg-palco-900 text-palco-on-dark"
                : enabled
                  ? "border-palco-line-strong bg-palco-surface text-palco-ink hover:border-palco-ink-3"
                  : "cursor-not-allowed border-dashed border-palco-line-strong bg-palco-ground text-palco-ink-3"
            }`}
          >
            <span className="flex items-center gap-2 font-palco-display text-[15px] font-bold">
              <Icon aria-hidden className={`size-4 ${selected ? "text-palco-gold" : enabled ? "text-palco-700" : ""}`} />
              {title}
            </span>
            <span className={`text-[13px] leading-snug ${selected ? "text-palco-on-dark-2" : "text-palco-ink-3"}`}>{caption}</span>
          </button>
        );
      })}
    </div>
  );
}

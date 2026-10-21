"use client";

import React from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { VipProgressStep, VipTimelineStep } from "@/lib/vip/preorder";

const STEP_DETAIL: Record<string, string> = {
  paid: "Cobro confirmado y pedido registrado",
  accepted: "Cocina tomó tu pedido",
  preparing: "Se está preparando",
  on_the_way: "Va hacia tu palco",
  delivered: "Entregado en tu palco",
};

const PREORDER_DETAIL: Partial<Record<string, string>> = {
  accepted: "Programado para tu horario de entrega",
};

/** Línea de tiempo vertical del pedido. La etapa actual se marca con un pulso discreto. */
export function VipOrderProgress({ steps, preorder = false }: { steps: Array<VipProgressStep | VipTimelineStep>; preorder?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <ol aria-label="Progreso del pedido" className="flex flex-col">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const time = "time" in step ? step.time : "";
        const detail = (preorder && PREORDER_DETAIL[step.key]) || STEP_DETAIL[step.key] || "";
        return (
          <li
            key={step.key}
            aria-current={step.state === "current" ? "step" : undefined}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[15px] top-8 -bottom-0 w-0.5 rounded-full ${step.state === "done" ? "bg-palco-700" : "bg-palco-line"}`}
              />
            )}
            <span
              className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                step.state === "done"
                  ? "border-palco-700 bg-palco-700 text-white"
                  : step.state === "current"
                    ? "border-palco-700 bg-palco-surface text-palco-700"
                    : "border-palco-line-strong bg-palco-surface text-palco-line-strong"
              }`}
            >
              {step.state === "done" ? (
                <Check aria-hidden className="size-4 stroke-[3]" />
              ) : step.state === "current" ? (
                <motion.span
                  aria-hidden
                  className="size-2.5 rounded-full bg-palco-700"
                  animate={reduceMotion ? undefined : { scale: [1, 1.35, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : (
                <span aria-hidden className="size-1.5 rounded-full bg-current" />
              )}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={`text-[15px] font-semibold ${step.state === "upcoming" ? "text-palco-ink-3" : "text-palco-ink"}`}>
                  {step.title}
                  <span className="sr-only">
                    {step.state === "done" ? ", completado" : step.state === "current" ? ", en curso" : ", pendiente"}
                  </span>
                </p>
                {time && <span className="palco-num shrink-0 text-sm text-palco-ink-3">{time} h</span>}
              </div>
              {step.state !== "upcoming" && detail && <p className="mt-0.5 text-sm text-palco-ink-3">{detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

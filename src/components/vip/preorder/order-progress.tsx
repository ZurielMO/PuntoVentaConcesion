"use client";

import React from "react";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import type { VipProgressStep } from "@/lib/vip/preorder";

/** Stepper horizontal de 5 etapas; la etapa actual pulsa suavemente. */
export function VipOrderProgress({ steps }: { steps: VipProgressStep[] }) {
  const doneCount = steps.filter((step) => step.state === "done").length;
  const currentIndex = steps.findIndex((step) => step.state === "current");
  const reached = currentIndex >= 0 ? currentIndex : Math.max(0, doneCount - 1);
  const progress = steps.length > 1 ? reached / (steps.length - 1) : 0;

  return (
    <ol className="relative grid grid-cols-5" aria-label="Progreso del pedido">
      <span className="absolute left-[10%] right-[10%] top-[15px] h-[3px] rounded-full bg-[#E4EAE6]" aria-hidden />
      <motion.span
        className="absolute left-[10%] top-[15px] h-[3px] origin-left rounded-full bg-[#187B56]"
        style={{ width: "80%" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden
      />
      {steps.map((step) => (
        <li
          key={step.key}
          className="relative flex flex-col items-center gap-2 text-center"
          aria-current={step.state === "current" ? "step" : undefined}
        >
          <span
            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
              step.state === "done"
                ? "border-[#187B56] bg-[#187B56] text-white"
                : step.state === "current"
                  ? "border-[#187B56] bg-white text-[#187B56] shadow-[0_0_0_5px_rgba(24,123,86,0.14)]"
                  : "border-[#DFE5E2] bg-white text-[#B3BFB9]"
            }`}
          >
            {step.state === "done" ? (
              <Check className="h-4 w-4 stroke-[3]" />
            ) : step.state === "current" ? (
              <span className="h-2.5 w-2.5 rounded-full bg-[#187B56] animate-pulse" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
          </span>
          <span
            className={`px-0.5 text-[11px] sm:text-xs font-bold leading-tight ${
              step.state === "upcoming" ? "text-[#8A9992]" : "text-[#111614]"
            }`}
          >
            {step.title}
          </span>
        </li>
      ))}
    </ol>
  );
}

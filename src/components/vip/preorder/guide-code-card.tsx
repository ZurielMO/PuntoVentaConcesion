"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatVipGuide } from "@/lib/vip/types";
import { GUIDE_CODE_FONT } from "../ui/guide-font";

export function VipGuideCodeCard({ guide, className = "" }: { guide: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const code = formatVipGuide(guide);
  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Sin permiso de portapapeles: el código sigue visible para copiarlo a mano.
    }
  };

  return (
    <div className={`w-full rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-4 text-left sm:p-5 ${className}`}>
      <span className="block text-sm font-semibold text-palco-ink-2">Guía de tu pedido</span>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`select-all ${GUIDE_CODE_FONT} text-[1.75rem] font-semibold leading-none tracking-[0.14em] text-palco-ink`}>{code}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Guía copiada" : "Copiar guía"}
          className="palco-press inline-flex min-h-11 items-center gap-1.5 rounded-full border border-palco-line-strong px-4 text-sm font-semibold text-palco-ink hover:border-palco-ink-3"
        >
          {copied ? <Check aria-hidden className="size-4 text-palco-500" /> : <Copy aria-hidden className="size-4" />}
          {copied ? "Copiada" : "Copiar"}
        </button>
      </div>
      <p className="mt-2.5 text-[13px] text-palco-ink-3">
        También te llegó por correo. Queda guardada en este dispositivo en «Mi pedido».
      </p>
      <span className="sr-only" aria-live="polite">
        {copied ? "Guía copiada" : ""}
      </span>
    </div>
  );
}

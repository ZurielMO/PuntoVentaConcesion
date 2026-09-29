"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatVipGuide } from "@/lib/vip/types";

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
    <div className={`w-full rounded-2xl border border-[#DFE5E2] bg-[#F6F8F7] p-4 text-left ${className}`}>
      <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[#9E7844]">Guía de pedido</span>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <span className="font-mono text-[26px] font-bold leading-none tracking-[0.18em] text-[#111614] select-all">
          {code}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Guía copiada" : "Copiar guía"}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#DFE5E2] bg-white px-3 text-sm font-bold text-[#187B56] transition-colors hover:border-[#187B56] cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiada" : "Copiar"}
        </button>
      </div>
      <p className="mt-2 text-xs sm:text-sm text-[#6E7E77]">
        También llegó a tu correo. Escríbela en la página principal para consultar el estatus de tu pedido.
      </p>
    </div>
  );
}

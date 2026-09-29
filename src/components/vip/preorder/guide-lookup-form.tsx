"use client";

import React, { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { normalizeVipGuide } from "@/lib/vip/types";

const formatGuideInput = (raw: string): string => {
  const compact = raw.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 8);
  return compact.length > 4 ? `${compact.slice(0, 4)}-${compact.slice(4)}` : compact;
};

export function guideLookupPath(code: string): string {
  return `/servicio-palcos/guia/?codigo=${encodeURIComponent(code)}`;
}

/** Captura la guía (XXXX-XXXX) y navega a la consulta. `tone="dark"` para fondos oscuros. */
export function VipGuideLookupForm({
  initialValue = "",
  onSubmitCode,
  tone = "light",
  autoFocus = false,
}: {
  initialValue?: string;
  onSubmitCode?: (code: string) => void;
  tone?: "light" | "dark";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [value, setValue] = useState(() => formatGuideInput(initialValue));
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const code = normalizeVipGuide(value);
    if (!code) {
      setError("La guía tiene 8 caracteres, por ejemplo 7KQ4-M2XD.");
      return;
    }
    setError(null);
    if (onSubmitCode) onSubmitCode(code);
    else router.push(guideLookupPath(code));
  };

  const dark = tone === "dark";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="sr-only">
        Guía de pedido
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            className={`pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${dark ? "text-[#9FB3AA]" : "text-[#7E8E87]"}`}
          />
          <input
            id={inputId}
            value={value}
            autoFocus={autoFocus}
            onChange={(event) => {
              setValue(formatGuideInput(event.target.value));
              if (error) setError(null);
            }}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={9}
            placeholder="XXXX-XXXX"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`h-[52px] w-full rounded-xl border pl-11 pr-3 font-mono text-lg font-bold uppercase tracking-[0.18em] transition-all focus:outline-none focus:ring-2 ${
              dark
                ? "border-white/15 bg-white/[0.06] text-white placeholder:text-white/30 focus:border-[#FADC06]/60 focus:ring-[#FADC06]/20"
                : "border-[#DFE5E2] bg-[#F6F8F7] text-[#111614] placeholder:text-[#B3BFB9] focus:border-[#187B56] focus:bg-white focus:ring-[#187B56]/20"
            } ${error ? (dark ? "border-[#FF8A8A]/70" : "border-[#C43D3D]/60") : ""}`}
          />
        </div>
        <button
          type="submit"
          className={`inline-flex h-[52px] shrink-0 items-center gap-1.5 rounded-xl px-4 sm:px-5 font-headline-md text-base font-extrabold transition-all active:scale-[0.97] cursor-pointer ${
            dark
              ? "bg-[#FADC06] text-black hover:brightness-95"
              : "bg-[#102D24] text-white hover:bg-[#183C32]"
          }`}
        >
          <span className="hidden sm:inline">Consultar</span>
          <ArrowRight className="h-4 w-4" />
          <span className="sr-only sm:hidden">Consultar</span>
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className={`text-sm font-medium ${dark ? "text-[#FFB4B4]" : "text-[#A83232]"}`}>
          {error}
        </p>
      )}
    </form>
  );
}

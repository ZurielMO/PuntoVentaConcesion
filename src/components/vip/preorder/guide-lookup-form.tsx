"use client";

import React, { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { normalizeVipGuide } from "@/lib/vip/types";
import { GUIDE_CODE_FONT } from "../ui/guide-font";

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
  label = "Guía de pedido",
}: {
  initialValue?: string;
  onSubmitCode?: (code: string) => void;
  tone?: "light" | "dark";
  autoFocus?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const [value, setValue] = useState(() => formatGuideInput(initialValue));
  const [error, setError] = useState<string | null>(null);
  const dark = tone === "dark";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const code = normalizeVipGuide(value);
    if (!code) {
      setError(value.trim() ? "La guía tiene 8 caracteres, por ejemplo 7KQ4-M2XD." : "Escribe la guía de tu correo de confirmación.");
      return;
    }
    setError(null);
    if (onSubmitCode) onSubmitCode(code);
    else router.push(guideLookupPath(code));
  };

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className={`text-sm font-semibold ${dark ? "text-palco-on-dark-2" : "text-palco-ink-2"}`}>
        {label}
      </label>
      <div className="flex w-full gap-2">
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
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : hintId}
          className={`h-12 min-w-0 flex-1 rounded-full border px-5 ${GUIDE_CODE_FONT} text-[17px] font-semibold uppercase tracking-[0.16em] outline-none transition-[border-color,box-shadow] ${
            dark
              ? "border-white/25 bg-white/5 text-palco-on-dark placeholder:text-white/35 focus:border-palco-gold focus:shadow-[0_0_0_3px_rgb(230_198_135_/_0.25)]"
              : "border-palco-field bg-palco-surface text-palco-ink placeholder:text-palco-ink-3/60 focus:border-palco-700 focus:shadow-[0_0_0_3px_var(--color-palco-100)]"
          } ${error ? (dark ? "border-[#ffb4ab]" : "border-palco-danger") : ""}`}
        />
        <button
          type="submit"
          className={`palco-press inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 font-palco-display text-[15px] font-bold ${
            dark ? "bg-palco-gold text-palco-900 hover:bg-palco-gold-strong" : "bg-palco-700 text-white hover:bg-palco-600"
          }`}
        >
          Consultar
          <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className={`text-sm font-medium ${dark ? "text-[#ffb4ab]" : "text-palco-danger"}`}>
          {error}
        </p>
      ) : (
        <p id={hintId} className={`text-[13px] ${dark ? "text-palco-on-dark-2" : "text-palco-ink-3"}`}>
          Está en tu correo de confirmación, por ejemplo 7KQ4-M2XD.
        </p>
      )}
    </form>
  );
}

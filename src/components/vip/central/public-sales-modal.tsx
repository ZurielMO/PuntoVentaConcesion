"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";

interface VipPublicSalesModalProps {
  acceptingOrders: boolean;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const VipPublicSalesModal: React.FC<VipPublicSalesModalProps> = ({
  acceptingOrders,
  onConfirm,
  onCancel,
  title,
  description,
}) => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-[#102D24]/70 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8E5] p-6 shadow-sm flex flex-col gap-4"
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#187B56]/10 text-[#187B56] flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-headline-md text-2xl font-extrabold text-[#171A19] leading-tight">
            {title ?? (acceptingOrders ? "Activar venta al público" : "Cerrar venta al público")}
          </h2>
          <p className="text-lg text-[#66706B] mt-2 leading-snug">
            {description ??
              (acceptingOrders
                ? "Con la contraseña de zona, los invitados podrán ordenar de nuevo."
                : "Con la contraseña de zona, los invitados dejan de poder comprar hasta que la vuelvas a abrir.")}
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-base font-bold text-[#4E5C56] flex items-center gap-1.5">
            <Lock className="w-5 h-5" />
            Contraseña de zona
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-16 px-4 rounded-xl border border-[#DFE5E2] bg-[#F6F8F7] text-lg font-medium text-[#111614] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#187B56]/25 focus:border-[#187B56]"
            autoComplete="current-password"
            placeholder="Contraseña de Central"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-14 px-4 rounded-xl border border-[#E2E8E5] bg-white text-[#171A19] font-bold text-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className="flex-1 h-14 px-4 rounded-xl bg-[#187B56] text-white font-bold text-lg disabled:opacity-60"
          >
            {submitting ? "Validando…" : "Confirmar"}
          </button>
        </div>
      </form>
    </div>
  );
};

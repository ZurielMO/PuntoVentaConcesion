"use client";

import React from "react";
import { formatVipMxn } from "@/lib/vip/money";

interface OrderBreakdownCardProps {
  subtotal: number;
  cargoServicio: number;
  total: number;
}

export const VipOrderBreakdownCard: React.FC<OrderBreakdownCardProps> = ({
  subtotal,
  cargoServicio,
  total,
}) => {
  return (
    <section className="bg-white rounded-2xl sm:rounded-[24px] p-5 sm:p-6 border border-[#E5EBE8] shadow-[0_4px_20px_rgba(6,46,32,0.04)] flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#EEF2F0] pb-3">
        <h3 className="font-[family-name:var(--font-montserrat)] text-base sm:text-lg font-bold text-[#111827] tracking-tight">
          Resumen de Cuenta
        </h3>
      </div>

      <div className="flex flex-col gap-2.5 text-sm sm:text-base">
        <div className="flex justify-between items-center">
          <span className="font-sans text-[#4B5563]">Productos</span>
          <span className="font-[family-name:var(--font-montserrat)] font-bold text-[#111827]">{formatVipMxn(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-sans text-[#4B5563]">Cargo por servicio de palco</span>
          <span className="font-[family-name:var(--font-montserrat)] font-bold text-[#111827]">{formatVipMxn(cargoServicio)}</span>
        </div>
      </div>

      <div className="flex justify-between items-baseline border-t border-[#EEF2F0] pt-4 mt-1">
        <div>
          <span className="font-[family-name:var(--font-montserrat)] text-base sm:text-lg font-bold text-[#111827] block tracking-tight">
            Total a Pagar
          </span>
          <span className="text-xs text-[#6B7280] font-medium">
            IVA incluido
          </span>
        </div>
        <span className="font-[family-name:var(--font-montserrat)] text-2xl sm:text-3xl font-black text-[#0D4A34] tracking-tight">
          {formatVipMxn(total)}
        </span>
      </div>
    </section>
  );
};

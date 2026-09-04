"use client";

import React from "react";
import { formatVipMxn } from "@/lib/vip/money";

interface OrderBreakdownCardProps {
  subtotal: number;
  total: number;
}

export const VipOrderBreakdownCard: React.FC<OrderBreakdownCardProps> = ({
  subtotal,
  total,
}) => {
  return (
    <section className="bg-white rounded-[22px] p-5 sm:p-6 border border-[#DFE5E2] shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#E9EFEB] pb-3">
        <h3 className="font-headline-md text-base sm:text-lg font-extrabold text-[#111614] tracking-tight">
          Resumen de Cuenta
        </h3>
      </div>

      <div className="flex flex-col gap-3 text-base">
        <div className="flex justify-between items-center">
          <span className="font-body-md text-[#4E5C56]">Productos</span>
          <span className="font-headline-md font-bold text-[#111614]">{formatVipMxn(subtotal)}</span>
        </div>
      </div>

      <div className="flex justify-between items-baseline border-t border-[#E9EFEB] pt-4 mt-1">
        <div>
          <span className="font-headline-md text-lg sm:text-xl font-extrabold text-[#111614] block tracking-tight">
            Total a Pagar
          </span>
          <span className="text-xs sm:text-sm text-[#7E8E87] font-medium">
            IVA incluido
          </span>
        </div>
        <span className="font-headline-md text-2xl sm:text-3xl font-black text-[#187B56] tracking-tight">
          {formatVipMxn(total)}
        </span>
      </div>
    </section>
  );
};

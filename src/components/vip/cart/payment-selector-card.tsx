"use client";

import React from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { VipMascot } from "@/components/vip/ui/mascot";

export const VipPaymentSelectorCard: React.FC = () => {
  return (
    <section className="bg-white rounded-[20px] p-5 border border-[#DFE5E2] shadow-xs flex items-center justify-between gap-3 overflow-hidden">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-[#187B56]/10 text-[#187B56] flex items-center justify-center shrink-0 border border-[#187B56]/20">
          <CreditCard className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-label-sm text-xs text-[#9E7844] uppercase tracking-wider font-extrabold">
              Pago Seguro
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#187B56] font-bold bg-[#187B56]/10 px-1.5 py-0.2 rounded-md">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>SSL 256-bit</span>
            </span>
          </div>
          <h4 className="font-headline-md text-base sm:text-lg font-extrabold text-[#111614] truncate tracking-tight">
            Pago con tarjeta
          </h4>
          <span className="font-body-md text-sm text-[#4E5C56]">
            Acepta tarjetas de crédito y débito bancarias.
          </span>
        </div>
      </div>
      <VipMascot name="pagos" size="card" decorative className="shrink-0 -mr-1" />
    </section>
  );
};

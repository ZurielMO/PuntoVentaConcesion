"use client";

import React from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { VipStripePaymentIcons } from "@/components/vip/cart/stripe-payment-icons";

export const VipPaymentSelectorCard: React.FC = () => {
  return (
    <section className="bg-white rounded-2xl sm:rounded-[24px] p-5 sm:p-6 border border-[#E5EBE8] shadow-[0_4px_20px_rgba(6,46,32,0.04)] flex flex-col gap-4 overflow-hidden relative">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#0D4A34]/8 text-[#0D4A34] flex items-center justify-center shrink-0 border border-[#0D4A34]/15 shadow-xs">
            <CreditCard className="w-6 h-6 stroke-[2.2] text-[#0D4A34]" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-[#A67C2E] uppercase tracking-wider font-bold">
                Transacción Cifrada
              </span>
            </div>
            <h4 className="font-[family-name:var(--font-montserrat)] text-base sm:text-lg font-bold text-[#111827] truncate tracking-tight mt-0.5">
              Pago con tarjeta
            </h4>
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[#0D4A34]/8 border border-[#0D4A34]/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-[#C5A059]" />
        </div>
      </div>
      <VipStripePaymentIcons />
    </section>
  );
};

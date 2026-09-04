"use client";

import React from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { VipMascot } from "@/components/vip/ui/mascot";
import { VipStripePaymentIcons } from "@/components/vip/cart/stripe-payment-icons";

export const VipPaymentSelectorCard: React.FC = () => {
  return (
    <section className="bg-white rounded-[22px] p-5 sm:p-6 border border-[#DFE5E2] shadow-xs flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-[#187B56]/10 text-[#187B56] flex items-center justify-center shrink-0 border border-[#187B56]/20">
            <CreditCard className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-xs sm:text-sm text-[#9E7844] uppercase tracking-wider font-black">
                Pago Seguro
              </span>
              
            </div>
            <h4 className="font-headline-md text-lg sm:text-xl font-extrabold text-[#111614] truncate tracking-tight mt-0.5">
              Pago con tarjeta
            </h4>
            
          </div>
        </div>
        <VipMascot name="pagos" size="card" decorative className="shrink-0 -mr-1" />
      </div>
      <VipStripePaymentIcons />
    </section>
  );
};

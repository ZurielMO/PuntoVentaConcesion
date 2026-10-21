"use client";

import React from "react";
import { Lock } from "lucide-react";
import { VipStripePaymentIcons } from "@/components/vip/cart/stripe-payment-icons";

/** Cómo se paga: la página segura de Stripe. Los métodos que aparecen ahí dependen de la cuenta y del dispositivo. */
export const VipPaymentSelectorCard: React.FC = () => (
  <div className="flex flex-col gap-3">
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-palco-50 text-palco-700">
        <Lock aria-hidden className="size-4" />
      </span>
      <p className="text-sm leading-snug text-palco-ink-2">
        <span className="block font-semibold text-palco-ink">Pago con tarjeta en Stripe</span>
        Te llevamos a la página segura de Stripe para pagar. Aquí no se capturan ni se guardan datos de tu tarjeta.
      </p>
    </div>
    <VipStripePaymentIcons />
  </div>
);

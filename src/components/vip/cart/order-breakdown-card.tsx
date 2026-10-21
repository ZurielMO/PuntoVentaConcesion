"use client";

import React from "react";
import { VIP_SERVICE_FEE_PERCENT, formatVipPrice } from "@/lib/vip/money";

interface OrderBreakdownProps {
  subtotal: number;
  cargoServicio: number;
  total: number;
  itemCount?: number;
}

/** Desglose antes de pagar. Es el mismo cálculo de siempre; el cobro final lo valida el backend. */
export const VipOrderBreakdownCard: React.FC<OrderBreakdownProps> = ({ subtotal, cargoServicio, total, itemCount }) => (
  <dl className="palco-num flex flex-col gap-2.5 text-[15px]">
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-palco-ink-2">
        Productos{itemCount ? <span className="text-palco-ink-3"> ({itemCount})</span> : null}
      </dt>
      <dd className="text-palco-ink">{formatVipPrice(subtotal, { cents: "always" })}</dd>
    </div>
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-palco-ink-2">Servicio a palco ({VIP_SERVICE_FEE_PERCENT}%)</dt>
      <dd className="text-palco-ink">{formatVipPrice(cargoServicio, { cents: "always" })}</dd>
    </div>
    <div className="mt-1.5 flex items-baseline justify-between gap-4 border-t border-palco-line pt-3.5">
      <dt className="font-palco-display text-base font-bold text-palco-ink">
        Total <span className="font-palco-sans text-xs font-normal text-palco-ink-3">MXN, IVA incluido</span>
      </dt>
      <dd className="font-palco-display text-[1.375rem] font-extrabold tracking-[-0.01em] text-palco-ink">
        {formatVipPrice(total, { cents: "always" })}
      </dd>
    </div>
  </dl>
);

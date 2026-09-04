"use client";

import React from "react";
import type { VipCartItem } from "@/lib/vip/types";
import { formatVipMxn } from "@/lib/vip/money";
import { VipMedia } from "../ui/media";

interface OrderItemsSummaryProps {
  items: VipCartItem[];
}

export const VipOrderItemsSummary: React.FC<OrderItemsSummaryProps> = ({ items }) => {
  return (
    <section className="w-full max-w-sm mx-auto flex flex-col gap-2.5">
      <h3 className="font-headline-md text-sm font-extrabold text-[#111614] tracking-tight">
        Detalle de Productos ({items.length})
      </h3>

      <div className="bg-white rounded-[20px] border border-[#DFE5E2] overflow-hidden divide-y divide-[#E9EFEB] shadow-xs">
        {items.map((item, idx) => (
          <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#ECEFEA] shrink-0 border border-[#DFE5E2]">
                <VipMedia
                  src={item.producto.imagen}
                  alt={item.producto.nombre}
                  categoria={item.producto.categoria}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="font-headline-md text-xs sm:text-sm font-extrabold text-[#111614] truncate tracking-tight">
                  {item.cantidad}x {item.producto.nombre}
                </p>
                {item.instrucciones && (
                  <p className="font-body-md text-[10px] text-[#7E8E87] truncate italic">
                    &ldquo;{item.instrucciones}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <span className="font-headline-md text-xs sm:text-sm font-extrabold text-[#187B56] shrink-0">
              {formatVipMxn(item.subtotal)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

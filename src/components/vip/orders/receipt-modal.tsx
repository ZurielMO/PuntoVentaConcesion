"use client";

import React from "react";
import { MapPin, Receipt, ShieldCheck } from "lucide-react";
import type { VipOrder } from "@/lib/vip/types";
import { formatVipMxn } from "@/lib/vip/money";
import { formatOrderConcessions } from "@/lib/vip/types";
import { VipModal } from "../ui/modal";
import { VipButton } from "../ui/button";
import { vipToast } from "@/hooks/vip/use-vip-toast";

interface ReceiptModalProps {
  order: VipOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VipReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!order) return null;

  const handleDownload = () => {
    vipToast.success("Comprobante digital listo", {
      description: `Ticket de orden ${order.numeroPedido} consultado.`,
    });
  };

  const deliveryZone = order.ubicacion?.zona || "Poniente";
  const deliveryPalco = order.ubicacion?.palco || "Palco";

  return (
    <VipModal isOpen={isOpen} onClose={onClose} title={`Recibo · ${order.numeroPedido}`}>
      <div className="flex flex-col gap-4">
        {/* Receipt Header */}
        <div className="bg-[#F6F8F7] p-5 rounded-2xl border border-[#DFE5E2] flex flex-col items-center text-center gap-1.5">
          <div className="w-11 h-11 rounded-2xl bg-[#187B56]/10 text-[#187B56] flex items-center justify-center mb-1">
            <Receipt className="w-5 h-5" />
          </div>
          <h4 className="font-headline-md text-base font-extrabold text-[#111614] tracking-tight">
            Club León · Servicio a palcos
          </h4>
          <p className="font-body-md text-xs text-[#7E8E87]">
            {formatOrderConcessions(order)} · {order.createdAt}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#187B56] font-bold mt-1 bg-white px-2.5 py-0.5 rounded-full border border-[#187B56]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pago verificado</span>
          </div>
        </div>

        {/* Location Info */}
        <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-white border border-[#DFE5E2] text-xs text-[#111614]">
          {order.nombreCliente && (
            <span>
              Cliente: <strong>{order.nombreCliente}</strong>
            </span>
          )}
          <span className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[#187B56] shrink-0" />
            Entrega: <strong>Zona {deliveryZone} · Palco {deliveryPalco}</strong>
          </span>
        </div>

        {/* Items table */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[#E9EFEB]">
          <span className="font-label-sm text-[10px] text-[#9E7844] font-extrabold uppercase tracking-wider">
            Detalle del Consumo
          </span>
          <div className="divide-y divide-[#E9EFEB]">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-headline-md font-bold text-[#111614]">
                    {item.cantidad}x {item.producto.nombre}
                  </p>
                  {item.instrucciones && (
                    <p className="text-[10px] text-[#7E8E87] italic">
                      &ldquo;{item.instrucciones}&rdquo;
                    </p>
                  )}
                </div>
                <span className="font-headline-md font-bold text-[#111614]">
                  {formatVipMxn(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="bg-[#F6F8F7] p-4 rounded-2xl border border-[#DFE5E2] flex flex-col gap-2 text-xs">
          <div className="flex justify-between text-[#4E5C56]">
            <span>Productos</span>
            <span className="font-semibold text-[#111614]">{formatVipMxn(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#4E5C56]">
            <span>Cargo por servicio</span>
            <span className="font-semibold text-[#111614]">{formatVipMxn(order.cargoServicio)}</span>
          </div>
          <div className="flex justify-between text-sm font-headline-md font-extrabold text-[#187B56] pt-2.5 border-t border-[#DFE5E2]">
            <span>Total Pagado</span>
            <span>{formatVipMxn(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <VipButton onClick={handleDownload} variant="primary" fullWidth size="md">
            Listo
          </VipButton>
        </div>
      </div>
    </VipModal>
  );
};

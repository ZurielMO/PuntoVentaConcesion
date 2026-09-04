"use client";

import React from "react";
import { Clock, MapPin, ArrowRight, FileText, Phone } from "lucide-react";
import type { VipOrder, VipOrderStatus } from "@/lib/vip/types";
import { formatVipAmount } from "@/lib/vip/money";
import { concessionLabelForItem, formatOrderConcessions, isVipHistoryStatus, isVipNewStatus, isVipOnTheWayStatus, uniqueOrderConcessionNames } from "@/lib/vip/types";

interface KdsTicketCardProps {
  order: VipOrder;
  onAdvance: (orderId: string, nextStatus: VipOrderStatus) => void;
  onSelectOrder: (order: VipOrder) => void;
}

export const KdsTicketCard: React.FC<KdsTicketCardProps> = ({
  order,
  onAdvance,
  onSelectOrder,
}) => {
  const isNew = isVipNewStatus(order.estado);
  const isOnTheWay = isVipOnTheWayStatus(order.estado);
  const isHistory = isVipHistoryStatus(order.estado);
  const isCancelled = order.estado === "CANCELADO" || order.estado === "CANCELLED" || order.estado === "REFUNDED";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectOrder(order)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectOrder(order);
        }
      }}
      className={`
        bg-white rounded-[1.35rem] p-5 shadow-sm border transition-all cursor-pointer flex flex-col gap-4 group
        hover:shadow-md hover:border-[#187B56]/50 active:scale-[0.99]
        ${
          isNew
            ? "border-t-[5px] border-t-[#D99721] border-[#E2E8E5]"
            : isOnTheWay
            ? "border-t-[5px] border-t-[#3978A8] border-[#E2E8E5]"
            : isHistory
            ? "border-l-[5px] border-l-[#187B56] border-[#E2E8E5]"
            : "border-[#E2E8E5] opacity-95"
        }
      `}
    >
      <div className="flex justify-between items-start border-b border-[#F0F2F1] pb-3.5 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-headline-md text-3xl font-extrabold text-[#187B56] leading-none tracking-tight">
              {order.numeroPedido}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectOrder(order);
              }}
              className="text-[#ACB5C9] hover:text-[#187B56] p-1 rounded transition-colors min-h-11 min-w-11 flex items-center justify-center"
              title="Ver comanda completa"
            >
              <FileText className="w-6 h-6" />
            </button>
          </div>
          <p className="font-label-sm text-base text-[#66706B] flex items-center gap-2 mt-1.5 font-semibold">
            <Clock className="w-5 h-5 text-[#D99721] shrink-0" />
            <span>{order.createdAt || "—"}</span>
          </p>
        </div>

        <div className="text-right shrink-0 max-w-[48%]">
          <span className="font-headline-md text-2xl font-extrabold text-[#171A19] flex items-center justify-end gap-1.5 leading-none">
            <MapPin className="w-6 h-6 text-[#187B56] shrink-0" />
            Palco {order.ubicacion.palco}
          </span>
          <span className="font-label-sm text-base text-[#66706B] block mt-1.5 leading-snug">
            {order.ubicacion.zona}
            {order.ubicacion.nivel ? ` · ${order.ubicacion.nivel}` : ""}
          </span>
          <span className="font-label-sm text-base text-[#66706B] block mt-1 leading-snug">
            {formatOrderConcessions(order)}
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 py-0.5 text-xl text-[#171A19] font-body-md leading-snug">
        {order.items.map((item, idx) => (
          <li key={item.id || idx} className="flex flex-col">
            <div className="flex justify-between items-start gap-3">
              <span className="font-semibold">
                <strong className="text-[#187B56] font-extrabold mr-2">{item.cantidad}x</strong>
                {item.producto.nombre}
              </span>
              <span className="font-bold text-base text-[#66706B] shrink-0 pt-0.5">
                ${formatVipAmount(item.subtotal)}
              </span>
            </div>
            {uniqueOrderConcessionNames(order).length > 1 && (
              <span className="text-base text-[#187B56] pl-8 font-semibold leading-snug">
                {concessionLabelForItem(order, item)}
              </span>
            )}
            {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
              <span className="text-base text-[#66706B] pl-8 italic leading-snug">
                - {item.opcionesSeleccionadas.map((o) => o.opcionNombre).join(", ")}
              </span>
            )}
            {item.instrucciones && (
              <span className="text-base text-[#9E7844] pl-8 font-semibold leading-snug">
                * Nota: {item.instrucciones}
              </span>
            )}
          </li>
        ))}
      </ul>

      {(order.nombreCliente || order.telefonoCliente) && (
        <div className="flex items-center gap-2 text-base text-[#171A19] font-semibold">
          <Phone className="w-5 h-5 text-[#187B56] shrink-0" />
          {[order.nombreCliente, order.telefonoCliente].filter(Boolean).join(" · ")}
        </div>
      )}

      {order.ubicacion.notas && (
        <div className="bg-[#F5F7F6] p-3 rounded-xl text-base text-[#66706B] border border-[#E2E8E5] leading-snug">
          <span className="font-bold text-[#171A19]">Nota Palco: </span>
          {order.ubicacion.notas}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-[#F0F2F1] pt-3.5 mt-auto gap-3">
        <div className="flex flex-col">
          <span className="text-sm uppercase font-label-sm text-[#66706B] font-bold tracking-wide">Total</span>
          <span className="font-headline-md text-xl font-extrabold text-[#187B56] leading-tight">
            ${formatVipAmount(order.total)}
          </span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {isNew && (
            <button
              type="button"
              onClick={() => onAdvance(order.id, "ACCEPTED")}
              className="min-h-14 px-6 py-3 bg-[#187B56] hover:bg-[#136244] text-white font-headline-md font-bold text-lg rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>ACEPTAR</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          )}

          {isOnTheWay && (
            <button
              type="button"
              onClick={() => onAdvance(order.id, "DELIVERED")}
              className="min-h-14 px-6 py-3 bg-[#3978A8] hover:bg-[#2c5f85] text-white font-headline-md font-bold text-lg rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>ENTREGAR</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          )}

          {isHistory && (
            <span
              className={`px-4 py-2.5 font-headline-md font-bold text-base rounded-2xl ${
                isCancelled ? "bg-[#C43D3D]/10 text-[#C43D3D]" : "bg-[#187B56]/10 text-[#187B56]"
              }`}
            >
              {isCancelled ? "Cancelado" : "Entregado"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

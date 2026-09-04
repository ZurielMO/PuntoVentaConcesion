"use client";

import React, { useState } from "react";
import { MapPin, ArrowRight } from "lucide-react";
import type { VipOrder } from "@/lib/vip/types";
import { formatVipAmount } from "@/lib/vip/money";
import { concessionLabelForItem, formatOrderConcessions, shortVipOrderNumber, uniqueOrderConcessionNames } from "@/lib/vip/types";

interface IncomingOrderAlertProps {
  order: VipOrder;
  queueRemaining: number;
  accepting: boolean;
  onAccept: () => void;
  onOpenDetails: () => void;
}

export const IncomingOrderAlert: React.FC<IncomingOrderAlertProps> = ({
  order,
  queueRemaining,
  accepting,
  onAccept,
  onOpenDetails,
}) => {
  const [flashGold, setFlashGold] = useState(true);

  React.useEffect(() => {
    const id = window.setInterval(() => setFlashGold((v) => !v), 450);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors duration-100"
      style={{ backgroundColor: flashGold ? "#D99721" : "#7A1F1F" }}
      role="alertdialog"
      aria-live="assertive"
      aria-label="Pedido nuevo"
    >
      <div className="flex items-center justify-between text-white px-1 pb-1">
        <p
          className="font-black uppercase tracking-[0.12em] drop-shadow leading-none"
          style={{ fontSize: "clamp(1.15rem, 5.5vw, 2.4rem)" }}
        >
          Pedido nuevo
        </p>
        {queueRemaining > 0 && (
          <span
            className="min-h-10 px-3 rounded-full bg-black/40 text-white font-black flex items-center"
            style={{ fontSize: "clamp(0.8rem, 3.2vw, 1.15rem)" }}
          >
            {queueRemaining} más
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[1.75rem] px-4 py-3 sm:p-5 flex flex-col gap-2 shadow-2xl overflow-hidden">
        <p
          className="font-black text-[#187B56] leading-[0.9] tracking-tight text-center break-all"
          style={{ fontSize: "clamp(2.6rem, 16vw, 7rem)" }}
          title={order.numeroPedido}
        >
          {shortVipOrderNumber(order.numeroPedido)}
        </p>

        <div className="text-center leading-none">
          <p
            className="font-black text-[#171A19] flex items-center justify-center gap-2"
            style={{ fontSize: "clamp(1.85rem, 11vw, 4.5rem)" }}
          >
            <MapPin className="shrink-0 text-[#187B56]" style={{ width: "0.7em", height: "0.7em" }} />
            Palco {order.ubicacion.palco}
          </p>
          {order.ubicacion.nivel && (
            <p
              className="font-bold text-[#66706B] mt-1"
              style={{ fontSize: "clamp(0.85rem, 3.4vw, 1.25rem)" }}
            >
              {order.ubicacion.nivel}
              {order.ubicacion.zona ? ` · ${order.ubicacion.zona}` : ""}
            </p>
          )}
        </div>

        {formatOrderConcessions(order) && (
          <p
            className="text-center font-extrabold text-[#187B56] leading-tight"
            style={{ fontSize: "clamp(0.95rem, 4vw, 1.5rem)" }}
          >
            {formatOrderConcessions(order)}
          </p>
        )}

        <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 text-[#171A19] py-1">
          {order.items.map((item, idx) => (
            <li
              key={item.id || idx}
              className="flex flex-col gap-0.5 font-bold leading-snug"
              style={{ fontSize: "clamp(1.05rem, 4.6vw, 1.85rem)" }}
            >
              <span className="flex justify-between gap-3">
                <span>
                  <strong className="text-[#187B56] mr-1.5">{item.cantidad}x</strong>
                  {item.producto.nombre}
                </span>
              </span>
              {uniqueOrderConcessionNames(order).length > 1 && (
                <span
                  className="pl-8 font-semibold text-[#187B56]"
                  style={{ fontSize: "0.55em" }}
                >
                  {concessionLabelForItem(order, item)}
                </span>
              )}
            </li>
          ))}
        </ul>

        {order.ubicacion.notas && (
          <p
            className="bg-[#F5F7F6] rounded-xl p-2.5 text-[#66706B] font-semibold"
            style={{ fontSize: "clamp(0.85rem, 3.4vw, 1.2rem)" }}
          >
            <strong className="text-[#171A19]">Nota: </strong>
            {order.ubicacion.notas}
          </p>
        )}

        <div className="flex justify-between items-end gap-2">
          <div>
            <p className="uppercase font-black text-[#66706B] tracking-wider" style={{ fontSize: "clamp(0.65rem, 2.6vw, 0.9rem)" }}>
              Total
            </p>
            <p className="font-black text-[#187B56] leading-none" style={{ fontSize: "clamp(1.6rem, 7vw, 2.8rem)" }}>
              ${formatVipAmount(order.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDetails}
            className="font-bold text-[#66706B] underline underline-offset-4 min-h-11 px-2"
            style={{ fontSize: "clamp(0.85rem, 3.2vw, 1.1rem)" }}
          >
            Ver detalle
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={accepting}
        onClick={onAccept}
        className="mt-2 w-full min-h-[18vh] rounded-[1.6rem] bg-[#187B56] text-white font-black tracking-[0.14em] flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] disabled:opacity-60"
        style={{ fontSize: "clamp(1.5rem, 8vw, 3rem)" }}
      >
        {accepting ? "ACEPTANDO…" : "ACEPTAR"}
        {!accepting && <ArrowRight className="shrink-0" style={{ width: "0.7em", height: "0.7em" }} />}
      </button>
    </div>
  );
};

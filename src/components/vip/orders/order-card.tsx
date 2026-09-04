"use client";

import React from "react";
import Link from "next/link";
import { RotateCw, Receipt as ReceiptIcon, ArrowRight } from "lucide-react";
import type { VipOrder } from "@/lib/vip/types";
import { formatVipMxn } from "@/lib/vip/money";
import { formatOrderConcessions } from "@/lib/vip/types";
import { vipSeguimientoPath } from "@/lib/vip/vip-routes";
import { VipBadge } from "../ui/badge";
import { VipMedia } from "../ui/media";
import { motion } from "motion/react";

interface OrderCardProps {
  order: VipOrder;
  onViewReceipt: (order: VipOrder) => void;
  onReorder: (order: VipOrder) => void;
}

export const VipOrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewReceipt,
  onReorder,
}) => {
  const isDelivered = order.estado === "ENTREGADO";
  const isCancelled = order.estado === "CANCELADO";
  const isActive = !isDelivered && !isCancelled;

  const totalItems = order.items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        bg-white p-5 rounded-[20px] border shadow-xs flex flex-col gap-4 transition-all
        ${
          isActive
            ? "border-[#187B56] shadow-[0_8px_24px_rgba(24,123,86,0.12)] ring-1 ring-[#187B56]/20"
            : "border-[#DFE5E2]"
        }
      `}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3.5 items-center min-w-0">
          <div className="w-13 h-13 rounded-2xl bg-[#ECEFEA] overflow-hidden shrink-0 border border-[#DFE5E2] shadow-2xs">
            <VipMedia
              src={order.restauranteLogo || order.items[0]?.producto.imagen}
              alt={formatOrderConcessions(order)}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <h4 className="font-headline-md text-sm sm:text-base font-extrabold text-[#111614] tracking-tight leading-tight">
              {formatOrderConcessions(order)}
            </h4>
            <span className="font-body-md text-xs text-[#7E8E87] mt-0.5">
              {order.createdAt} · {order.numeroPedido}
            </span>

            <div className="mt-1.5 flex items-center gap-2">
              {isDelivered ? (
                <VipBadge variant="success" size="sm" dot>
                  Entregado en palco
                </VipBadge>
              ) : isCancelled ? (
                <VipBadge variant="closed" size="sm">
                  Cancelado
                </VipBadge>
              ) : (
                <VipBadge variant="available" size="sm" dot>
                  {order.estado === "RECIBIDO"
                    ? "Recibido / Pagado"
                    : order.estado === "PREPARANDO"
                    ? "En preparación"
                    : "En camino al palco"}
                </VipBadge>
              )}

              {order.ubicacion && (
                <span className="text-[11px] text-[#4E5C56] font-semibold bg-[#F6F8F7] px-2 py-0.5 rounded-md border border-[#DFE5E2]">
                  Palco {order.ubicacion.palco} ({order.ubicacion.zona})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span
            className={`font-headline-md text-base sm:text-lg font-extrabold ${
              isCancelled ? "text-[#7E8E87] line-through" : "text-[#187B56]"
            }`}
          >
            {formatVipMxn(order.total)}
          </span>
          <span className="font-label-sm text-xs text-[#7E8E87] font-semibold">
            {totalItems} {totalItems === 1 ? "producto" : "productos"}
          </span>
        </div>
      </div>

      {/* Active tracker link if order is in progress */}
      {isActive && (
        <Link
          href={vipSeguimientoPath(order.id)}
          className="bg-gradient-to-r from-[#102D24] to-[#187B56] text-white p-3.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all shadow-xs hover:brightness-105 active:scale-[0.99] border border-[#187B56]/30"
        >
          <span className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF85] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF85]" />
            </span>
            <span>Seguir pedido en tiempo real</span>
          </span>
          <ArrowRight className="w-4 h-4 text-white" />
        </Link>
      )}

      {/* Bottom actions */}
      <div className="pt-3 border-t border-[#E9EFEB] flex justify-between items-center gap-2">
        <button
          type="button"
          onClick={() => onViewReceipt(order)}
          className="font-label-md text-xs sm:text-sm font-bold text-[#4E5C56] hover:text-[#187B56] flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-[#ECEFEA] transition-all"
        >
          <ReceiptIcon className="w-4 h-4 text-[#187B56]" />
          <span>Ver Recibo</span>
        </button>

        {!isCancelled ? (
          <button
            type="button"
            onClick={() => onReorder(order)}
            className="h-10 px-4 rounded-xl bg-[#187B56] text-white font-headline-md text-xs font-bold flex items-center gap-1.5 hover:bg-[#136244] active:scale-95 transition-all cursor-pointer shadow-2xs border border-[#00FF85]/20"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Volver a pedir</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onReorder(order)}
            className="h-10 px-4 rounded-xl bg-white text-[#111614] hover:text-[#187B56] border border-[#DFE5E2] hover:border-[#187B56] font-headline-md text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        )}
      </div>
    </motion.article>
  );
};

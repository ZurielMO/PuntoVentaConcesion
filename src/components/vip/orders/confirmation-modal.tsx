"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { VipModal } from "@/components/vip/ui/modal";
import { VipButton } from "@/components/vip/ui/button";
import type { VipOrder } from "@/lib/vip/types";
import { formatVipMxn } from "@/lib/vip/money";
import { formatOrderConcessions, uniqueOrderConcessionNames } from "@/lib/vip/types";
import { CheckCircle2, Clock, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface ConfirmationModalProps {
  order: VipOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VipConfirmationModal: React.FC<ConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  if (!order) return null;

  const handleGoHome = () => {
    onClose();
    router.push("/servicio-palcos/inicio");
  };

  return (
    <VipModal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex flex-col items-center text-center gap-5 py-2">
        {/* Animated Green Check Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#102D24] to-[#187B56] border-4 border-[#00FF85]/40 flex items-center justify-center text-[#00FF85] shadow-[0_10px_30px_rgba(0,255,133,0.3)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#9E7844] text-white flex items-center justify-center border-2 border-white shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </motion.div>
        </motion.div>

        {/* Headings */}
        <div className="space-y-1">
          <span className="text-[10px] font-label-sm text-[#9E7844] font-bold uppercase tracking-wider">
            Experiencia de entrega en palco
          </span>
          <h2 className="font-headline-md text-xl sm:text-2xl font-extrabold text-[#171A19]">
            ¡Pedido Confirmado!
          </h2>
          <p className="font-body-md text-xs text-[#66706B] max-w-xs mx-auto">
            Recibimos tu orden.{" "}
            {uniqueOrderConcessionNames(order).length > 1 ? (
              <>
                Las cocinas de{" "}
                <strong className="text-[#171A19] font-bold">{formatOrderConcessions(order)}</strong> te
                la llevan a tu palco.
              </>
            ) : (
              <>
                La cocina de{" "}
                <strong className="text-[#171A19] font-bold">{formatOrderConcessions(order)}</strong> te
                la lleva a tu palco.
              </>
            )}
          </p>
        </div>

        {/* Order Details Card */}
        <div className="w-full bg-[#F5F7F6] rounded-2xl p-4 border border-[#E2E8E5] flex flex-col gap-3 text-left">
          <div className="flex justify-between items-center border-b border-[#E2E8E5] pb-2.5">
            <div>
              <span className="text-[10px] text-[#66706B] font-label-sm uppercase font-bold">
                Número de Orden
              </span>
              <p className="font-headline-md text-base font-extrabold text-[#187B56]">
                {order.numeroPedido}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#66706B] font-label-sm uppercase font-bold">
                Tiempo Estimado
              </span>
              <p className="font-headline-md text-xs font-bold text-[#D99721] flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~15-20 min
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs">
            <MapPin className="w-4 h-4 text-[#187B56] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#171A19]">
                Entrega en Palco {order.ubicacion.palco} ({order.ubicacion.zona})
              </span>
              <span className="text-[#66706B] block text-[11px]">
                {order.ubicacion.nivel || "Piso pendiente"} · Entrega local al palco
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#E2E8E5] font-label-md text-xs">
            <span className="text-[#66706B]">Total Pagado:</span>
            <span className="font-extrabold text-[#171A19] text-sm">
              {formatVipMxn(order.total)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full pt-1">
          <VipButton
            onClick={handleGoHome}
            variant="primary"
            size="lg"
            fullWidth
            className="font-extrabold flex items-center justify-center gap-2 shadow-md"
          >
            <span>Volver al menú</span>
            <ArrowRight className="w-4 h-4" />
          </VipButton>
        </div>
      </div>
    </VipModal>
  );
};

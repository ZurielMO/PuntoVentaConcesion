"use client";

import React from "react";
import { Timer, CheckCircle, AlertTriangle } from "lucide-react";
import type { VipOrderStatus } from "@/lib/vip/types";
import { motion } from "motion/react";

interface EtaCardProps {
  tiempoEstimadoMin: number;
  estado: VipOrderStatus;
}

function etaPresentation(estado: VipOrderStatus, tiempoEstimadoMin: number) {
  if (estado === "ENTREGADO" || estado === "DELIVERED") {
    return { label: "Servicio Finalizado", value: "¡En tu Palco!", tone: "success" as const };
  }
  if (estado === "CANCELADO" || estado === "CANCELLED") {
    return { label: "Estado del Pedido", value: "Cancelado", tone: "danger" as const };
  }
  if (estado === "EN_CAMINO" || estado === "ON_THE_WAY") {
    return { label: "Runner en Trayecto", value: "Llegando a tu palco", tone: "transit" as const };
  }
  if (estado === "PREPARING" || estado === "PREPARANDO" || estado === "READY_FOR_PICKUP") {
    return { label: "Preparación", value: "En cocina del estadio", tone: "prep" as const };
  }
  return { label: "Tiempo Estimado de Entrega", value: String(tiempoEstimadoMin), tone: "time" as const };
}

export const VipEtaCard: React.FC<EtaCardProps> = ({ tiempoEstimadoMin, estado }) => {
  const presentation = etaPresentation(estado, tiempoEstimadoMin);

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-[#0A1C16] via-[#102D24] to-[#16382D] p-6 sm:p-7 rounded-[24px] border border-[#234D41] shadow-[0_12px_32px_rgba(10,28,22,0.25)] flex flex-col items-center w-full max-w-sm mx-auto text-center text-white relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#187B56]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="w-13 h-13 rounded-2xl bg-[#16382D] border border-[#234D41] flex items-center justify-center text-[#00FF85] mb-2.5 shadow-2xs">
        {presentation.tone === "success" ? (
          <CheckCircle className="w-6 h-6 text-[#00FF85]" />
        ) : presentation.tone === "danger" ? (
          <AlertTriangle className="w-6 h-6 text-[#C43D3D]" />
        ) : (
          <Timer className="w-6 h-6 text-[#00FF85] animate-pulse" />
        )}
      </div>

      <span className="font-label-sm text-[11px] text-[#C5A059] uppercase tracking-wider font-extrabold mb-1">
        {presentation.label}
      </span>

      {presentation.tone === "time" ? (
        <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
          <span className="font-headline-md text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            {presentation.value}
          </span>
          <span className="font-headline-md text-base text-[#D3DCD7] font-bold">
            minutos
          </span>
        </div>
      ) : (
        <span
          className={`font-headline-md text-xl sm:text-2xl font-extrabold mt-1 tracking-tight ${
            presentation.tone === "danger" ? "text-[#C43D3D]" : "text-[#00FF85]"
          }`}
        >
          {presentation.value}
        </span>
      )}
    </motion.div>
  );
};

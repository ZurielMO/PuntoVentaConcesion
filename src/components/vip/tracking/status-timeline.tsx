"use client";

import React from "react";
import { Check } from "lucide-react";
import type { VipTrackingStep, VipOrderStatus } from "@/lib/vip/types";
import { motion } from "motion/react";

interface StatusTimelineProps {
  timeline: VipTrackingStep[];
  currentStatus: VipOrderStatus;
}

export const VipStatusTimeline: React.FC<StatusTimelineProps> = ({
  timeline,
  currentStatus,
}) => {
  const defaultSteps: { estado: string; titulo: string; desc: string; level: number }[] = [
    {
      estado: "RECEIVED",
      titulo: "Pago Confirmado",
      desc: "Recibido y procesado por cocina",
      level: 1,
    },
    {
      estado: "PREPARING",
      titulo: "En Preparación",
      desc: "Preparando alimentos y bebidas",
      level: 2,
    },
    {
      estado: "ON_THE_WAY",
      titulo: "En Camino al Palco",
      desc: "El runner va en trayecto",
      level: 3,
    },
    {
      estado: "DELIVERED",
      titulo: "Entregado",
      desc: "Servicio completado en tu asiento",
      level: 4,
    },
  ];

  const getStepState = (stepLevel: number) => {
    if (currentStatus === "CANCELADO" || currentStatus === "CANCELLED") {
      return { isDone: false, isActive: false };
    }

    const orderHierarchy: Record<string, number> = {
      PENDING_PAYMENT: 1,
      PAID: 1,
      RECIBIDO: 1,
      RECEIVED: 1,
      ACCEPTED: 2,
      PREPARANDO: 2,
      PREPARING: 2,
      READY_FOR_PICKUP: 2,
      PICKED_UP: 3,
      EN_CAMINO: 3,
      ON_THE_WAY: 3,
      ENTREGADO: 4,
      DELIVERED: 4,
      CANCELADO: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };

    const currentLevel = orderHierarchy[currentStatus] || 1;

    if (stepLevel < currentLevel) {
      return { isDone: true, isActive: false };
    }
    if (stepLevel === currentLevel) {
      return { isDone: currentLevel === 4, isActive: currentLevel < 4 };
    }
    return { isDone: false, isActive: false };
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white p-6 rounded-[22px] border border-[#DFE5E2] shadow-xs">
      <div className="relative pl-7 border-l-2 border-[#E9EFEB] space-y-6">
        {defaultSteps.map((step, idx) => {
          const { isDone, isActive } = getStepState(step.level);
          const matchedStep = timeline.find(
            (t) =>
              t.estado === step.estado ||
              (step.estado === "RECEIVED" && (t.estado === "RECIBIDO" || t.estado === "PAID")) ||
              (step.estado === "PREPARING" && (t.estado === "PREPARANDO" || t.estado === "ACCEPTED")) ||
              (step.estado === "ON_THE_WAY" && (t.estado === "EN_CAMINO" || t.estado === "READY_FOR_PICKUP")) ||
              (step.estado === "DELIVERED" && t.estado === "ENTREGADO"),
          );
          const time = matchedStep?.hora;

          return (
            <motion.div
              key={step.estado}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.25 }}
              className="relative"
            >
              {/* Timeline Node Indicator */}
              <div
                className={`
                  absolute -left-[39px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                  ${
                    isDone
                      ? "bg-[#187B56] border-[#187B56] text-white shadow-2xs"
                      : isActive
                      ? "bg-white border-[#187B56] shadow-[0_0_12px_rgba(24,123,86,0.3)]"
                      : "bg-[#F6F8F7] border-[#DFE5E2]"
                  }
                `}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-[#187B56] animate-ping" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5D0]" />
                )}
              </div>

              {/* Step Content */}
              <div>
                <div className="flex justify-between items-center">
                  <h4
                    className={`font-headline-md text-sm font-extrabold tracking-tight ${
                      isDone || isActive ? "text-[#111614]" : "text-[#7E8E87]"
                    }`}
                  >
                    {step.titulo}
                  </h4>
                  {time && (isDone || isActive) && (
                    <span className="font-label-sm text-[10px] text-[#187B56] font-bold">
                      {time}
                    </span>
                  )}
                </div>

                <p
                  className={`font-body-md text-xs mt-0.5 ${
                    isActive
                      ? "text-[#187B56] font-bold"
                      : isDone
                      ? "text-[#4E5C56]"
                      : "text-[#7E8E87]"
                  }`}
                >
                  {matchedStep?.descripcion || step.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { VipModal } from "@/components/vip/ui/modal";
import { VipButton } from "@/components/vip/ui/button";
import type { VipOrder } from "@/lib/vip/types";
import { Truck } from "lucide-react";

interface AssignRunnerModalProps {
  order: VipOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, runner: { id: string; name: string; phone: string }) => void;
}

export const AssignRunnerModal: React.FC<AssignRunnerModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!order) return null;

  const handleAssign = () => {
    const runnerName = name.trim();
    const runnerPhone = phone.trim();
    if (!runnerName || !runnerPhone) return;
    onConfirm(order.id, {
      id: `runner-${Date.now()}`,
      name: runnerName,
      phone: runnerPhone,
    });
    setName("");
    setPhone("");
    onClose();
  };

  return (
    <VipModal isOpen={isOpen} onClose={onClose} title="Asignar repartidor" maxWidth="md">
      <div className="flex flex-col gap-4">
        <div className="bg-[#F5F7F6] p-3.5 rounded-2xl border border-[#E2E8E5] flex justify-between items-center">
          <div>
            <span className="text-base font-label-sm uppercase text-[#66706B] font-bold tracking-wide">Destino</span>
            <h4 className="font-headline-md text-xl font-extrabold text-[#171A19]">
              Palco {order.ubicacion.palco} ({order.ubicacion.zona})
            </h4>
          </div>
          <span className="font-headline-md text-lg font-bold text-[#187B56]">
            {order.numeroPedido}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Nombre del repartidor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-3.5 min-h-14 rounded-xl border border-[#E2E8E5] text-lg font-body-md focus:border-[#187B56] focus:outline-none"
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="p-3.5 min-h-14 rounded-xl border border-[#E2E8E5] text-lg font-body-md focus:border-[#187B56] focus:outline-none"
          />
        </div>

        <div className="flex gap-2.5 pt-2">
          <VipButton onClick={onClose} variant="outline" size="lg" className="flex-1">
            Cancelar
          </VipButton>
          <VipButton
            onClick={handleAssign}
            variant="primary"
            disabled={!name.trim() || !phone.trim()}
            className="flex-1 font-bold flex items-center justify-center gap-1.5"
            size="lg"
          >
            <Truck className="w-5 h-5" />
            <span>Confirmar salida</span>
          </VipButton>
        </div>
      </div>
    </VipModal>
  );
};

"use client";

import React from "react";
import { CreditCard, Banknote, Star, Check } from "lucide-react";
import type { VipPaymentMethod } from "@/lib/vip/types";
import { VipModal } from "../ui/modal";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  methods: VipPaymentMethod[];
  selectedMethod: VipPaymentMethod;
  onSelectMethod: (method: VipPaymentMethod) => void;
}

export const VipPaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  methods,
  selectedMethod,
  onSelectMethod,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "CARD":
        return CreditCard;
      case "CASH":
        return Banknote;
      case "POINTS":
        return Star;
      default:
        return CreditCard;
    }
  };

  return (
    <VipModal isOpen={isOpen} onClose={onClose} title="Método de Pago">
      <div className="flex flex-col gap-3">
        <p className="font-body-md text-xs text-[#B9CBB9] mb-2">
          Selecciona cómo deseas pagar tu orden para entrega en palco:
        </p>

        {methods.map((method) => {
          const Icon = getIcon(method.tipo);
          const isSelected = selectedMethod.id === method.id;

          return (
            <button
              key={method.id}
              onClick={() => {
                onSelectMethod(method);
                onClose();
              }}
              className={`
                flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer text-left
                ${
                  isSelected
                    ? "bg-[#00FF85]/10 border-[#00FF85] shadow-[0_2px_12px_rgba(0,255,133,0.15)]"
                    : "bg-[#171C22] border-[#3B4B3D] hover:bg-[#252A31]"
                }
              `}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? "bg-[#00FF85] text-[#003919]"
                      : "bg-[#252A31] text-[#00FF85]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-headline-md text-sm font-bold text-[#F0FFEE]">
                    {method.titulo}
                  </h4>
                  <p className="font-label-sm text-xs text-[#ACB5C9]">
                    {method.detalle}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-[#00FF85] text-[#003919] flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </VipModal>
  );
};

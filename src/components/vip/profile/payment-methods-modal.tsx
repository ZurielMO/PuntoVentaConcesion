"use client";

import React, { useState } from "react";
import { CreditCard, Plus, ShieldCheck } from "lucide-react";
import type { VipPaymentMethod } from "@/lib/vip/types";
import { VipModal } from "../ui/modal";
import { VipButton } from "../ui/button";
import { vipToast } from "@/hooks/vip/use-vip-toast";

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  methods: VipPaymentMethod[];
}

export const VipPaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({
  isOpen,
  onClose,
  methods,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardHolder) {
      vipToast.error("Por favor completa los datos de la tarjeta.");
      return;
    }
    vipToast.success("Tarjeta guardada con éxito", {
      description: `Visa finalizada en ${cardNumber.slice(-4) || "8899"} añadida a tu cuenta.`,
    });
    setShowAddForm(false);
    setCardNumber("");
    setCardHolder("");
  };

  return (
    <VipModal isOpen={isOpen} onClose={onClose} title="Métodos de Pago">
      <div className="flex flex-col gap-4">
        {!showAddForm ? (
          <>
            <div className="flex flex-col gap-2.5">
              {methods
                .filter((m) => m.tipo === "CARD")
                .map((card) => (
                  <div
                    key={card.id}
                    className="p-4 rounded-2xl bg-[#F5F7F6] border border-[#E2E8E5] flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-[#187B56] border border-[#E2E8E5] flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-headline-md text-sm font-bold text-[#171A19]">
                          {card.titulo}
                        </h4>
                        <p className="font-label-sm text-xs text-[#66706B]">
                          {card.detalle}
                        </p>
                      </div>
                    </div>

                    {card.predeterminado ? (
                      <span className="font-label-sm text-[10px] font-bold text-[#187B56] bg-[#187B56]/10 px-2 py-0.5 rounded-full border border-[#187B56]/20">
                        Predeterminada
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          vipToast.success("Tarjeta predeterminada actualizada")
                        }
                        className="text-xs text-[#66706B] hover:text-[#187B56] underline cursor-pointer"
                      >
                        Establecer
                      </button>
                    )}
                  </div>
                ))}
            </div>

            <VipButton
              onClick={() => setShowAddForm(true)}
              variant="outline"
              fullWidth
              className="mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Nueva Tarjeta</span>
            </VipButton>
          </>
        ) : (
          <form onSubmit={handleAddCard} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-label-md text-[#171A19] font-bold">
                Número de Tarjeta
              </label>
              <input
                type="text"
                maxLength={19}
                placeholder="4152 •••• •••• 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full bg-[#F5F7F6] border border-[#E2E8E5] rounded-xl p-3 text-sm text-[#171A19] focus:outline-none focus:border-[#187B56]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-label-md text-[#171A19] font-bold">
                Titular de la Tarjeta
              </label>
              <input
                type="text"
                placeholder="Nombre como aparece en el plástico"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="w-full bg-[#F5F7F6] border border-[#E2E8E5] rounded-xl p-3 text-sm text-[#171A19] focus:outline-none focus:border-[#187B56]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-label-md text-[#171A19] font-bold">
                  Vencimiento (MM/AA)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="08/28"
                  value={cardExp}
                  onChange={(e) => setCardExp(e.target.value)}
                  className="w-full bg-[#F5F7F6] border border-[#E2E8E5] rounded-xl p-3 text-sm text-[#171A19] focus:outline-none focus:border-[#187B56]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-label-md text-[#171A19] font-bold">CVV</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="w-full bg-[#F5F7F6] border border-[#E2E8E5] rounded-xl p-3 text-sm text-[#171A19] focus:outline-none focus:border-[#187B56]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#66706B] mt-1">
              <ShieldCheck className="w-4 h-4 text-[#187B56]" />
              <span>Transacciones cifradas de extremo a extremo SSL 256-bit.</span>
            </div>

            <div className="flex gap-2 mt-3">
              <VipButton
                type="button"
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </VipButton>
              <VipButton type="submit" variant="primary" className="flex-1">
                Guardar Tarjeta
              </VipButton>
            </div>
          </form>
        )}
      </div>
    </VipModal>
  );
};

"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { VipModal } from "../ui/modal";
import { VipButton } from "../ui/button";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VipSupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  return (
    <VipModal isOpen={isOpen} onClose={onClose} title="Ayuda del servicio a palcos">
      <div className="flex flex-col gap-4">
        <div className="bg-[#F5F7F6] p-4 rounded-2xl border border-[#E2E8E5] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#187B56]/10 text-[#187B56] flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-headline-md text-sm font-bold text-[#171A19]">Entrega a palco</h4>
            <p className="font-body-md text-xs text-[#66706B]">
              Si necesitas asistencia durante el partido, acude al personal de palcos.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h5 className="font-headline-md text-xs font-bold text-[#9E7844] uppercase">
            Preguntas frecuentes
          </h5>
          <details className="bg-[#F5F7F6] p-3.5 rounded-xl border border-[#E2E8E5] cursor-pointer">
            <summary className="font-semibold text-[#171A19] hover:text-[#187B56]">
              ¿Necesito cuenta para ordenar?
            </summary>
            <p className="mt-2 text-[#66706B] text-[11px] leading-relaxed">
              No. Indica tu nombre, correo, zona y palco al pagar. Al confirmar el cobro, cocina recibe el pedido.
            </p>
          </details>
          <details className="bg-[#F5F7F6] p-3.5 rounded-xl border border-[#E2E8E5] cursor-pointer">
            <summary className="font-semibold text-[#171A19] hover:text-[#187B56]">
              ¿Cuánto tarda en llegar el pedido?
            </summary>
            <p className="mt-2 text-[#66706B] text-[11px] leading-relaxed">
              La preparación y entrega suele tomar entre 12 y 20 minutos, según la demanda del partido.
            </p>
          </details>
          <details className="bg-[#F5F7F6] p-3.5 rounded-xl border border-[#E2E8E5] cursor-pointer">
            <summary className="font-semibold text-[#171A19] hover:text-[#187B56]">
              ¿Puedo pedir de varias concesiones?
            </summary>
            <p className="mt-2 text-[#66706B] text-[11px] leading-relaxed">
              Sí. Un solo pago cubre el carrito; cada concesión prepara su parte y se entrega en el palco indicado.
            </p>
          </details>
        </div>

        <VipButton onClick={onClose} variant="primary" fullWidth>
          Entendido
        </VipButton>
      </div>
    </VipModal>
  );
};

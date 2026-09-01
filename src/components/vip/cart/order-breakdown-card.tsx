"use client";

import React from "react";
import { HeartHandshake } from "lucide-react";

interface OrderBreakdownCardProps {
  subtotal: number;
  cargoServicio: number;
  propina: number;
  onSelectPropina: (amount: number) => void;
  total: number;
}

export const VipOrderBreakdownCard: React.FC<OrderBreakdownCardProps> = ({
  subtotal,
  cargoServicio,
  propina,
  onSelectPropina,
  total,
}) => {
  const tipOptions = [0, 20, 50, 100];

  return (
    <section className="bg-white rounded-[20px] p-5 sm:p-6 border border-[#DFE5E2] shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#E9EFEB] pb-3">
        <h3 className="font-headline-md text-sm sm:text-base font-extrabold text-[#111614] tracking-tight">
          Resumen de Cuenta
        </h3>
        <span className="text-[10px] font-label-sm text-[#9E7844] font-extrabold uppercase tracking-wider">
          Transparente
        </span>
      </div>

      <div className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between items-center">
          <span className="font-body-md text-[#4E5C56]">Subtotal productos</span>
          <span className="font-headline-md font-bold text-[#111614]">${subtotal}.00 MXN</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-body-md text-[#4E5C56]">Cargo entrega a palco</span>
          <span className="font-headline-md font-bold text-[#111614]">
            ${cargoServicio}.00 MXN
          </span>
        </div>
      </div>

      {/* Tip selector */}
      <div className="pt-3 border-t border-[#E9EFEB] flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <span className="font-body-md text-xs font-semibold text-[#4E5C56] flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-[#187B56]" />
            <span>Propina para el runner (opcional)</span>
          </span>
          <span className="font-headline-md font-bold text-xs text-[#187B56]">
            +${propina}.00
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {tipOptions.map((tip) => {
            const isSelected = propina === tip;
            return (
              <button
                key={tip}
                type="button"
                onClick={() => onSelectPropina(tip)}
                className={`
                  min-h-[40px] rounded-xl text-xs font-label-md font-bold transition-all cursor-pointer border select-none active:scale-95
                  ${
                    isSelected
                      ? "bg-[#187B56] text-white border-[#187B56] shadow-xs"
                      : "bg-[#F6F8F7] text-[#111614] border-[#DFE5E2] hover:bg-[#ECEFEA] hover:border-[#187B56]/40"
                  }
                `}
              >
                {tip === 0 ? "No" : `$${tip}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Total Final */}
      <div className="flex justify-between items-baseline border-t border-[#E9EFEB] pt-4 mt-1">
        <div>
          <span className="font-headline-md text-base sm:text-lg font-extrabold text-[#111614] block tracking-tight">
            Total a Pagar
          </span>
          <span className="text-[11px] text-[#7E8E87] font-medium">
            IVA y cargos incluidos
          </span>
        </div>
        <span className="font-headline-md text-xl sm:text-2xl font-extrabold text-[#187B56] tracking-tight">
          ${total + propina}.00 MXN
        </span>
      </div>
    </section>
  );
};

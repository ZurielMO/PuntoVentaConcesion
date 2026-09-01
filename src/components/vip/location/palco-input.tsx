"use client";

import React from "react";
import { Tag, Building, FileText } from "lucide-react";

interface PalcoInputProps {
  palco: string;
  onChangePalco: (val: string) => void;
  nivel?: string;
  onChangeNivel?: (val: string) => void;
  notas?: string;
  onChangeNotas?: (val: string) => void;
}

export const VipPalcoInput: React.FC<PalcoInputProps> = ({
  palco,
  onChangePalco,
  nivel = "",
  onChangeNivel,
  notas = "",
  onChangeNotas,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Palco Number */}
      <div className="flex flex-col gap-1.5">
        <label className="font-headline-md text-xs text-[#171A19] font-bold uppercase tracking-wider">
          Número de Palco / Suite
        </label>
        <div className="relative">
          <Tag className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#187B56]" />
          <input
            type="text"
            value={palco}
            onChange={(e) => onChangePalco(e.target.value)}
            placeholder="Ej. 124, Suite 204"
            className="w-full bg-white border border-[#E2E8E5] rounded-xl py-3.5 pl-12 pr-4 font-headline-md text-base text-[#171A19] placeholder:text-[#ACB5C9] focus:border-[#187B56] focus:outline-none focus:ring-1 focus:ring-[#187B56] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Nivel / Nivel de Palcos */}
      {onChangeNivel && (
        <div className="flex flex-col gap-1.5">
          <label className="font-headline-md text-xs text-[#171A19] font-bold uppercase tracking-wider">
            Nivel / Fila (Opcional)
          </label>
          <div className="relative">
            <Building className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#66706B]" />
            <input
              type="text"
              value={nivel}
              onChange={(e) => onChangeNivel(e.target.value)}
              placeholder="Ej. Nivel 2, Fila A"
              className="w-full bg-white border border-[#E2E8E5] rounded-xl py-3.5 pl-12 pr-4 font-body-md text-sm text-[#171A19] placeholder:text-[#ACB5C9] focus:border-[#187B56] focus:outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      )}

      {/* Referencias de entrega */}
      {onChangeNotas && (
        <div className="flex flex-col gap-1.5">
          <label className="font-headline-md text-xs text-[#171A19] font-bold uppercase tracking-wider">
            Instrucciones para el Runner (Opcional)
          </label>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-4 top-3.5 text-[#66706B]" />
            <textarea
              value={notas}
              onChange={(e) => onChangeNotas(e.target.value)}
              placeholder="Ej. Puerta lateral con logo, tocar 2 veces..."
              rows={2}
              className="w-full bg-white border border-[#E2E8E5] rounded-xl py-3 pl-12 pr-4 font-body-md text-sm text-[#171A19] placeholder:text-[#ACB5C9] focus:border-[#187B56] focus:outline-none resize-none transition-all shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

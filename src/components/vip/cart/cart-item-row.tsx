"use client";

import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import type { VipCartItem } from "@/lib/vip/types";
import { VipMedia } from "../ui/media";
import { motion } from "motion/react";

interface CartItemRowProps {
  item: VipCartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export const VipCartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="bg-white p-4 sm:p-5 rounded-[18px] border border-[#DFE5E2] shadow-2xs flex items-center justify-between gap-4 transition-all"
    >
      {/* Photo */}
      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#ECEFEA] border border-[#DFE5E2] shrink-0">
        <VipMedia
          src={item.producto.imagen}
          alt={item.producto.nombre}
          categoria={item.producto.categoria}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Item info */}
      <div className="flex flex-col flex-1 min-w-0">
        <h4 className="font-headline-md text-sm sm:text-base font-extrabold text-[#111614] truncate tracking-tight">
          {item.producto.nombre}
        </h4>

        {/* Selected options */}
        {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
          <p className="font-body-md text-[11px] text-[#4E5C56] truncate mt-0.5">
            {item.opcionesSeleccionadas.map((o) => o.opcionNombre).join(", ")}
          </p>
        )}

        {item.instrucciones && (
          <p className="font-body-md text-[11px] text-[#9E7844] italic truncate mt-0.5">
            &ldquo;{item.instrucciones}&rdquo;
          </p>
        )}

        <span className="font-headline-md text-sm sm:text-base font-extrabold text-[#187B56] mt-1">
          ${item.subtotal}.00 MXN
        </span>
      </div>

      {/* Quantity & Delete Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center bg-[#F6F8F7] border border-[#DFE5E2] rounded-xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-[#ECEFEA] flex items-center justify-center text-[#111614] transition-colors cursor-pointer shadow-2xs disabled:opacity-35"
            disabled={item.cantidad <= 1}
            aria-label="Disminuir"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span className="w-7 sm:w-8 text-center font-headline-md text-xs sm:text-sm font-extrabold text-[#111614]">
            {item.cantidad}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-[#ECEFEA] flex items-center justify-center text-[#111614] transition-colors cursor-pointer shadow-2xs"
            aria-label="Aumentar"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F6F8F7] hover:bg-[#C43D3D]/10 text-[#7E8E87] hover:text-[#C43D3D] flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-[#C43D3D]/20"
          title="Eliminar producto"
          aria-label="Eliminar producto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

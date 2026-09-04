"use client";

import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import type { VipCartItem } from "@/lib/vip/types";
import { formatVipMxn } from "@/lib/vip/money";
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
      className="bg-white p-4 sm:p-5 rounded-[20px] border border-[#DFE5E2] shadow-2xs flex items-center justify-between gap-3.5 sm:gap-4 transition-all"
    >
      {/* Photo */}
      <div className="w-20 h-20 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#ECEFEA] border border-[#DFE5E2] shrink-0">
        <VipMedia
          src={item.producto.imagen}
          alt={item.producto.nombre}
          categoria={item.producto.categoria}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Item info */}
      <div className="flex flex-col flex-1 min-w-0 pr-1">
        <h4 className="font-headline-md text-base sm:text-lg font-extrabold text-[#111614] truncate tracking-tight leading-snug">
          {item.producto.nombre}
        </h4>

        {/* Selected options */}
        {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
          <p className="font-body-md text-xs sm:text-sm text-[#4E5C56] truncate mt-0.5">
            {item.opcionesSeleccionadas.map((o) => o.opcionNombre).join(", ")}
          </p>
        )}

        {item.instrucciones && (
          <p className="font-body-md text-xs sm:text-sm text-[#9E7844] italic truncate mt-0.5">
            &ldquo;{item.instrucciones}&rdquo;
          </p>
        )}

        <span className="font-headline-md text-base sm:text-lg font-extrabold text-[#187B56] mt-1">
          {formatVipMxn(item.subtotal)}
        </span>
      </div>

      {/* Quantity & Delete Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center bg-[#F6F8F7] border border-[#DFE5E2] rounded-xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
            className="w-9 h-9 sm:w-9 sm:h-9 rounded-lg bg-white hover:bg-[#ECEFEA] flex items-center justify-center text-[#111614] transition-colors cursor-pointer shadow-2xs disabled:opacity-35"
            disabled={item.cantidad <= 1}
            aria-label="Disminuir"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="w-8 sm:w-9 text-center font-headline-md text-sm sm:text-base font-extrabold text-[#111614]">
            {item.cantidad}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
            className="w-9 h-9 sm:w-9 sm:h-9 rounded-lg bg-white hover:bg-[#ECEFEA] flex items-center justify-center text-[#111614] transition-colors cursor-pointer shadow-2xs"
            aria-label="Aumentar"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="w-10 h-10 sm:w-10 sm:h-10 rounded-xl bg-[#F6F8F7] hover:bg-[#C43D3D]/10 text-[#7E8E87] hover:text-[#C43D3D] flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-[#C43D3D]/20"
          title="Eliminar producto"
          aria-label="Eliminar producto"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

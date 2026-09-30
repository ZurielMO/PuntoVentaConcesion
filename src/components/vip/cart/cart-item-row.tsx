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
  onUpdateInstructions: (id: string, instrucciones: string) => void;
  onRemove: (id: string) => void;
}

export const VipCartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onUpdateInstructions,
  onRemove,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[22px] border border-[#E5EBE8] shadow-[0_4px_16px_rgba(6,46,32,0.03)] flex flex-col gap-3 transition-all"
    >
      <div className="flex items-center justify-between gap-3.5 sm:gap-4">
        {/* Photo */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#ECEFEA] border border-[#E5EBE8] shrink-0">
          <VipMedia
            src={item.producto.imagen}
            alt={item.producto.nombre}
            categoria={item.producto.categoria}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Item info */}
        <div className="flex flex-col flex-1 min-w-0 pr-1">
          <h4 className="font-[family-name:var(--font-montserrat)] text-sm sm:text-base font-bold text-[#111827] truncate tracking-tight leading-snug">
            {item.producto.nombre}
          </h4>

          {/* Selected options */}
          {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
            <p className="font-sans text-xs text-[#4B5563] truncate mt-0.5">
              {item.opcionesSeleccionadas.map((o) => o.opcionNombre).join(", ")}
            </p>
          )}

          <span className="font-[family-name:var(--font-montserrat)] text-base font-extrabold text-[#0D4A34] mt-1">
            {formatVipMxn(item.subtotal)}
          </span>
        </div>

        {/* Quantity & Delete Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#F8FAF9] border border-[#E5EBE8] rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white hover:bg-[#EEF2F0] flex items-center justify-center text-[#111827] transition-colors cursor-pointer shadow-2xs disabled:opacity-35"
              disabled={item.cantidad <= 1}
              aria-label="Disminuir"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="w-8 text-center font-[family-name:var(--font-montserrat)] text-sm font-bold text-[#111827]">
              {item.cantidad}
            </span>

            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white hover:bg-[#EEF2F0] flex items-center justify-center text-[#111827] transition-colors cursor-pointer shadow-2xs"
              aria-label="Aumentar"
            >
              <Plus className="w-3.5 h-3.5 text-[#0D4A34]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F8FAF9] hover:bg-[#C43D3D]/10 text-[#9CA3AF] hover:text-[#C43D3D] flex items-center justify-center transition-colors cursor-pointer border border-[#E5EBE8] hover:border-[#C43D3D]/25"
            title="Eliminar producto"
            aria-label="Eliminar producto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1.5 pt-1">
        <span className="text-xs font-bold text-[#374151]">
          Comentario para cocina o barra
          <span className="ml-1 font-normal text-[#9CA3AF]">(opcional)</span>
        </span>
        <textarea
          value={item.instrucciones || ""}
          onChange={(event) => onUpdateInstructions(item.id, event.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Sin hielo, sin cebolla, término medio..."
          className="w-full resize-none rounded-xl border border-[#E5EBE8] bg-[#F8FAF9] px-3 py-2 text-xs sm:text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#0D4A34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D4A34]/15 transition-all"
        />
      </label>
    </motion.div>
  );
};

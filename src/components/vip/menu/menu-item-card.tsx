"use client";

import React from "react";
import { Plus, Sparkles, SlidersHorizontal } from "lucide-react";
import type { VipProduct } from "@/lib/vip/types";
import { formatVipAmount, formatVipMxn } from "@/lib/vip/money";
import { VIP_PURCHASE_UNAVAILABLE_TITLE } from "@/lib/vip/purchase-availability";
import { VipMedia } from "../ui/media";
import { motion } from "motion/react";

interface MenuItemCardProps {
  product: VipProduct;
  onOpenDetail: (product: VipProduct) => void;
  onQuickAdd: (product: VipProduct) => void;
  salesOpen?: boolean;
  /** Preventa abierta: el producto se puede pedir aunque el POS no tenga stock. */
  allowWithoutStock?: boolean;
}

export const VipMenuItemCard: React.FC<MenuItemCardProps> = ({
  product,
  onOpenDetail,
  onQuickAdd,
  salesOpen = true,
  allowWithoutStock = false,
}) => {
  const hasOptions =
    (product.gruposOpciones && product.gruposOpciones.length > 0) ||
    (product.opcionesDisponibles && product.opcionesDisponibles.length > 0);
  const outOfStock = product.disponible === false && !allowWithoutStock;

  let actionLabel = "Agregar";
  if (!salesOpen || outOfStock) actionLabel = "No disponible";
  else if (hasOptions) actionLabel = "Elegir";
  const actionDisabled = !salesOpen || outOfStock;
  let actionAriaLabel = `Añadir ${product.nombre} al pedido`;
  if (actionDisabled) actionAriaLabel = VIP_PURCHASE_UNAVAILABLE_TITLE;

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionDisabled) return;
    if (hasOptions) {
      onOpenDetail(product);
    } else {
      onQuickAdd(product);
    }
  };

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      onClick={() => onOpenDetail(product)}
      className="group relative bg-white rounded-2xl sm:rounded-[22px] p-3 sm:p-5 border border-[#E5EBE8] shadow-[0_4px_16px_rgba(6,46,32,0.03)] hover:shadow-[0_10px_28px_rgba(6,46,32,0.08)] flex items-center sm:flex-col sm:justify-between gap-3 sm:gap-4 cursor-pointer transition-all select-none"
    >
      <div className="relative w-[76px] h-[76px] sm:hidden rounded-xl overflow-hidden bg-[#ECEFEA] shrink-0 border border-[#E5EBE8]">
        <VipMedia
          src={product.imagen}
          alt={product.nombre}
          categoria={product.categoria}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="hidden sm:flex items-start justify-between gap-4 w-full">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <h3 className="font-[family-name:var(--font-montserrat)] text-base sm:text-lg font-bold text-[#111827] group-hover:text-[#0D4A34] transition-colors line-clamp-1 tracking-tight">
              {product.nombre}
            </h3>
            {product.esRecomendado && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-[#062319] bg-gradient-to-r from-[#C5A059] to-[#D4AF37] px-2 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Recomendado</span>
              </span>
            )}
            {outOfStock && (
              <span className="inline-flex items-center text-[10px] font-bold text-[#C43D3D] bg-[#C43D3D]/10 px-2 py-0.5 rounded-full border border-[#C43D3D]/25">
                No disponible
              </span>
            )}
          </div>

          {product.descripcion.trim() && (
            <p className="font-sans text-xs sm:text-sm text-[#4B5563] line-clamp-3 whitespace-pre-line leading-relaxed">
              {product.descripcion}
            </p>
          )}

          {hasOptions && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#A67C2E] font-semibold mt-1.5">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Opciones personalizables</span>
            </span>
          )}
        </div>

        <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-2xl overflow-hidden bg-[#ECEFEA] shrink-0 border border-[#E5EBE8] shadow-2xs">
          <VipMedia
            src={product.imagen}
            alt={product.nombre}
            categoria={product.categoria}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400"
          />
        </div>
      </div>

      <div className="flex-1 min-w-0 sm:hidden">
        <div className="flex items-center gap-1.5">
          <h3 className="font-[family-name:var(--font-montserrat)] text-sm sm:text-base font-bold text-[#111827] truncate">
            {product.nombre}
          </h3>
          {product.esRecomendado && <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />}
        </div>
        {product.descripcion.trim() && (
          <p className="font-sans text-xs text-[#4B5563] line-clamp-2 leading-snug mt-0.5">
            {product.descripcion}
          </p>
        )}
        <p className="font-[family-name:var(--font-montserrat)] text-base font-extrabold text-[#0D4A34] leading-tight mt-1">
          ${formatVipAmount(product.precio)} <span className="text-[10px] text-[#6B7280]">MXN</span>
        </p>
        {outOfStock && (
          <p className="text-xs font-bold text-[#C43D3D] mt-0.5">No disponible</p>
        )}
      </div>

      <div className="hidden sm:flex items-center justify-between gap-3 pt-3 border-t border-[#EEF2F0] w-full">
        <div>
          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold block">
            Precio
          </span>
          <span className="font-[family-name:var(--font-montserrat)] text-lg font-extrabold text-[#0D4A34]">
            {formatVipMxn(product.precio)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleActionClick}
          disabled={actionDisabled}
          className="min-h-[44px] px-5 rounded-xl bg-gradient-to-r from-[#062E20] to-[#0D4A34] hover:from-[#093E2B] hover:to-[#115C41] text-white flex items-center justify-center gap-1.5 shadow-[0_3px_12px_rgba(6,46,32,0.2)] active:scale-95 transition-all cursor-pointer font-[family-name:var(--font-montserrat)] text-xs sm:text-sm font-bold border border-[#C5A059]/25 disabled:opacity-45 disabled:pointer-events-none"
          aria-label={actionAriaLabel}
        >
          <Plus className="w-4 h-4 stroke-[2.5] text-[#D4AF37]" />
          <span>{actionLabel}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={handleActionClick}
        disabled={actionDisabled}
        className="sm:hidden min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-gradient-to-r from-[#062E20] to-[#0D4A34] text-white flex items-center justify-center gap-1 shadow-sm active:scale-95 font-[family-name:var(--font-montserrat)] text-xs font-bold disabled:opacity-45 disabled:pointer-events-none shrink-0 border border-[#C5A059]/25"
        aria-label={actionAriaLabel}
      >
        <Plus className="w-4 h-4 stroke-[2.5] text-[#D4AF37]" />
        <span>{actionLabel}</span>
      </button>
    </motion.article>
  );
};

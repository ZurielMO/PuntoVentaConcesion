"use client";

import React from "react";
import { Plus, Sparkles, SlidersHorizontal } from "lucide-react";
import type { VipProduct } from "@/lib/vip/types";
import { VipMedia } from "../ui/media";
import { motion } from "motion/react";

interface MenuItemCardProps {
  product: VipProduct;
  onOpenDetail: (product: VipProduct) => void;
  onQuickAdd: (product: VipProduct) => void;
}

export const VipMenuItemCard: React.FC<MenuItemCardProps> = ({
  product,
  onOpenDetail,
  onQuickAdd,
}) => {
  const hasOptions =
    (product.gruposOpciones && product.gruposOpciones.length > 0) ||
    (product.opcionesDisponibles && product.opcionesDisponibles.length > 0);

  let actionLabel = "Agregar";
  if (product.disponible === false) actionLabel = "Agotado";
  else if (hasOptions) actionLabel = "Elegir";

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.disponible) return;
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
      className="group relative bg-white rounded-2xl sm:rounded-[20px] p-2.5 sm:p-5 border border-[#DFE5E2] shadow-xs hover:shadow-[0_10px_28px_rgba(10,28,22,0.07)] flex items-center sm:flex-col sm:justify-between gap-3 sm:gap-4 cursor-pointer transition-all select-none"
    >
      <div className="relative w-[72px] h-[72px] sm:hidden rounded-xl overflow-hidden bg-[#ECEFEA] shrink-0 border border-[#DFE5E2]">
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
            <h3 className="font-headline-md text-lg sm:text-xl font-extrabold text-[#111614] group-hover:text-[#187B56] transition-colors line-clamp-1 tracking-tight">
              {product.nombre}
            </h3>
            {product.esRecomendado && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#9E7844] bg-[#9E7844]/12 px-2 py-0.5 rounded-full border border-[#9E7844]/25">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Recomendado</span>
              </span>
            )}
            {product.disponible === false && (
              <span className="inline-flex items-center text-[10px] font-extrabold text-[#C43D3D] bg-[#C43D3D]/10 px-2 py-0.5 rounded-full border border-[#C43D3D]/25">
                Agotado
              </span>
            )}
          </div>

          {product.descripcion ? (
            <p className="font-body-md text-sm text-[#4E5C56] line-clamp-2 leading-relaxed">
              {product.descripcion}
            </p>
          ) : (
            <p className="font-body-md text-sm text-[#7E8E87] italic">
              Preparado al momento en el estadio
            </p>
          )}

          {hasOptions && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#9E7844] font-semibold mt-1.5">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Opciones personalizables</span>
            </span>
          )}
        </div>

        <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-2xl overflow-hidden bg-[#ECEFEA] shrink-0 border border-[#DFE5E2] shadow-2xs">
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
          <h3 className="font-headline-md text-base font-extrabold text-[#111614] truncate">
            {product.nombre}
          </h3>
          {product.esRecomendado && <Sparkles className="w-3.5 h-3.5 text-[#9E7844] shrink-0" />}
        </div>
        <p className="font-headline-md text-lg font-extrabold text-[#187B56] leading-tight mt-0.5">
          ${product.precio}
        </p>
        {product.disponible === false && (
          <p className="text-xs font-bold text-[#C43D3D]">Agotado</p>
        )}
      </div>

      <div className="hidden sm:flex items-center justify-between gap-3 pt-3 border-t border-[#E9EFEB] w-full">
        <div>
          <span className="text-xs text-[#7E8E87] uppercase tracking-wider font-bold block">
            Precio
          </span>
          <span className="font-headline-md text-xl font-extrabold text-[#187B56]">
            ${product.precio}.00 MXN
          </span>
        </div>

        <button
          type="button"
          onClick={handleActionClick}
          disabled={product.disponible === false}
          className="min-h-[42px] px-4 rounded-xl bg-[#187B56] hover:bg-[#136244] text-white flex items-center justify-center gap-1.5 shadow-[0_3px_10px_rgba(24,123,86,0.25)] active:scale-95 transition-all cursor-pointer font-headline-md text-sm font-bold border border-[#00FF85]/20 disabled:opacity-45 disabled:pointer-events-none"
          aria-label={
            product.disponible === false
              ? `${product.nombre} agotado`
              : `Añadir ${product.nombre} al pedido`
          }
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{actionLabel}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={handleActionClick}
        disabled={product.disponible === false}
        className="sm:hidden min-h-11 min-w-11 px-3 rounded-xl bg-[#187B56] text-white flex items-center justify-center gap-1 shadow-[0_3px_10px_rgba(24,123,86,0.25)] active:scale-95 font-headline-md text-sm font-bold disabled:opacity-45 disabled:pointer-events-none shrink-0"
        aria-label={
          product.disponible === false
            ? `${product.nombre} agotado`
            : `Añadir ${product.nombre} al pedido`
        }
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>{actionLabel}</span>
      </button>
    </motion.article>
  );
};

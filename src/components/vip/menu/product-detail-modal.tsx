"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus, Check } from "lucide-react";
import type { VipProduct } from "@/lib/vip/types";
import { VipModal } from "../ui/modal";
import { VipButton } from "../ui/button";
import { VipMedia } from "../ui/media";

interface ProductDetailModalProps {
  product: VipProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: VipProduct,
    quantity: number,
    selectedOptions: { grupoTitulo: string; opcionNombre: string; precioExtra: number; id?: string }[],
    notes: string,
  ) => void;
}

export const VipProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, { id?: string; opcionNombre: string; precioExtra: number }>
  >({});
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSpecialInstructions("");
      const initialOpts: Record<string, { id?: string; opcionNombre: string; precioExtra: number }> = {};
      if (product.gruposOpciones) {
        product.gruposOpciones.forEach((grp) => {
          if (grp.opciones && grp.opciones.length > 0) {
            initialOpts[grp.titulo] = {
              id: grp.opciones[0].id,
              opcionNombre: grp.opciones[0].nombre,
              precioExtra: grp.opciones[0].precioExtra,
            };
          }
        });
      }
      setSelectedOptions(initialOpts);
    }
  }, [product]);

  if (!product) return null;

  const handleSelectOption = (
    groupTitle: string,
    optionId: string,
    optionName: string,
    extraPrice: number,
  ) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupTitle]: {
        id: optionId,
        opcionNombre: optionName,
        precioExtra: extraPrice,
      },
    }));
  };

  const extraTotal = Object.values(selectedOptions).reduce(
    (sum, opt) => sum + opt.precioExtra,
    0,
  );
  const itemTotal = (product.precio + extraTotal) * quantity;

  const handleConfirm = () => {
    if (!product.disponible) return;
    const formattedOptions = Object.entries(selectedOptions).map(
      ([grupoTitulo, opt]) => ({
        grupoTitulo,
        id: opt.id,
        opcionNombre: opt.opcionNombre,
        precioExtra: opt.precioExtra,
      }),
    );
    onAddToCart(product, quantity, formattedOptions, specialInstructions);
    onClose();
  };

  return (
    <VipModal isOpen={isOpen} onClose={onClose} title={product.nombre} maxWidth="md">
      <div className="flex flex-col gap-4">
        {/* Product photo & description */}
        <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-[#ECEFEA] border border-[#DFE5E2] shadow-2xs">
          <VipMedia
            src={product.imagen}
            alt={product.nombre}
            categoria={product.categoria}
            className="w-full h-full object-cover"
          />
        </div>

        {product.descripcion && (
          <p className="font-body-md text-xs sm:text-sm text-[#4E5C56] leading-relaxed">
            {product.descripcion}
          </p>
        )}

        {/* Option groups */}
        {product.gruposOpciones && product.gruposOpciones.length > 0 && (
          <div className="flex flex-col gap-4 pt-3 border-t border-[#E9EFEB]">
            {product.gruposOpciones.map((grp) => (
              <div key={grp.id} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-headline-md text-xs font-bold uppercase tracking-wider text-[#111614]">
                    {grp.titulo}
                  </span>
                  {grp.requerido && (
                    <span className="font-label-sm text-[10px] text-[#9E7844] font-bold">
                      Obligatorio
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {grp.opciones.map((opt) => {
                    const isSelected =
                      selectedOptions[grp.titulo]?.opcionNombre === opt.nombre;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          handleSelectOption(grp.titulo, opt.id, opt.nombre, opt.precioExtra)
                        }
                        className={`
                          p-3 rounded-xl border flex items-center justify-between text-xs font-label-md transition-all cursor-pointer select-none text-left min-h-[44px]
                          ${
                            isSelected
                              ? "bg-[#187B56]/10 text-[#187B56] border-[#187B56] font-bold shadow-2xs"
                              : "bg-[#F6F8F7] text-[#111614] border-[#DFE5E2] hover:bg-[#ECEFEA]"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-[#187B56] bg-[#187B56] text-white"
                                : "border-[#CBD5D0] bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <span className="truncate">{opt.nombre}</span>
                        </div>
                        {opt.precioExtra > 0 && (
                          <span className="font-bold text-[#187B56] shrink-0 ml-1">
                            +${opt.precioExtra}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes to chef */}
        <div className="flex flex-col gap-1.5 pt-3 border-t border-[#E9EFEB]">
          <label className="font-headline-md text-xs font-bold text-[#111614]">
            Instrucciones para la cocina / barra
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Ej. Sin hielo, aderezo aparte, bien caliente..."
            rows={2}
            className="w-full bg-[#F6F8F7] border border-[#DFE5E2] rounded-xl p-3 text-xs text-[#111614] placeholder:text-[#7E8E87] focus:border-[#187B56] focus:outline-none focus:ring-1 focus:ring-[#187B56] transition-all resize-none font-body-md"
          />
        </div>

        {/* Quantity selector & Add Button */}
        <div className="pt-3.5 border-t border-[#E9EFEB] flex items-center gap-3">
          <div className="flex items-center bg-[#F6F8F7] border border-[#DFE5E2] rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 rounded-lg bg-white hover:bg-[#ECEFEA] flex items-center justify-center text-[#111614] transition-colors cursor-pointer shadow-2xs disabled:opacity-40"
              disabled={quantity <= 1}
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-headline-md text-sm font-extrabold text-[#111614]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-9 h-9 rounded-lg bg-white hover:bg-[#ECEFEA] flex items-center justify-center text-[#111614] transition-colors cursor-pointer shadow-2xs"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <VipButton
            onClick={handleConfirm}
            variant="primary"
            size="md"
            fullWidth
            disabled={product.disponible === false}
            className="text-xs sm:text-sm font-extrabold shadow-md"
          >
            {product.disponible === false ? "Agotado" : `Agregar por $${itemTotal}.00 MXN`}
          </VipButton>
        </div>
      </div>
    </VipModal>
  );
};

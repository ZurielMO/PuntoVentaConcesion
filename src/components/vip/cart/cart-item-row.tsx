"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { VipCartItem } from "@/lib/vip/types";
import { formatVipPrice } from "@/lib/vip/money";
import { categoryKeyFromLabel, commentPlaceholder } from "@/lib/vip/catalog";
import { VipMedia } from "../ui/media";
import { VipQuantityStepper } from "../ui/quantity-stepper";

interface CartItemRowProps {
  item: VipCartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateInstructions: (id: string, instrucciones: string) => void;
  onRemove: (id: string) => void;
  /** Aviso de disponibilidad para este artículo (p. ej. sin existencia para entrega inmediata). */
  warning?: string;
}

export const VipCartItemRow: React.FC<CartItemRowProps> = ({ item, onUpdateQuantity, onUpdateInstructions, onRemove, warning }) => {
  const notesId = useId();
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notes = item.instrucciones || "";
  const isDrink = categoryKeyFromLabel(item.producto.categoria) === "bebidas";
  const options = (item.opcionesSeleccionadas || []).map((option) =>
    option.precioExtra > 0 ? `${option.opcionNombre} (+${formatVipPrice(option.precioExtra)})` : option.opcionNombre,
  );

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4">
      <div className="size-16 shrink-0 overflow-hidden rounded-[var(--radius-palco-md)] border border-palco-line bg-palco-surface sm:size-20">
        <VipMedia src={item.producto.imagen} alt="" categoria={item.producto.categoria} fit="cover" className="size-full" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-palco-ink">{item.producto.nombre}</h3>
          <span className="palco-num shrink-0 font-palco-display text-[15px] font-bold text-palco-ink">
            {formatVipPrice(item.subtotal)}
          </span>
        </div>
        {options.length > 0 && <p className="mt-0.5 text-[13px] text-palco-ink-3">{options.join(", ")}</p>}
        {item.cantidad > 1 && (
          <p className="palco-num mt-0.5 text-[13px] text-palco-ink-3">{formatVipPrice(item.precioUnitario)} c/u</p>
        )}
        {warning && <p className="mt-1 text-[13px] font-medium text-palco-warning">{warning}</p>}

        {editing || notes ? (
          <div className="mt-2.5">
            <label htmlFor={notesId} className="sr-only">
              {isDrink ? "Indicaciones para la barra" : "Indicaciones para cocina"} de {item.producto.nombre}
            </label>
            <textarea
              ref={textareaRef}
              id={notesId}
              value={notes}
              onChange={(event) => onUpdateInstructions(item.id, event.target.value)}
              onBlur={() => setEditing(false)}
              maxLength={500}
              rows={2}
              placeholder={commentPlaceholder(item.producto)}
              className="w-full resize-none rounded-[var(--radius-palco-sm)] border border-palco-field bg-palco-surface px-3 py-2 text-base text-palco-ink outline-none transition-[border-color,box-shadow] focus:border-palco-700 focus:shadow-[0_0_0_3px_var(--color-palco-100)] sm:text-[15px]"
            />
          </div>
        ) : null}

        <div className="mt-2.5 flex items-center justify-between gap-3">
          {!editing && !notes ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Agregar indicaciones ${isDrink ? "para la barra" : "para cocina"}: ${item.producto.nombre}`}
              className="palco-press -ml-2 flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[13px] font-semibold text-palco-700 hover:bg-palco-50"
            >
              <MessageSquareText aria-hidden className="size-4" />
              Indicaciones
            </button>
          ) : (
            <span aria-hidden />
          )}
          <VipQuantityStepper
            size="sm"
            value={item.cantidad}
            label={item.producto.nombre}
            removeAtMin
            onChange={(next) => (next <= 0 ? onRemove(item.id) : onUpdateQuantity(item.id, next))}
          />
        </div>
      </div>
    </li>
  );
};

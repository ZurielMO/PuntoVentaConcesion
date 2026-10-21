"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { VipProduct, VipProductOptionGroup } from "@/lib/vip/types";
import { formatVipPrice } from "@/lib/vip/money";
import { categoryKeyFromLabel, commentPlaceholder } from "@/lib/vip/catalog";
import type { VipProductAvailability } from "@/lib/vip/availability";
import { VipModal } from "../ui/modal";
import { VipButton } from "../ui/button";
import { VipMedia } from "../ui/media";
import { VipQuantityStepper } from "../ui/quantity-stepper";

export type VipSelectedOption = { grupoTitulo: string; opcionNombre: string; precioExtra: number; id?: string };

interface ProductDetailModalProps {
  product: VipProduct | null;
  /** Nombre del establecimiento, para dar contexto cuando se abre desde inicio o búsqueda. */
  restaurantName?: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: VipProduct, quantity: number, selectedOptions: VipSelectedOption[], notes: string) => void;
  availability: VipProductAvailability;
}

type Selection = Record<string, string[]>;

const groupKind = (group: VipProductOptionGroup) => group.tipo || "single";

function initialSelection(product: VipProduct | null): Selection {
  const selection: Selection = {};
  for (const group of product?.gruposOpciones || []) {
    // Comportamiento existente: en los grupos de una sola opción la primera ya viene elegida.
    selection[group.id] = groupKind(group) === "single" && group.opciones[0] ? [group.opciones[0].id] : [];
  }
  return selection;
}

function groupRule(group: VipProductOptionGroup): string {
  if (groupKind(group) === "single") return group.requerido ? "Obligatorio · elige 1" : "Elige 1";
  const min = group.minSeleccion || (group.requerido ? 1 : 0);
  const max = group.maxSeleccion;
  if (max && min) return `Elige de ${min} a ${max}`;
  if (max) return `Opcional · hasta ${max}`;
  return min ? `Elige al menos ${min}` : "Opcional";
}

export const VipProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  restaurantName,
  isOpen,
  onClose,
  onAddToCart,
  availability,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<Selection>({});
  const [notes, setNotes] = useState("");
  const [missingGroup, setMissingGroup] = useState<string | null>(null);
  const notesId = useId();
  const groupRefs = useRef<Record<string, HTMLFieldSetElement | null>>({});

  // Cada apertura empieza limpia, aunque sea el mismo producto.
  useEffect(() => {
    if (!product || !isOpen) return;
    setQuantity(1);
    setNotes("");
    setMissingGroup(null);
    setSelection(initialSelection(product));
  }, [product, isOpen]);

  const groups = useMemo(() => product?.gruposOpciones || [], [product]);

  const selectedOptions: VipSelectedOption[] = useMemo(
    () =>
      groups.flatMap((group) =>
        (selection[group.id] || []).flatMap((optionId) => {
          const option = group.opciones.find((row) => row.id === optionId);
          return option ? [{ grupoTitulo: group.titulo, id: option.id, opcionNombre: option.nombre, precioExtra: option.precioExtra }] : [];
        }),
      ),
    [groups, selection],
  );

  if (!product) return null;

  const extras = selectedOptions.reduce((sum, option) => sum + option.precioExtra, 0);
  const lineTotal = (product.precio + extras) * quantity;
  const isDrink = categoryKeyFromLabel(product.categoria) === "bebidas";
  const description = product.descripcion.trim();

  const toggle = (group: VipProductOptionGroup, optionId: string) => {
    setMissingGroup(null);
    setSelection((prev) => {
      const current = prev[group.id] || [];
      if (groupKind(group) === "single") return { ...prev, [group.id]: [optionId] };
      if (current.includes(optionId)) return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      if (group.maxSeleccion && current.length >= group.maxSeleccion) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  };

  const handleConfirm = () => {
    if (!availability.canAdd) return;
    const missing = groups.find((group) => {
      const min = groupKind(group) === "single" ? (group.requerido ? 1 : 0) : group.minSeleccion || (group.requerido ? 1 : 0);
      return (selection[group.id] || []).length < min;
    });
    if (missing) {
      setMissingGroup(missing.id);
      groupRefs.current[missing.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onAddToCart(product, quantity, selectedOptions, notes.trim());
  };

  let addLabel = `Agregar · ${formatVipPrice(lineTotal)}`;
  if (availability.state === "closed" || availability.state === "sold-out") addLabel = availability.label;
  if (availability.state === "loading") addLabel = "Consultando disponibilidad…";

  return (
    <VipModal
      isOpen={isOpen}
      onClose={onClose}
      title={product.nombre}
      maxWidth="lg"
      media={
        <div className="relative aspect-[4/3] w-full bg-palco-surface sm:aspect-[16/10]">
          <VipMedia
            src={product.imagen}
            alt={product.nombre}
            categoria={product.categoria}
            fit="contain"
            priority
            className="size-full"
          />
        </div>
      }
      footer={
        <div className="flex items-center gap-3">
          <VipQuantityStepper
            value={quantity}
            onChange={(next) => setQuantity(Math.max(1, next))}
            label={product.nombre}
            disabled={!availability.canAdd}
          />
          <VipButton
            onClick={handleConfirm}
            size="lg"
            fullWidth
            disabled={!availability.canAdd}
            className="palco-num min-w-0"
            data-testid="product-add"
          >
            <span className="truncate">{addLabel}</span>
          </VipButton>
        </div>
      }
    >
      <div className="-mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="palco-num font-palco-display text-xl font-bold text-palco-ink">{formatVipPrice(product.precio)}</span>
        {restaurantName && <span className="text-sm text-palco-ink-3">{restaurantName}</span>}
        {availability.label && availability.state === "preorder-only" && (
          <span className="rounded-full bg-palco-warning-50 px-2.5 py-0.5 text-xs font-semibold text-palco-warning">
            {availability.label}
          </span>
        )}
      </div>

      {description && <p className="whitespace-pre-line text-[15px] leading-relaxed text-palco-ink-2">{description}</p>}

      {groups.map((group) => {
        const kind = groupKind(group);
        const chosen = selection[group.id] || [];
        const invalid = missingGroup === group.id;
        return (
          <div key={group.id} className="border-t border-palco-line pt-4">
          <fieldset
            ref={(node) => {
              groupRefs.current[group.id] = node;
            }}
            className="min-w-0"
            aria-invalid={invalid || undefined}
          >
            <legend className="flex w-full items-baseline justify-between gap-3">
              <span className="font-palco-display text-base font-bold text-palco-ink">{group.titulo}</span>
              <span className={`text-xs font-semibold ${invalid ? "text-palco-danger" : "text-palco-ink-3"}`}>
                {invalid ? "Elige una opción para continuar" : groupRule(group)}
              </span>
            </legend>
            <div className="mt-3 flex flex-col">
              {group.opciones.map((option) => {
                const checked = chosen.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-palco-line py-2 last:border-b-0"
                  >
                    <input
                      type={kind === "single" ? "radio" : "checkbox"}
                      name={`group-${group.id}`}
                      checked={checked}
                      onChange={() => toggle(group, option.id)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className={`flex size-5 shrink-0 items-center justify-center border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-palco-700 ${
                        kind === "single" ? "rounded-full" : "rounded-md"
                      } ${checked ? "border-palco-700 bg-palco-700 text-white" : "border-palco-field bg-palco-surface"}`}
                    >
                      {checked && (kind === "single" ? <span className="size-2 rounded-full bg-white" /> : <Check className="size-3.5 stroke-[3]" />)}
                    </span>
                    <span className="flex-1 text-[15px] text-palco-ink">{option.nombre}</span>
                    <span className="palco-num text-sm text-palco-ink-3">
                      {option.precioExtra > 0 ? `+${formatVipPrice(option.precioExtra)}` : "Sin costo"}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          </div>
        );
      })}

      <div className="border-t border-palco-line pt-4">
        <label htmlFor={notesId} className="font-palco-display text-base font-bold text-palco-ink">
          {isDrink ? "Indicaciones para la barra" : "Indicaciones para cocina"}
        </label>
        <p className="mt-0.5 text-sm text-palco-ink-3">Opcional. Se imprime en el ticket de tu pedido.</p>
        <textarea
          id={notesId}
          value={notes}
          onChange={(event) => setNotes(event.target.value.slice(0, 500))}
          placeholder={commentPlaceholder(product)}
          rows={2}
          maxLength={500}
          className="mt-2.5 w-full resize-none rounded-[var(--radius-palco-md)] border border-palco-field bg-palco-surface px-3.5 py-3 text-base text-palco-ink outline-none transition-[border-color,box-shadow] focus:border-palco-700 focus:shadow-[0_0_0_3px_var(--color-palco-100)]"
        />
        {notes.length > 400 && <p className="palco-num mt-1 text-right text-xs text-palco-ink-3">{notes.length}/500</p>}
      </div>
    </VipModal>
  );
};

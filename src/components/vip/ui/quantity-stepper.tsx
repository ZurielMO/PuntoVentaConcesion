"use client";

import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

interface VipQuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  /** Nombre del producto para las etiquetas accesibles. */
  label: string;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  /** En el carrito, bajar de 1 elimina: el botón lo dice con un bote de basura. */
  removeAtMin?: boolean;
  disabled?: boolean;
}

export function VipQuantityStepper({
  value,
  onChange,
  label,
  min = 1,
  max = 99,
  size = "md",
  removeAtMin = false,
  disabled = false,
}: VipQuantityStepperProps) {
  const button =
    size === "sm"
      ? "size-9"
      : "size-11";
  const atMin = value <= min;
  const showRemove = removeAtMin && atMin;

  return (
    <div
      role="group"
      aria-label={`Cantidad de ${label}`}
      className={`inline-flex shrink-0 items-center rounded-full border border-palco-line bg-palco-surface ${size === "sm" ? "p-0.5" : "p-1"}`}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || (atMin && !removeAtMin)}
        aria-label={showRemove ? `Quitar ${label}` : `Quitar uno de ${label}`}
        className={`palco-press flex ${button} items-center justify-center rounded-full text-palco-ink hover:bg-palco-sunken disabled:text-palco-line-strong disabled:hover:bg-transparent ${
          showRemove ? "text-palco-danger" : ""
        }`}
      >
        {showRemove ? <Trash2 aria-hidden className="size-4" /> : <Minus aria-hidden className="size-4" />}
      </button>
      <span
        aria-live="polite"
        className={`palco-num text-center font-palco-display font-bold text-palco-ink ${size === "sm" ? "w-7 text-sm" : "w-9 text-base"}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Agregar uno más de ${label}`}
        className={`palco-press flex ${button} items-center justify-center rounded-full text-palco-ink hover:bg-palco-sunken disabled:text-palco-line-strong disabled:hover:bg-transparent`}
      >
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}

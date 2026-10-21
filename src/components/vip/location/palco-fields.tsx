"use client";

import React, { useId } from "react";
import { floorsForZone, VIP_STADIUM_ZONES, vipFloorLabel, type StadiumZone } from "@/lib/vip/types";

export interface VipPalcoValue {
  zona: StadiumZone | "";
  nivel: string;
  palco: string;
}

export interface VipPalcoErrors {
  zona?: string;
  nivel?: string;
  palco?: string;
}

const segment = (selected: boolean) =>
  `palco-press flex min-h-12 flex-1 items-center justify-center rounded-full border px-3 font-palco-display text-[15px] font-bold ${
    selected
      ? "border-palco-900 bg-palco-900 text-palco-on-dark"
      : "border-palco-line-strong bg-palco-surface text-palco-ink hover:border-palco-ink-3"
  }`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-palco-danger">
      {message}
    </p>
  );
}

/** Zona, piso y número de palco. El estadio solo tiene Oriente (pisos 1-3) y Poniente (pisos 1-2). */
export function VipPalcoFields({
  value,
  onChange,
  errors = {},
  onBlurField,
}: {
  value: VipPalcoValue;
  onChange: (next: VipPalcoValue) => void;
  errors?: VipPalcoErrors;
  onBlurField?: (field: keyof VipPalcoValue) => void;
}) {
  const id = useId();
  const floors = value.zona ? floorsForZone(value.zona) : [];

  const pickZone = (zona: StadiumZone) => {
    const current = Number(String(value.nivel || "").match(/\d+/)?.[0]);
    onChange({ ...value, zona, nivel: floorsForZone(zona).includes(current) ? vipFloorLabel(current) : "" });
    onBlurField?.("zona");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p id={`${id}-zona`} className="mb-2 text-sm font-semibold text-palco-ink-2">
          Zona
        </p>
        <div
          role="radiogroup"
          aria-labelledby={`${id}-zona`}
          aria-describedby={errors.zona ? `${id}-zona-error` : undefined}
          className={`flex gap-2 rounded-full ${errors.zona ? "ring-2 ring-palco-danger/60 ring-offset-2" : ""}`}
          data-field="zona"
        >
          {VIP_STADIUM_ZONES.map((zona) => (
            <button
              key={zona}
              type="button"
              role="radio"
              aria-checked={value.zona === zona}
              onClick={() => pickZone(zona)}
              className={segment(value.zona === zona)}
            >
              {zona}
            </button>
          ))}
        </div>
        <FieldError id={`${id}-zona-error`} message={errors.zona} />
      </div>

      <div>
        <p id={`${id}-piso`} className="mb-2 text-sm font-semibold text-palco-ink-2">
          Piso
        </p>
        {value.zona ? (
          <div
            role="radiogroup"
            aria-labelledby={`${id}-piso`}
            aria-describedby={errors.nivel ? `${id}-piso-error` : undefined}
            className={`flex gap-2 rounded-full ${errors.nivel ? "ring-2 ring-palco-danger/60 ring-offset-2" : ""}`}
            data-field="nivel"
          >
            {floors.map((floor) => {
              const label = vipFloorLabel(floor);
              return (
                <button
                  key={floor}
                  type="button"
                  role="radio"
                  aria-checked={value.nivel === label}
                  onClick={() => {
                    onChange({ ...value, nivel: label });
                    onBlurField?.("nivel");
                  }}
                  className={segment(value.nivel === label)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="flex min-h-12 items-center rounded-full border border-dashed border-palco-line-strong bg-palco-ground px-5 text-sm text-palco-ink-3" data-field="nivel">
            Elige la zona para ver sus pisos
          </p>
        )}
        <FieldError id={`${id}-piso-error`} message={errors.nivel} />
      </div>

      <div>
        <label htmlFor={`${id}-palco`} className="mb-2 block text-sm font-semibold text-palco-ink-2">
          Número de palco
        </label>
        <input
          id={`${id}-palco`}
          value={value.palco}
          onChange={(event) => onChange({ ...value, palco: event.target.value.slice(0, 12) })}
          onBlur={() => onBlurField?.("palco")}
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="Ej. 124"
          aria-invalid={Boolean(errors.palco) || undefined}
          aria-describedby={errors.palco ? `${id}-palco-error` : undefined}
          data-field="palco"
          className={`palco-num h-14 w-full rounded-[var(--radius-palco-md)] border bg-palco-surface px-4 font-palco-display text-lg font-bold text-palco-ink outline-none transition-[border-color,box-shadow] placeholder:font-palco-sans placeholder:text-base placeholder:font-normal focus:border-palco-700 focus:shadow-[0_0_0_3px_var(--color-palco-100)] ${
            errors.palco ? "border-palco-danger" : "border-palco-field"
          }`}
        />
        <FieldError id={`${id}-palco-error`} message={errors.palco} />
      </div>
    </div>
  );
}

export function validatePalco(value: VipPalcoValue): VipPalcoErrors {
  const errors: VipPalcoErrors = {};
  if (value.zona !== "Oriente" && value.zona !== "Poniente") errors.zona = "Elige Oriente o Poniente.";
  else if (!value.nivel) errors.nivel = value.zona === "Oriente" ? "Elige el piso 1, 2 o 3." : "Elige el piso 1 o 2.";
  if (!value.palco.trim()) errors.palco = "Escribe el número de tu palco.";
  return errors;
}

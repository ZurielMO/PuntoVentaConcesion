"use client";

import React, { useEffect, useState } from "react";
import { VipModal } from "../ui/modal";
import { VipButton } from "../ui/button";
import { VipPalcoFields, validatePalco, type VipPalcoErrors, type VipPalcoValue } from "./palco-fields";
import { useVipSavedPalco } from "@/hooks/vip/use-vip-saved-palco";

export function VipRememberPalco({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-palco-md)] bg-palco-ground px-4 py-3.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-palco-700)]"
      />
      <span className="text-sm leading-snug text-palco-ink-2">
        <span className="block font-semibold text-palco-ink">Recordar mi palco en este dispositivo</span>
        Solo se guardan la zona, el piso y el número. Puedes cambiarlo o borrarlo cuando quieras.
      </span>
    </label>
  );
}

export function VipPalcoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { palco, remembered, save, forget } = useVipSavedPalco();
  const [value, setValue] = useState<VipPalcoValue>({ zona: "", nivel: "", palco: "" });
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<VipPalcoErrors>({});

  useEffect(() => {
    if (!open) return;
    setValue(palco ? { ...palco } : { zona: "", nivel: "", palco: "" });
    setRemember(remembered);
    setErrors({});
  }, [open, palco, remembered]);

  const submit = () => {
    const nextErrors = validatePalco(value);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !value.zona) return;
    save({ zona: value.zona, nivel: value.nivel, palco: value.palco }, remember);
    onClose();
  };

  return (
    <VipModal
      isOpen={open}
      onClose={onClose}
      title="¿A qué palco te lo llevamos?"
      description="Lo usamos al pagar para la entrega. Puedes cambiarlo en ese momento."
      maxWidth="md"
      footer={
        <div className="flex flex-col gap-2">
          <VipButton size="lg" fullWidth onClick={submit}>
            Guardar palco
          </VipButton>
          {palco && (
            <button
              type="button"
              onClick={() => {
                forget();
                onClose();
              }}
              className="palco-press min-h-11 rounded-full text-sm font-semibold text-palco-ink-2 hover:bg-palco-sunken"
            >
              Borrar palco guardado
            </button>
          )}
        </div>
      }
    >
      <VipPalcoFields
        value={value}
        onChange={(next) => {
          setValue(next);
          if (Object.keys(errors).length) setErrors(validatePalco(next));
        }}
        errors={errors}
      />
      <VipRememberPalco checked={remember} onChange={setRemember} />
    </VipModal>
  );
}

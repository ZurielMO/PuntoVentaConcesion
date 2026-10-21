"use client";

import React from "react";
import type { StadiumZone } from "@/lib/vip/types";
import { isValidMxPhone } from "@/lib/vip/phone";
import { VipTextField } from "./checkout-section";

export type VipCheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  zona: StadiumZone | "";
  palco: string;
  nivel: string;
};

export type VipContactErrors = Partial<Record<"name" | "email" | "phone", string>>;

// Mismas reglas que ya aplicaba el checkout.
export function validateContact(details: Pick<VipCheckoutDetails, "name" | "email" | "phone">): VipContactErrors {
  const errors: VipContactErrors = {};
  const email = details.email.trim();
  if (details.name.trim().length < 2) errors.name = "Escribe el nombre de quien recibe en el palco.";
  if (!email) errors.email = "Escribe tu correo: ahí llegan la confirmación y la guía.";
  else if (!email.includes("@") || !email.split("@")[1]?.includes(".")) errors.email = "Revisa el correo, por ejemplo nombre@correo.com.";
  if (!details.phone.trim()) errors.phone = "Escribe un teléfono para contactarte en el palco.";
  else if (!isValidMxPhone(details.phone)) errors.phone = "El teléfono debe tener 10 dígitos.";
  return errors;
}

/** Datos de contacto de quien recibe. */
export function VipCheckoutDetailsCard({
  value,
  onChange,
  errors = {},
  onBlurField,
}: {
  value: VipCheckoutDetails;
  onChange: (next: VipCheckoutDetails) => void;
  errors?: VipContactErrors;
  onBlurField?: (field: "name" | "email" | "phone") => void;
  /** @deprecated Los pasos numerados ya no se muestran. */
  totalSteps?: number;
}) {
  const set = (patch: Partial<VipCheckoutDetails>) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <VipTextField
        id="name"
        label="Nombre de quien recibe"
        className="sm:col-span-2"
        value={value.name}
        onChange={(event) => set({ name: event.target.value })}
        onBlur={() => onBlurField?.("name")}
        autoComplete="name"
        autoCapitalize="words"
        enterKeyHint="next"
        placeholder="Nombre y apellido"
        error={errors.name}
      />
      <VipTextField
        id="email"
        label="Correo electrónico"
        type="email"
        inputMode="email"
        value={value.email}
        onChange={(event) => set({ email: event.target.value })}
        onBlur={() => onBlurField?.("email")}
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="next"
        placeholder="nombre@correo.com"
        hint="Aquí te llegan la confirmación y la guía del pedido."
        error={errors.email}
      />
      <VipTextField
        id="phone"
        label="Teléfono"
        type="tel"
        inputMode="tel"
        value={value.phone}
        onChange={(event) => set({ phone: event.target.value })}
        onBlur={() => onBlurField?.("phone")}
        autoComplete="tel"
        enterKeyHint="done"
        placeholder="477 123 4567"
        hint="10 dígitos, por si necesitamos contactarte durante la entrega."
        error={errors.phone}
      />
    </div>
  );
}

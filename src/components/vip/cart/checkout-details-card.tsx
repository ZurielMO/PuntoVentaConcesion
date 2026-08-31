"use client";

import React from "react";
import { Armchair, Mail, User, Phone } from "lucide-react";
import { floorsForZone, VIP_STADIUM_ZONES, vipFloorLabel, type StadiumZone } from "@/lib/vip/types";

export type VipCheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  zona: StadiumZone | "";
  palco: string;
  nivel: string;
};

const inputBaseClass =
  "w-full h-12 px-3.5 rounded-xl border border-[#DFE5E2] bg-[#F6F8F7] text-sm font-medium text-[#111614] placeholder:text-[#8A9992] transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#187B56]/25 focus:border-[#187B56]";

export function VipCheckoutDetailsCard({
  value,
  onChange,
}: {
  value: VipCheckoutDetails;
  onChange: (next: VipCheckoutDetails) => void;
}) {
  const set = (patch: Partial<VipCheckoutDetails>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-4">
      {/* Group 1: Contact Information */}
      <section className="bg-white rounded-[20px] p-5 border border-[#DFE5E2] shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-[#E9EFEB] pb-3">
          <div className="w-10 h-10 rounded-xl bg-[#187B56]/10 text-[#187B56] flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="font-label-sm text-[10px] text-[#9E7844] uppercase tracking-wider font-extrabold">
              Paso 1 de 2
            </span>
            <h3 className="font-headline-md text-sm sm:text-base font-extrabold text-[#111614] tracking-tight">
              Datos de Contacto
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-[#4E5C56] mb-1.5">
              Nombre de quien recibe en el palco
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8E87] pointer-events-none" />
              <input
                className={`${inputBaseClass} pl-10`}
                value={value.name}
                onChange={(e) => set({ name: e.target.value })}
                autoComplete="name"
                placeholder="Ej. Carlos Martínez"
              />
            </div>
          </div>

          {/* Correo */}
          <div>
            <label className="block text-xs font-bold text-[#4E5C56] mb-1.5">
              Correo electrónico (para tu recibo de Stripe)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8E87] pointer-events-none" />
              <input
                className={`${inputBaseClass} pl-10`}
                type="email"
                value={value.email}
                onChange={(e) => set({ email: e.target.value })}
                autoComplete="email"
                placeholder="carlos@ejemplo.com"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-[#4E5C56] mb-1.5">
              Teléfono de contacto (obligatorio)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8E87] pointer-events-none" />
              <input
                className={`${inputBaseClass} pl-10`}
                type="tel"
                inputMode="tel"
                value={value.phone}
                onChange={(e) => set({ phone: e.target.value })}
                autoComplete="tel"
                placeholder="477 123 4567"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Group 2: Stadium Delivery Location */}
      <section className="bg-white rounded-[20px] p-5 border border-[#DFE5E2] shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-[#E9EFEB] pb-3">
          <div className="w-10 h-10 rounded-xl bg-[#9E7844]/15 text-[#9E7844] flex items-center justify-center shrink-0">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <span className="font-label-sm text-[10px] text-[#9E7844] uppercase tracking-wider font-extrabold">
              Paso 2 de 2
            </span>
            <h3 className="font-headline-md text-sm sm:text-base font-extrabold text-[#111614] tracking-tight">
              Ubicación en el Estadio León
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Zona */}
            <div>
              <label className="block text-xs font-bold text-[#4E5C56] mb-1.5">
                Zona del Estadio
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VIP_STADIUM_ZONES.map((zona) => {
                  const selected = value.zona === zona;
                  return (
                    <button
                      key={zona}
                      type="button"
                      onClick={() => {
                        const floors = floorsForZone(zona);
                        const current = Number(String(value.nivel || "").match(/\d+/)?.[0]);
                        set({
                          zona,
                          nivel: floors.includes(current) ? vipFloorLabel(current) : "",
                        });
                      }}
                      className={`h-12 rounded-xl border font-extrabold text-sm transition-all ${
                        selected
                          ? "bg-[#187B56] text-white border-[#187B56] shadow-sm"
                          : "bg-[#F6F8F7] text-[#111614] border-[#DFE5E2] hover:border-[#187B56]"
                      }`}
                    >
                      {zona}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Palco */}
            <div>
              <label className="block text-xs font-bold text-[#4E5C56] mb-1.5">
                Número de Palco
              </label>
              <input
                className={`${inputBaseClass} font-bold text-base`}
                value={value.palco}
                onChange={(e) => set({ palco: e.target.value })}
                inputMode="numeric"
                placeholder="Ej. 124"
              />
            </div>
          </div>

          {/* Piso */}
          <div>
            <label className="block text-xs font-bold text-[#4E5C56] mb-1.5">
              Piso {value.zona ? `(${value.zona})` : ""} — obligatorio
            </label>
            {value.zona ? (
              <div className={`grid gap-2 ${value.zona === "Oriente" ? "grid-cols-3" : "grid-cols-2"}`}>
                {floorsForZone(value.zona).map((floor) => {
                  const label = vipFloorLabel(floor);
                  const selected = value.nivel === label;
                  return (
                    <button
                      key={floor}
                      type="button"
                      onClick={() => set({ nivel: label })}
                      className={`h-12 rounded-xl border font-extrabold text-sm transition-all ${
                        selected
                          ? "bg-[#187B56] text-white border-[#187B56] shadow-sm"
                          : "bg-[#F6F8F7] text-[#111614] border-[#DFE5E2] hover:border-[#187B56]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#7E8E87] bg-[#F6F8F7] border border-[#DFE5E2] rounded-xl px-3.5 py-3">
                Elige Oriente o Poniente para ver los pisos disponibles.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

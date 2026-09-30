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
  "w-full min-h-[50px] px-4 rounded-xl border border-[#E5EBE8] bg-[#F8FAF9] text-base font-semibold text-[#111827] placeholder:text-[#9CA3AF] transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D4A34]/15 focus:border-[#0D4A34]";

export function VipCheckoutDetailsCard({
  value,
  onChange,
  totalSteps = 2,
}: {
  value: VipCheckoutDetails;
  onChange: (next: VipCheckoutDetails) => void;
  totalSteps?: number;
}) {
  const set = (patch: Partial<VipCheckoutDetails>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-4">
      {/* Group 1: Contact Information */}
      <section className="bg-white rounded-2xl sm:rounded-[24px] p-5 sm:p-6 border border-[#E5EBE8] shadow-[0_4px_20px_rgba(6,46,32,0.04)] flex flex-col gap-4">
        <div className="flex items-center gap-3.5 border-b border-[#EEF2F0] pb-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0D4A34]/8 text-[#0D4A34] flex items-center justify-center shrink-0 border border-[#0D4A34]/15 shadow-xs">
            <User className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-[#A67C2E] uppercase tracking-wider font-bold">
              Paso 1 de {totalSteps}
            </span>
            <h3 className="font-[family-name:var(--font-montserrat)] text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
              Datos de Contacto
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-[#374151] mb-2">
              Nombre de quien recibe en el palco
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" />
              <input
                className={`${inputBaseClass} pl-12`}
                value={value.name}
                onChange={(e) => set({ name: e.target.value })}
                autoComplete="name"
                placeholder="Nombre y Apellido"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-[#374151] mb-2">
              Correo electrónico (aquí recibirás la confirmación y guía)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" />
              <input
                className={`${inputBaseClass} pl-12`}
                type="email"
                inputMode="email"
                value={value.email}
                onChange={(e) => set({ email: e.target.value })}
                autoComplete="email"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-[#374151] mb-2">
              Teléfono de contacto (10 dígitos)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" />
              <input
                className={`${inputBaseClass} pl-12`}
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
      <section className="bg-white rounded-2xl sm:rounded-[24px] p-5 sm:p-6 border border-[#E5EBE8] shadow-[0_4px_20px_rgba(6,46,32,0.04)] flex flex-col gap-4">
        <div className="flex items-center gap-3.5 border-b border-[#EEF2F0] pb-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0D4A34]/8 text-[#0D4A34] flex items-center justify-center shrink-0 border border-[#0D4A34]/15 shadow-xs">
            <Armchair className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-[#A67C2E] uppercase tracking-wider font-bold">
              Paso 2 de {totalSteps}
            </span>
            <h3 className="font-[family-name:var(--font-montserrat)] text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
              Ubicación en el Estadio León
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Zona */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-[#374151] mb-2">
                Zona del Estadio
              </label>
              <div className="grid grid-cols-2 gap-2.5">
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
                      className={`min-h-[50px] rounded-xl border font-bold text-base transition-all cursor-pointer font-[family-name:var(--font-montserrat)] ${
                        selected
                          ? "bg-[#062E20] text-white border-[#062E20] shadow-sm"
                          : "bg-[#F8FAF9] text-[#111827] border-[#E5EBE8] hover:border-[#0D4A34]/40"
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
              <label className="block text-sm sm:text-base font-bold text-[#374151] mb-2">
                Número de Palco
              </label>
              <input
                className={`${inputBaseClass} font-bold text-base sm:text-lg`}
                value={value.palco}
                onChange={(e) => set({ palco: e.target.value })}
                inputMode="numeric"
                placeholder="Ej. 124"
              />
            </div>
          </div>

          {/* Piso */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-[#374151] mb-2">
              Piso {value.zona ? `(${value.zona})` : ""} — obligatorio
            </label>
            {value.zona ? (
              <div className={`grid gap-2.5 ${value.zona === "Oriente" ? "grid-cols-3" : "grid-cols-2"}`}>
                {floorsForZone(value.zona).map((floor) => {
                  const label = vipFloorLabel(floor);
                  const selected = value.nivel === label;
                  return (
                    <button
                      key={floor}
                      type="button"
                      onClick={() => set({ nivel: label })}
                      className={`min-h-[50px] rounded-xl border font-bold text-base transition-all cursor-pointer font-[family-name:var(--font-montserrat)] ${
                        selected
                          ? "bg-[#062E20] text-white border-[#062E20] shadow-sm"
                          : "bg-[#F8FAF9] text-[#111827] border-[#E5EBE8] hover:border-[#0D4A34]/40"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] bg-[#F8FAF9] border border-dashed border-[#E5EBE8] rounded-xl px-4 py-3.5 min-h-[50px] flex items-center font-medium">
                Elige Oriente o Poniente para ver los pisos disponibles.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

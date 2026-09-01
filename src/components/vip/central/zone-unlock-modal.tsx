"use client";

import React, { useState } from "react";
import { MapPin, Lock } from "lucide-react";
import { VIP_STADIUM_ZONES, type StadiumZone } from "@/lib/vip/types";
import { VipService } from "@/lib/vip/vip-service";
import { vipToast } from "@/hooks/vip/use-vip-toast";

interface VipCentralZoneUnlockProps {
  token?: string | null;
  title: string;
  description: string;
  confirmLabel?: string;
  currentZona?: StadiumZone | null;
  onUnlocked: (zona: StadiumZone) => void;
  onCancel?: () => void;
}

export const VipCentralZoneUnlock: React.FC<VipCentralZoneUnlockProps> = ({
  token,
  title,
  description,
  confirmLabel = "Confirmar zona",
  currentZona,
  onUnlocked,
  onCancel,
}) => {
  const [zona, setZona] = useState<StadiumZone | "">(currentZona || "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (zona !== "Oriente" && zona !== "Poniente") {
      vipToast.error("Elige Oriente o Poniente.");
      return;
    }
    if (!password.trim()) {
      vipToast.error("Escribe la contraseña de zona.");
      return;
    }
    setSubmitting(true);
    try {
      const unlocked = await VipService.unlockCentralZone(password, zona, token);
      onUnlocked(unlocked);
      setPassword("");
    } catch (error) {
      vipToast.error(error instanceof Error ? error.message : "Contraseña incorrecta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8E5] p-6 shadow-sm flex flex-col gap-4"
    >
      <div className="text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#187B56]/10 text-[#187B56] flex items-center justify-center mb-3">
          <MapPin className="w-6 h-6" />
        </div>
        <h2 className="font-headline-md text-2xl font-extrabold text-[#171A19] leading-tight">{title}</h2>
        <p className="text-lg text-[#66706B] mt-2 leading-snug">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {VIP_STADIUM_ZONES.map((option) => {
          const selected = zona === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setZona(option)}
              className={`min-h-[5.25rem] rounded-2xl border font-extrabold text-xl transition-all ${
                selected
                  ? "bg-[#187B56] text-white border-[#187B56] shadow-sm"
                  : "bg-[#F5F7F6] text-[#171A19] border-[#E2E8E5] hover:border-[#187B56]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-base font-bold text-[#4E5C56] flex items-center gap-1.5">
          <Lock className="w-5 h-5" />
          Contraseña de zona
        </span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-16 px-4 rounded-xl border border-[#DFE5E2] bg-[#F6F8F7] text-lg font-medium text-[#111614] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#187B56]/25 focus:border-[#187B56]"
          autoComplete="current-password"
          placeholder="Contraseña de Central"
        />
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-14 px-4 rounded-xl border border-[#E2E8E5] bg-white text-[#171A19] font-bold text-lg"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 h-14 px-4 rounded-xl bg-[#187B56] text-white font-bold text-lg disabled:opacity-60"
        >
          {submitting ? "Validando…" : confirmLabel}
        </button>
      </div>
    </form>
  );
};

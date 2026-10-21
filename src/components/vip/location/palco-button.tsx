"use client";

import React, { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { useVipSavedPalco } from "@/hooks/vip/use-vip-saved-palco";
import { VipPalcoSheet } from "./palco-sheet";

/** El palco como dirección de entrega, en la barra superior. */
export function VipPalcoButton() {
  const { palco } = useVipSavedPalco();
  const [open, setOpen] = useState(false);
  const short = palco ? `Palco ${palco.palco} · ${palco.zona === "Oriente" ? "Ote." : "Pte."}` : "Tu palco";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={palco ? `Entregar en palco ${palco.palco}, ${palco.zona}, ${palco.nivel}. Cambiar` : "Indicar mi palco de entrega"}
        className="palco-press flex h-10 max-w-[9.75rem] sm:max-w-[13rem] items-center gap-1.5 rounded-full bg-white/10 pl-3 pr-2.5 text-sm font-semibold text-palco-on-dark hover:bg-white/15"
      >
        <MapPin aria-hidden className={`size-4 shrink-0 ${palco ? "text-palco-gold" : "text-palco-on-dark-2"}`} />
        <span className="palco-num truncate">{short}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-palco-on-dark-2" />
      </button>
      <VipPalcoSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

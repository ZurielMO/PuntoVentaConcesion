"use client";

import React from "react";
import { Armchair } from "lucide-react";
import type { VipLocation } from "@/lib/vip/types";

interface SavedSeatsProps {
  locations: VipLocation[];
  onSelectSaved: (location: VipLocation) => void;
}

export const VipSavedSeats: React.FC<SavedSeatsProps> = ({ onSelectSaved, locations }) => {
  if (!locations.length) {
    return (
      <p className="text-xs text-[#66706B]">
        No hay palcos oficiales configurados. El backend debe tener `vip_locations` activos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-label-sm text-xs text-[#9E7844] uppercase tracking-wider font-bold">
        Palcos oficiales
      </span>
      <div className="flex flex-wrap gap-2">
        {locations.map((item) => (
          <button
            key={item.id || `${item.zona}-${item.palco}`}
            type="button"
            onClick={() => onSelectSaved(item)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F7F6] text-[#171A19] hover:text-[#187B56] border border-[#E2E8E5] hover:border-[#187B56] text-xs font-label-md transition-all cursor-pointer shadow-sm"
          >
            <Armchair className="w-3.5 h-3.5 text-[#187B56]" />
            <span>
              {item.zona} · Palco {item.palco}
              {item.nivel ? ` (${item.nivel})` : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

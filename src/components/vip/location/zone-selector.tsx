"use client";

import React from "react";
import { type StadiumZone } from "@/lib/vip/types";
import { motion } from "motion/react";

interface ZoneSelectorProps {
  selectedZone: StadiumZone | "";
  onSelectZone: (zone: StadiumZone) => void;
}

export const VipZoneSelector: React.FC<ZoneSelectorProps> = ({
  selectedZone,
  onSelectZone,
}) => {
  const zones: { id: StadiumZone; label: string; desc: string }[] = [
    { id: "Poniente", label: "Poniente", desc: "Palcos lado poniente" },
    { id: "Oriente", label: "Oriente", desc: "Palcos lado oriente" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {zones.map((z) => {
        const isSelected = selectedZone === z.id;
        return (
          <motion.button
            key={z.id}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => onSelectZone(z.id)}
            className={`
              p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none text-center
              ${
                isSelected
                  ? "bg-[#187B56] text-white border-[#187B56] shadow-sm font-bold"
                  : "bg-white text-[#171A19] border-[#E2E8E5] hover:border-[#187B56] hover:bg-[#F5F7F6]"
              }
            `}
          >
            <span className="font-headline-md text-base sm:text-lg">
              {z.label}
            </span>
            <span
              className={`text-[10px] font-label-sm leading-tight ${
                isSelected ? "text-white/80" : "text-[#66706B]"
              }`}
            >
              {z.desc}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

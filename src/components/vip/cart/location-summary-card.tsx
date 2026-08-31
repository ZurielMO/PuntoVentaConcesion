"use client";

import React from "react";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { useVipLocation } from "@/hooks/vip/use-vip-location";

export const VipLocationSummaryCard: React.FC = () => {
  const { location } = useVipLocation();

  return (
    <section className="bg-white rounded-2xl p-4 border border-[#E2E8E5] shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-[#187B56]/10 text-[#187B56] flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-label-sm text-[10px] text-[#9E7844] uppercase tracking-wider font-bold">
            Entregar en Palco
          </span>
          <h3 className="font-headline-md text-sm sm:text-base font-bold text-[#171A19] truncate">
            Zona {location.zona} · Palco {location.palco}
            {location.nivel ? ` (${location.nivel})` : ""}
          </h3>
        </div>
      </div>

      <Link
        href="/servicio-palcos/ubicacion"
        className="font-label-md text-xs font-bold text-[#187B56] hover:text-[#136244] flex items-center gap-1 shrink-0 p-2 hover:bg-[#F5F7F6] rounded-xl transition-colors cursor-pointer"
      >
        <span>Cambiar</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </section>
  );
};

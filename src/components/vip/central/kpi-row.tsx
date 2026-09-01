"use client";

import React from "react";
import { Sparkles, Bike, History } from "lucide-react";

interface KpiRowProps {
  newCount: number;
  onTheWayCount: number;
  historyCount: number;
}

export const KpiRow: React.FC<KpiRowProps> = ({
  newCount,
  onTheWayCount,
  historyCount,
}) => {
  return (
    <section className="grid grid-cols-3 gap-2 sm:gap-4">
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E2E8E5] shadow-sm flex items-center justify-between">
        <div>
          <p className="font-label-sm text-base text-[#66706B] uppercase font-bold tracking-wider">
            Nuevos
          </p>
          <p className="font-headline-lg text-3xl font-extrabold text-[#D99721] mt-1">
            {newCount}
          </p>
        </div>
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#D99721]/15 text-[#D99721] flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E2E8E5] shadow-sm flex items-center justify-between">
        <div>
          <p className="font-label-sm text-base text-[#66706B] uppercase font-bold tracking-wider">
            En camino
          </p>
          <p className="font-headline-lg text-3xl font-extrabold text-[#3978A8] mt-1">
            {onTheWayCount}
          </p>
        </div>
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#3978A8]/15 text-[#3978A8] flex items-center justify-center">
          <Bike className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E2E8E5] shadow-sm flex items-center justify-between">
        <div>
          <p className="font-label-sm text-base text-[#66706B] uppercase font-bold tracking-wider">
            Historial
          </p>
          <p className="font-headline-lg text-3xl font-extrabold text-[#187B56] mt-1">
            {historyCount}
          </p>
        </div>
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#187B56]/15 text-[#187B56] flex items-center justify-center">
          <History className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
};

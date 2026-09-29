"use client";

import React from "react";
import { Sparkles, Bike, History, CalendarClock } from "lucide-react";

export type CentralTab = "nuevas" | "camino" | "preventas" | "historial";

interface CentralTabsProps {
  tab: CentralTab;
  onChange: (tab: CentralTab) => void;
  newCount: number;
  onTheWayCount: number;
  preorderCount: number;
  /** Preventas que llegaron mientras la pestaña no estaba abierta. */
  preorderUnseen?: number;
  historyCount: number;
}

const ITEMS: Array<{
  id: CentralTab;
  label: string;
  icon: typeof Sparkles;
  activeClass: string;
  badgeClass: string;
}> = [
  {
    id: "nuevas",
    label: "Nuevas",
    icon: Sparkles,
    activeClass: "text-[#D99721]",
    badgeClass: "bg-[#D99721] text-white",
  },
  {
    id: "camino",
    label: "En camino",
    icon: Bike,
    activeClass: "text-[#3978A8]",
    badgeClass: "bg-[#3978A8] text-white",
  },
  {
    id: "preventas",
    label: "Preventas",
    icon: CalendarClock,
    activeClass: "text-[#9E7844]",
    badgeClass: "bg-[#9E7844] text-white",
  },
  {
    id: "historial",
    label: "Historial",
    icon: History,
    activeClass: "text-[#187B56]",
    badgeClass: "bg-[#187B56] text-white",
  },
];

export const CentralTabs: React.FC<CentralTabsProps> = ({
  tab,
  onChange,
  newCount,
  onTheWayCount,
  preorderCount,
  preorderUnseen = 0,
  historyCount,
}) => {
  const badges: Record<CentralTab, number> = {
    nuevas: newCount,
    camino: onTheWayCount,
    preventas: preorderCount,
    historial: historyCount,
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8E5] px-1.5 pt-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(10,28,22,0.08)]"
      aria-label="Colas de Central Palcos"
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          const count = badges[item.id];
          const highlight = item.id === "preventas" && preorderUnseen > 0 && !active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={active ? "page" : undefined}
              aria-label={highlight ? `${item.label}, ${preorderUnseen} nuevas` : undefined}
              className={`
                relative flex-1 min-w-0 min-h-[4.75rem] flex flex-col items-center justify-center gap-1 rounded-2xl
                transition-colors select-none
                ${active ? item.activeClass : "text-[#7E8E87]"}
              `}
            >
              {active && (
                <span className="absolute inset-1 rounded-2xl bg-current/10 -z-10" />
              )}
              <span className="relative">
                <Icon className={`w-8 h-8 ${active ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
                {count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-[22px] h-[22px] px-1 rounded-full text-sm font-extrabold flex items-center justify-center ${item.badgeClass} ${
                      highlight ? "ring-2 ring-[#FADC06] ring-offset-1 ring-offset-white" : ""
                    }`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
                {highlight && (
                  <span className="absolute -top-2 -left-2 h-3 w-3 rounded-full bg-[#FADC06] animate-ping" aria-hidden />
                )}
              </span>
              <span className="max-w-full px-0.5 text-center text-[12px] font-extrabold leading-tight tracking-tight sm:text-[15px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, Check, RotateCw } from "lucide-react";
import type {
  StadiumZone,
  VipPreorderAvailability,
  VipPreorderMatch,
  VipPreorderSelection,
} from "@/lib/vip/types";
import { formatVipStadiumTime } from "@/lib/vip/types";
import { preorderDateBadge, preorderMatchLine, preorderPhaseLabel } from "@/lib/vip/preorder";
import {
  VIP_PURCHASE_UNAVAILABLE_HINT,
  VIP_PURCHASE_UNAVAILABLE_TITLE,
} from "@/lib/vip/purchase-availability";

function MatchOption({
  match,
  selected,
  onSelect,
}: {
  match: VipPreorderMatch;
  selected: boolean;
  onSelect: () => void;
}) {
  const badge = preorderDateBadge(match.matchDate);
  const openWindows = match.windows.filter((window) => window.available).length;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group flex w-full items-center gap-3.5 rounded-2xl border p-3 text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C8643] ${
        selected
          ? "border-[#187B56] bg-[#187B56]/[0.05] shadow-[0_0_0_1px_#187B56]"
          : "border-[#DFE5E2] bg-white hover:border-[#187B56]/50"
      }`}
    >
      <span
        className={`flex h-[60px] w-[56px] shrink-0 flex-col items-center justify-center rounded-xl transition-colors ${
          selected ? "bg-[#102D24] text-white" : "bg-[#F1F4F2] text-[#111614]"
        }`}
      >
        <span className={`text-[10px] font-black uppercase tracking-[0.14em] ${selected ? "text-[#C5A059]" : "text-[#9E7844]"}`}>
          {badge.month}
        </span>
        <span className="font-headline-md text-2xl font-black leading-none tabular-nums">{badge.day}</span>
        <span className={`text-[10px] font-semibold capitalize ${selected ? "text-[#C9D5CF]" : "text-[#7E8E87]"}`}>
          {badge.weekday}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#9E7844]">
          Partido {match.jornadaNumero}
        </span>
        <span className="block truncate font-headline-md text-base sm:text-lg font-extrabold text-[#111614]">
          {match.matchLabel}
        </span>
        <span className="block truncate text-xs sm:text-sm text-[#4E5C56]">
          {formatVipStadiumTime(match.kickoffAt) ? `Inicio ${formatVipStadiumTime(match.kickoffAt)} h` : preorderMatchLine(match)}
          {" · "}
          {openWindows === 1 ? "1 horario disponible" : `${openWindows} horarios disponibles`}
        </span>
      </span>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? "border-[#187B56] bg-[#187B56] text-white" : "border-[#C9D3CE] text-transparent"
        }`}
        aria-hidden
      >
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </span>
    </button>
  );
}

function WindowGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-[68px] rounded-xl bg-[#EEF2F0] animate-pulse" />
      ))}
    </div>
  );
}

export function VipPreorderScheduler({
  availability,
  loading,
  error,
  zona: _zona,
  value,
  onChange,
  onRetry,
  stepLabel,
}: {
  availability: VipPreorderAvailability | null;
  loading: boolean;
  error: string | null;
  zona?: StadiumZone | "";
  value: VipPreorderSelection | null;
  onChange: (next: VipPreorderSelection | null) => void;
  onRetry: () => void;
  stepLabel?: string;
}) {
  const matches = availability?.matches || [];
  const selectedMatch =
    matches.find((match) => match.matchId === value?.matchId) || (matches.length === 1 ? matches[0] : null);

  const selectMatch = (match: VipPreorderMatch) => {
    if (match.matchId === value?.matchId) return;
    onChange({ matchId: match.matchId, windowStart: "" });
  };

  return (
    <section className="bg-white rounded-[22px] p-5 sm:p-6 border border-[#DFE5E2] shadow-xs flex flex-col gap-5">
      <div className="flex items-center gap-3.5 border-b border-[#E9EFEB] pb-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#102D24] text-[#FADC06] flex items-center justify-center shrink-0">
          <CalendarClock className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          {stepLabel && (
            <span className="font-label-sm text-xs sm:text-sm text-[#9E7844] uppercase tracking-wider font-black">
              {stepLabel}
            </span>
          )}
          <h3 className="font-headline-md text-lg sm:text-xl font-extrabold text-[#111614] tracking-tight">
            Partido y horario de entrega
          </h3>
          {availability && (
            <p className="text-xs sm:text-sm text-[#6E7E77]">
              Elige el horario de entrega de tu preferencia para el partido.
            </p>
          )}
        </div>
      </div>

      {loading && !availability ? (
        <div className="flex flex-col gap-3">
          <div className="h-[84px] rounded-2xl bg-[#EEF2F0] animate-pulse" />
          <WindowGridSkeleton />
        </div>
      ) : error && !availability ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#C43D3D]/20 bg-[#C43D3D]/[0.06] p-4">
          <p className="text-sm font-semibold text-[#8C2828]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#187B56] hover:text-[#136244] cursor-pointer"
          >
            <RotateCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DFE5E2] bg-[#F6F8F7] px-4 py-6 text-center">
          <p className="font-headline-md text-base font-extrabold text-[#111614]">{VIP_PURCHASE_UNAVAILABLE_TITLE}</p>
          <p className="mt-1 text-sm text-[#6E7E77]">{VIP_PURCHASE_UNAVAILABLE_HINT}</p>
        </div>
      ) : (
        <>
          <div role="radiogroup" aria-label="Partido" className="flex flex-col gap-2.5">
            {matches.map((match) => (
              <MatchOption
                key={match.matchId}
                match={match}
                selected={selectedMatch?.matchId === match.matchId}
                onSelect={() => selectMatch(match)}
              />
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {selectedMatch && (
              <motion.div
                key={selectedMatch.matchId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-3"
              >
                <p className="text-base font-bold text-[#3B4843]">¿A qué hora lo quieres en tu palco?</p>

                <div role="radiogroup" aria-label="Ventana de entrega" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedMatch.windows.map((window) => {
                    const selected = value?.matchId === selectedMatch.matchId && value.windowStart === window.start;
                    const phase = preorderPhaseLabel(window.startAt, selectedMatch.kickoffAt);
                    return (
                      <button
                        key={window.start}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!window.available}
                        onClick={() => onChange({ matchId: selectedMatch.matchId, windowStart: window.start })}
                        className={`relative flex min-h-[68px] flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C8643] ${
                          selected
                            ? "border-[#102D24] bg-[#102D24] text-white shadow-[0_6px_16px_rgba(10,28,22,0.22)]"
                            : window.available
                              ? "border-[#DFE5E2] bg-[#F6F8F7] text-[#111614] hover:border-[#187B56] hover:bg-white cursor-pointer"
                              : "border-[#E4EAE6] bg-[#F6F8F7] text-[#A3B0AA] cursor-not-allowed"
                        }`}
                      >
                        <span
                          className={`font-headline-md text-[15px] sm:text-base font-extrabold tabular-nums tracking-tight ${
                            !window.available ? "line-through decoration-[#A3B0AA]" : ""
                          }`}
                        >
                          {window.label}
                        </span>
                        <span
                          className={`text-[11px] sm:text-xs font-semibold ${
                            selected
                              ? "text-[#FADC06]"
                              : !window.available
                                ? "text-[#A3B0AA]"
                                : "text-[#6E7E77]"
                          }`}
                        >
                          {!window.available ? "No disponible" : phase}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </section>
  );
}

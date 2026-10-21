"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, RotateCw } from "lucide-react";
import type {
  StadiumZone,
  VipPreorderAvailability,
  VipPreorderMatch,
  VipPreorderSelection,
} from "@/lib/vip/types";
import { formatVipStadiumTime } from "@/lib/vip/types";
import { preorderDateBadge, preorderMatchLine, preorderPhaseLabel } from "@/lib/vip/preorder";
import { VipSkeleton } from "../ui/skeleton";

function MatchOption({ match, selected, onSelect }: { match: VipPreorderMatch; selected: boolean; onSelect: () => void }) {
  const badge = preorderDateBadge(match.matchDate);
  const openWindows = match.windows.filter((window) => window.available).length;
  const kickoff = formatVipStadiumTime(match.kickoffAt);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`palco-press flex w-full items-center gap-3.5 rounded-[var(--radius-palco-md)] border p-3 text-left ${
        selected ? "border-palco-700 bg-palco-50 shadow-[inset_0_0_0_1px_var(--color-palco-700)]" : "border-palco-line-strong bg-palco-surface hover:border-palco-ink-3"
      }`}
    >
      <span
        className={`flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-[var(--radius-palco-sm)] ${
          selected ? "bg-palco-900 text-palco-on-dark" : "bg-palco-sunken text-palco-ink"
        }`}
      >
        <span className={`text-[11px] font-semibold ${selected ? "text-palco-gold" : "text-palco-gold-ink"}`}>{badge.month}</span>
        <span className="palco-num font-palco-display text-xl font-extrabold leading-none">{badge.day}</span>
        <span className={`text-[11px] capitalize ${selected ? "text-palco-on-dark-2" : "text-palco-ink-3"}`}>{badge.weekday}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-palco-display text-base font-bold text-palco-ink">{match.matchLabel}</span>
        <span className="block truncate text-[13px] text-palco-ink-3">
          Partido {match.jornadaNumero} · {kickoff ? `Inicia ${kickoff} h` : preorderMatchLine(match)}
        </span>
        <span className="block text-[13px] text-palco-ink-3">
          {openWindows === 1 ? "1 horario disponible" : `${openWindows} horarios disponibles`}
        </span>
      </span>
      <span
        aria-hidden
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-palco-700 bg-palco-700 text-white" : "border-palco-field"
        }`}
      >
        {selected && <Check className="size-3.5 stroke-[3]" />}
      </span>
    </button>
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
  invalid = false,
}: {
  availability: VipPreorderAvailability | null;
  loading: boolean;
  error: string | null;
  zona?: StadiumZone | "";
  value: VipPreorderSelection | null;
  onChange: (next: VipPreorderSelection | null) => void;
  onRetry: () => void;
  /** @deprecated Los pasos numerados ya no se muestran. */
  stepLabel?: string;
  /** Se intentó pagar sin elegir partido u horario. */
  invalid?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const matches = availability?.matches || [];
  const selectedMatch = matches.find((match) => match.matchId === value?.matchId) || (matches.length === 1 ? matches[0] : null);
  const hasWindow = Boolean(value?.windowStart);

  const selectMatch = (match: VipPreorderMatch) => {
    if (match.matchId === value?.matchId) return;
    onChange({ matchId: match.matchId, windowStart: "" });
  };

  if (loading && !availability) {
    return (
      <div aria-hidden className="flex flex-col gap-3">
        <VipSkeleton className="h-20 w-full rounded-[var(--radius-palco-md)]" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <VipSkeleton key={index} className="h-16 rounded-[var(--radius-palco-md)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !availability) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-[var(--radius-palco-md)] bg-palco-danger-50 p-4">
        <p className="text-sm font-medium text-palco-danger">No pudimos consultar los partidos con preventa. {error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="palco-press inline-flex min-h-10 items-center gap-1.5 rounded-full bg-palco-surface px-4 text-sm font-semibold text-palco-ink"
        >
          <RotateCw aria-hidden className="size-4" />
          Reintentar
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-[var(--radius-palco-md)] border border-dashed border-palco-line-strong bg-palco-ground px-4 py-6 text-center">
        <p className="font-palco-display text-base font-bold text-palco-ink">Aún no hay horarios de preventa</p>
        <p className="mt-1 text-sm text-palco-ink-3">
          Cuando haya un partido con preventa podrás elegir aquí el horario. Tu carrito se queda guardado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {matches.length > 1 || !selectedMatch ? (
        <div role="radiogroup" aria-label="Partido" className="flex flex-col gap-2">
          {matches.map((match) => (
            <MatchOption
              key={match.matchId}
              match={match}
              selected={selectedMatch?.matchId === match.matchId}
              onSelect={() => selectMatch(match)}
            />
          ))}
        </div>
      ) : (
        <MatchOption match={selectedMatch} selected onSelect={() => undefined} />
      )}

      <AnimatePresence mode="wait" initial={false}>
        {selectedMatch && (
          <motion.div
            key={selectedMatch.matchId}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-2.5"
          >
            <p id="palco-window-label" className="text-sm font-semibold text-palco-ink-2">
              ¿A qué hora lo quieres en tu palco?
            </p>
            <div role="radiogroup" aria-labelledby="palco-window-label" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                    className={`palco-press flex min-h-16 flex-col items-start justify-center rounded-[var(--radius-palco-md)] border px-3 py-2 text-left ${
                      selected
                        ? "border-palco-900 bg-palco-900 text-palco-on-dark"
                        : window.available
                          ? "border-palco-line-strong bg-palco-surface text-palco-ink hover:border-palco-ink-3"
                          : "cursor-not-allowed border-palco-line bg-palco-ground text-palco-ink-3"
                    }`}
                  >
                    <span className={`palco-num font-palco-display text-[15px] font-bold ${!window.available ? "line-through" : ""}`}>
                      {window.label}
                    </span>
                    <span className={`text-xs ${selected ? "text-palco-gold" : "text-palco-ink-3"}`}>
                      {!window.available ? "No disponible" : phase}
                    </span>
                  </button>
                );
              })}
            </div>
            {invalid && !hasWindow && (
              <p className="text-sm font-medium text-palco-danger">Elige el horario en que quieres recibir tu pedido.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {invalid && !selectedMatch && <p className="text-sm font-medium text-palco-danger">Elige el partido de tu preventa.</p>}
    </div>
  );
}

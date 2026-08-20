"use client";

import { useEffect } from "react";
import { Coins, Loader2, Ticket, UserRound } from "lucide-react";
import type { ClubMember } from "@/hooks/use-cinepolis-puntos";

type AwardResult = { points: number; balanceAfter: number };

type CinepolisAssignModalProps = Readonly<{
  member: ClubMember | null;
  comentario: string;
  amount: string;
  previewPoints: number;
  isAssigning: boolean;
  result: AwardResult | null;
  onComentarioChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}>;

export function CinepolisAssignModal({
  member,
  comentario,
  amount,
  previewPoints,
  isAssigning,
  result,
  onComentarioChange,
  onAmountChange,
  onCancel,
  onConfirm,
}: CinepolisAssignModalProps) {
  useEffect(() => {
    if (!member) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isAssigning) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAssigning, member, onCancel]);

  if (!member) return null;

  return (
    <div className="cinepolis-theme fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-[#2A3966]/60 backdrop-blur-sm"
        onClick={onCancel}
        disabled={isAssigning}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cinepolis-modal-title"
        className="relative z-10 w-full max-w-[42rem] overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_60px_rgba(0,61,165,0.28)]"
      >
        <div className="relative bg-[#003DA5] px-7 pb-7 pt-8 text-white">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[#FFC72C]" />
          <button
            type="button"
            onClick={onCancel}
            disabled={isAssigning}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            aria-label="Cerrar"
          >
            <span className="text-[2.2rem] leading-none">×</span>
          </button>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[1.15rem] font-semibold uppercase tracking-[0.14em] text-[#FFC72C]">
            <Ticket className="size-3.5" />
            Cinépolis
          </div>
          <h2
            id="cinepolis-modal-title"
            className="text-[2.4rem] font-bold leading-tight tracking-tight text-white"
          >
            {result ? "Puntos acreditados" : "Socio identificado"}
          </h2>
          <p className="mt-1.5 text-[1.4rem] text-white/75">
            {result
              ? "Ya quedaron en el perfil del socio."
              : "Captura el consumo para sumar puntos al instante."}
          </p>
        </div>

        <div className="space-y-5 px-7 py-6">
          <div className="flex items-center gap-4 rounded-2xl border border-[#E8EEF7] bg-[#F5F7FA] p-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#003DA5] text-white">
              <UserRound className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1.6rem] font-semibold text-[#172033]">
                {member.nombre}
              </p>
              <p className="text-[1.3rem] text-[#667085]">
                Saldo actual
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#FFC72C] px-3 py-1 text-[1.3rem] font-bold text-[#2A3966]">
              {result?.balanceAfter ?? member.puntosActuales} pts
            </span>
          </div>

          {result ? (
            <div className="rounded-2xl bg-[#003DA5] px-6 py-7 text-center text-white">
              <Coins className="mx-auto mb-3 size-8 text-[#FFC72C]" />
              <p className="text-[1.3rem] uppercase tracking-[0.16em] text-white/70">
                Se agregaron
              </p>
              <p className="mt-1 text-[4.2rem] font-extrabold leading-none text-[#FFC72C]">
                +{result.points}
              </p>
              <p className="mt-3 text-[1.45rem] text-white/85">
                Nuevo saldo: {result.balanceAfter} puntos
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <label className="block space-y-2" htmlFor="cinepolis-comentario">
                <span className="text-[1.35rem] font-semibold text-[#172033]">
                  Comentario
                </span>
                <textarea
                  id="cinepolis-comentario"
                  value={comentario}
                  maxLength={250}
                  onChange={(event) => onComentarioChange(event.target.value)}
                  placeholder="Ej. combo palomitas, función 7:30…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#D5DEEC] bg-white px-4 py-3 text-[1.5rem] text-[#172033] outline-none placeholder:text-[#98A2B3] focus:border-[#28ACEC] focus:ring-2 focus:ring-[#28ACEC]/25"
                />
              </label>

              <label className="block space-y-2" htmlFor="cinepolis-monto">
                <span className="text-[1.35rem] font-semibold text-[#172033]">
                  Monto gastado
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[1.6rem] font-semibold text-[#667085]">
                    $
                  </span>
                  <input
                    id="cinepolis-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => onAmountChange(event.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="h-14 w-full rounded-xl border border-[#D5DEEC] bg-white pl-10 pr-4 text-[1.8rem] font-semibold text-[#172033] outline-none placeholder:font-normal placeholder:text-[#98A2B3] focus:border-[#28ACEC] focus:ring-2 focus:ring-[#28ACEC]/25 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </label>

              <div
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-[1.4rem] ${
                  previewPoints > 0
                    ? "bg-[#FFF8E1] text-[#2A3966]"
                    : "bg-[#F5F7FA] text-[#667085]"
                }`}
              >
                <span>Puntos a acreditar</span>
                <span className="text-[1.8rem] font-bold">
                  {previewPoints > 0 ? `+${previewPoints}` : "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#E8EEF7] bg-[#F5F7FA] px-7 py-5 sm:flex-row sm:justify-end">
          {result ? (
            <button
              type="button"
              onClick={onCancel}
              className="h-12 rounded-xl bg-[#003DA5] px-6 text-[1.5rem] font-semibold text-white transition hover:bg-[#2A3966]"
            >
              Listo
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={isAssigning}
                className="h-12 rounded-xl border border-[#D5DEEC] bg-white px-5 text-[1.5rem] font-semibold text-[#2A3966] transition hover:bg-[#F5F7FA] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isAssigning || previewPoints <= 0}
                className="inline-flex h-12 min-w-[16rem] items-center justify-center gap-2 rounded-xl bg-[#FFC72C] px-6 text-[1.5rem] font-bold text-[#2A3966] shadow-[0_8px_18px_rgba(255,199,44,0.35)] transition hover:bg-[#ffd45c] disabled:cursor-not-allowed disabled:bg-[#E4E7EC] disabled:text-[#98A2B3] disabled:shadow-none"
              >
                {isAssigning ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {previewPoints > 0
                  ? `Asignar ${previewPoints} puntos`
                  : "Asignar puntos"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

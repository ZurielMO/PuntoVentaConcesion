"use client";

import type { CinepolisAsignacion } from "@/hooks/use-cinepolis-puntos";
import { formatPrice } from "@/lib/format";

type CinepolisHistoryProps = Readonly<{
  asignaciones: CinepolisAsignacion[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
}>;

function formatHistoryDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryMessage({ children }: Readonly<{ children: string }>) {
  return (
    <p className="px-6 py-12 text-center text-[1.45rem] text-[#667085]">
      {children}
    </p>
  );
}

export function CinepolisHistory({
  asignaciones,
  loading,
  loadingMore,
  error,
  hasMore,
  onLoadMore,
}: CinepolisHistoryProps) {
  let body = <HistoryMessage>Aún no hay asignaciones.</HistoryMessage>;
  if (loading) {
    body = <HistoryMessage>Cargando historial…</HistoryMessage>;
  } else if (error) {
    body = (
      <p className="px-6 py-12 text-center text-[1.45rem] text-red-600">{error}</p>
    );
  } else if (asignaciones.length > 0) {
    body = (
      <div className="overflow-hidden">
        <div className="hidden grid-cols-[9.5rem_minmax(0,1fr)_7.5rem_6.5rem] gap-4 px-6 py-3 text-[1.15rem] font-semibold uppercase tracking-[0.12em] text-[#98A2B3] sm:grid">
          <span>Fecha</span>
          <span>Socio</span>
          <span className="text-right">Monto</span>
          <span className="text-right">Puntos</span>
        </div>
        <ul className="divide-y divide-[#EEF2F8]">
          {asignaciones.map((row) => (
            <li
              key={row.id}
              className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-[9.5rem_minmax(0,1fr)_7.5rem_6.5rem] sm:items-center sm:gap-4"
            >
              <span className="text-[1.35rem] capitalize text-[#667085]">
                {formatHistoryDate(row.createdAt)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[1.5rem] font-semibold text-[#172033]">
                  {row.customerFullName}
                </p>
                {row.comentario && row.comentario !== "Cinépolis" ? (
                  <p className="truncate text-[1.25rem] text-[#667085]">
                    {row.comentario}
                  </p>
                ) : null}
              </div>
              <span className="text-[1.45rem] font-medium text-[#172033] sm:text-right">
                {formatPrice(row.amountMxn)}
              </span>
              <span className="sm:justify-self-end">
                <span className="inline-flex rounded-full bg-[#FFF4CC] px-2.5 py-1 text-[1.3rem] font-bold text-[#2A3966]">
                  +{row.points}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {hasMore ? (
          <div className="border-t border-[#EEF2F8] px-6 py-4 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={onLoadMore}
              className="h-11 rounded-xl border border-[#D5DEEC] bg-white px-5 text-[1.4rem] font-semibold text-[#003DA5] transition hover:bg-[#F5F7FA] disabled:opacity-50"
            >
              {loadingMore ? "Cargando…" : "Cargar más"}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#E8EEF7] bg-white shadow-[0_12px_40px_rgba(42,57,102,0.06)]">
      <div className="flex items-end justify-between gap-4 px-6 pb-2 pt-6">
        <div>
          <h2 className="text-[1.8rem] font-bold tracking-tight text-[#172033]">
            Historial
          </h2>
          <p className="mt-0.5 text-[1.3rem] text-[#667085]">
            Asignaciones de esta sesión
          </p>
        </div>
      </div>
      {body}
    </section>
  );
}

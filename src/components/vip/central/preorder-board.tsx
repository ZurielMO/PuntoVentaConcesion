"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  ChefHat,
  ChevronDown,
  ClipboardList,
  Lock,
  MapPin,
  RotateCw,
  Unlock,
} from "lucide-react";
import type { VipOrder, VipOrderStatus, VipPreorderInfo } from "@/lib/vip/types";
import {
  formatVipMatchDate,
  formatVipStadiumTime,
  isVipPreorderOrder,
  shortVipOrderNumber,
} from "@/lib/vip/types";
import { isVipCancelledStatus, isVipTerminalStatus, preorderPhaseLabel } from "@/lib/vip/preorder";

type PreorderOrder = VipOrder & { tipoPedido: "PREORDER"; preventa: VipPreorderInfo };

const MINUTE = 60_000;
/** Con cuánta anticipación a la ventana se sugiere empezar a preparar. */
const PREP_LEAD_MS = 45 * MINUTE;

type StageKey = "scheduled" | "preparing" | "delivered" | "cancelled";

const stageOf = (status: VipOrderStatus): StageKey => {
  if (isVipCancelledStatus(status)) return "cancelled";
  if (status === "DELIVERED" || status === "ENTREGADO") return "delivered";
  if (
    status === "PREPARING" ||
    status === "PREPARANDO" ||
    status === "READY_FOR_PICKUP" ||
    status === "PICKED_UP" ||
    status === "ON_THE_WAY" ||
    status === "EN_CAMINO"
  ) {
    return "preparing";
  }
  return "scheduled";
};

const isActive = (order: VipOrder) => !isVipTerminalStatus(order.estado);

const STAGE_STYLE: Record<StageKey, { label: string; chip: string; stripe: string }> = {
  scheduled: { label: "Programada", chip: "bg-[#9E7844]/12 text-[#7A5A2E]", stripe: "bg-[#C5A059]" },
  preparing: { label: "Por entregar", chip: "bg-[#D99721]/12 text-[#9A6608]", stripe: "bg-[#D99721]" },
  delivered: { label: "Entregado", chip: "bg-[#187B56]/12 text-[#136244]", stripe: "bg-[#187B56]" },
  cancelled: { label: "Cancelado", chip: "bg-[#C43D3D]/10 text-[#A83232]", stripe: "bg-[#C43D3D]" },
};

const NEXT_ACTION: Partial<Record<StageKey, { status: VipOrderStatus; label: string; Icon: typeof ChefHat; className: string }>> = {
  scheduled: { status: "PREPARING", label: "Preparar", Icon: ChefHat, className: "bg-[#102D24] hover:bg-[#183C32]" },
  preparing: { status: "DELIVERED", label: "Marcar como entregado", Icon: Check, className: "bg-[#187B56] hover:bg-[#136244]" },
};

type Urgency = "later" | "prep" | "now" | "late";

const URGENCY_STYLE: Record<Urgency, string> = {
  later: "bg-[#EEF2F0] text-[#4E5C56]",
  prep: "bg-[#D99721] text-white",
  now: "bg-[#187B56] text-white",
  late: "bg-[#C43D3D] text-white",
};

function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / MINUTE));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `${hours} h ${rest} min` : `${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 día" : `${days} días`;
}

function slotUrgency(startAt: string | null, endAt: string | null, now: number): { urgency: Urgency; label: string } {
  const start = Date.parse(String(startAt || ""));
  const end = Date.parse(String(endAt || ""));
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { urgency: "later", label: "" };
  if (now > end) return { urgency: "late", label: `Atrasada ${formatDuration(now - end)}` };
  if (now >= start) return { urgency: "now", label: `Entregar ahora · hasta ${formatVipStadiumTime(endAt)}` };
  if (start - now <= PREP_LEAD_MS) return { urgency: "prep", label: `Preparar ya · sale en ${formatDuration(start - now)}` };
  return { urgency: "later", label: `En ${formatDuration(start - now)}` };
}

type MatchGroup = {
  info: VipPreorderInfo;
  orders: PreorderOrder[];
  activeCount: number;
};

function groupByMatch(orders: PreorderOrder[]): MatchGroup[] {
  const map = new Map<string, MatchGroup>();
  for (const order of orders) {
    const key = order.preventa.matchId;
    const group = map.get(key) || { info: order.preventa, orders: [], activeCount: 0 };
    group.orders.push(order);
    if (isActive(order)) group.activeCount += 1;
    map.set(key, group);
  }
  const kickoff = (group: MatchGroup) =>
    Date.parse(group.info.kickoffAt || group.info.windowStartAt || `${group.info.matchDate}T00:00:00Z`) || 0;
  return [...map.values()].sort((a, b) => kickoff(a) - kickoff(b));
}

function prepSummary(orders: PreorderOrder[]): Array<{ key: string; name: string; detail: string; quantity: number }> {
  const totals = new Map<string, { key: string; name: string; detail: string; quantity: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const detail = (item.opcionesSeleccionadas || []).map((option) => option.opcionNombre).filter(Boolean).join(", ");
      const key = `${item.producto.id}|${detail}`;
      const row = totals.get(key) || { key, name: item.producto.nombre, detail, quantity: 0 };
      row.quantity += item.cantidad;
      totals.set(key, row);
    }
  }
  return [...totals.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}

function PreorderOrderCard({
  order,
  busy,
  onAdvance,
  onOpenDetails,
}: {
  order: PreorderOrder;
  busy: boolean;
  onAdvance: (order: PreorderOrder, status: VipOrderStatus) => void;
  onOpenDetails: (order: VipOrder) => void;
}) {
  const stage = stageOf(order.estado);
  const style = STAGE_STYLE[stage];
  const statusLabel = order.estado === "REFUNDED" ? "Reembolsado" : style.label;
  const action = NEXT_ACTION[stage];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(order)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetails(order);
        }
      }}
      className="relative overflow-hidden rounded-[1.25rem] border border-[#E2E8E5] bg-white p-4 pl-5 shadow-sm transition-all hover:border-[#187B56]/40 hover:shadow-md active:scale-[0.995] cursor-pointer"
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${style.stripe}`} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="block truncate font-headline-md text-2xl font-extrabold leading-none tracking-tight text-[#187B56]" title={order.numeroPedido}>
            {shortVipOrderNumber(order.numeroPedido)}
          </span>
          <p className="mt-1 truncate text-base font-semibold text-[#4E5C56]">{order.nombreCliente || "Sin nombre"}</p>
        </div>
        <div className="min-w-0 max-w-[48%] text-right">
          <span className="flex items-center justify-end gap-1 font-headline-md text-lg font-extrabold leading-tight text-[#171A19]">
            <MapPin className="h-5 w-5 shrink-0 text-[#187B56]" />
            <span className="truncate">Palco {order.ubicacion.palco}</span>
          </span>
          <span className="block truncate text-sm font-semibold text-[#66706B]">
            {order.ubicacion.zona}
            {order.ubicacion.nivel ? ` · ${order.ubicacion.nivel}` : ""}
          </span>
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5 text-lg leading-snug text-[#171A19]">
        {order.items.map((item) => (
          <li key={item.id} className="break-words">
            <span className="font-semibold">
              <strong className="mr-1.5 font-extrabold text-[#187B56]">{item.cantidad}×</strong>
              {item.producto.nombre}
            </span>
            {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
              <span className="block pl-7 text-base italic text-[#66706B]">
                {item.opcionesSeleccionadas.map((option) => option.opcionNombre).join(", ")}
              </span>
            )}
            {item.instrucciones && (
              <span className="block pl-7 text-base font-semibold text-[#9E7844]">* {item.instrucciones}</span>
            )}
          </li>
        ))}
      </ul>

      {order.ubicacion.notas && (
        <p className="mt-2 rounded-xl bg-[#F5F7F6] px-3 py-2 text-base text-[#66706B]">
          <span className="font-bold text-[#171A19]">Nota palco: </span>
          {order.ubicacion.notas}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F2F1] pt-3" onClick={(event) => event.stopPropagation()}>
        <span className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${style.chip}`}>{statusLabel}</span>
        {action && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAdvance(order, action.status)}
            className={`inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl px-4 font-headline-md text-base font-bold text-white shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer sm:text-lg ${action.className}`}
          >
            {busy ? <RotateCw className="h-5 w-5 animate-spin" /> : <action.Icon className="h-5 w-5 shrink-0" />}
            {action.label}
          </button>
        )}
      </div>
    </article>
  );
}

export function PreorderBoard({
  orders,
  loading,
  error,
  onRetry,
  preordersEnabled,
  onTogglePreorders,
  onAdvance,
  onAdvanceMany,
  onOpenDetails,
  busyIds,
}: {
  orders: VipOrder[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  preordersEnabled: boolean | null;
  onTogglePreorders: (next: boolean) => void;
  onAdvance: (order: VipOrder, status: VipOrderStatus) => void;
  onAdvanceMany: (orders: VipOrder[], status: VipOrderStatus) => void;
  onOpenDetails: (order: VipOrder) => void;
  busyIds: ReadonlySet<string>;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAllPrep, setShowAllPrep] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const matches = useMemo(() => groupByMatch(orders.filter(isVipPreorderOrder)), [orders]);
  const selected =
    matches.find((group) => group.info.matchId === selectedMatchId) ||
    matches.find((group) => group.activeCount > 0) ||
    matches[0] ||
    null;

  const active = useMemo(() => (selected?.orders || []).filter(isActive), [selected]);
  const completed = useMemo(() => (selected?.orders || []).filter((order) => !isActive(order)), [selected]);

  const slots = useMemo(() => {
    const map = new Map<string, { info: VipPreorderInfo; orders: PreorderOrder[] }>();
    for (const order of active) {
      const key = order.preventa.windowStart;
      const slot = map.get(key) || { info: order.preventa, orders: [] };
      slot.orders.push(order);
      map.set(key, slot);
    }
    return [...map.values()].sort((a, b) => a.info.windowStart.localeCompare(b.info.windowStart));
  }, [active]);

  const stageCounts = useMemo(() => {
    const counts: Record<StageKey, number> = { scheduled: 0, preparing: 0, delivered: 0, cancelled: 0 };
    for (const order of selected?.orders || []) counts[stageOf(order.estado)] += 1;
    return counts;
  }, [selected]);

  const summary = useMemo(
    () => prepSummary(active.filter((order) => stageOf(order.estado) === "scheduled" || stageOf(order.estado) === "preparing")),
    [active],
  );
  const visibleSummary = showAllPrep ? summary : summary.slice(0, 6);

  const kickoff = selected ? formatVipStadiumTime(selected.info.kickoffAt) : "";

  return (
    <div className="flex flex-col gap-3.5">
      <section className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-[#0A1C16] via-[#102D24] to-[#14382C] p-4 text-white shadow-sm">
        <div className="pointer-events-none absolute -top-14 -right-10 h-40 w-40 rounded-full bg-[#187B56]/25 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#C5A059]">
              <CalendarClock className="h-4 w-4" />
              Preventas
            </span>
            <h2 className="mt-1 truncate font-headline-md text-xl font-extrabold leading-tight" style={{ color: "#FFFFFF" }}>
              {selected ? selected.info.matchLabel : "Pedidos programados"}
            </h2>
            <p className="break-words text-sm font-semibold leading-snug text-[#ACB5C9]">
              {selected
                ? [
                    `Partido ${selected.info.jornadaNumero}`,
                    formatVipMatchDate(selected.info.matchDate, { weekday: "short", day: "numeric", month: "short" }),
                    kickoff ? `${kickoff} h` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Se preparan con anticipación, por ventana de entrega"}
            </p>
          </div>
          {preordersEnabled !== null && (
            <button
              type="button"
              role="switch"
              aria-checked={preordersEnabled}
              onClick={() => onTogglePreorders(!preordersEnabled)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold transition-colors cursor-pointer ${
                preordersEnabled
                  ? "border-[#00FF85]/30 bg-[#187B56] text-white"
                  : "border-white/15 bg-white/10 text-[#DCE6E1]"
              }`}
            >
              {preordersEnabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {preordersEnabled ? "Abierta" : "Cerrada"}
            </button>
          )}
        </div>

        {matches.length > 1 && (
          <div className="relative mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5" role="tablist" aria-label="Partidos">
            {matches.map((group) => {
              const isSelected = group.info.matchId === selected?.info.matchId;
              return (
                <button
                  key={group.info.matchId}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedMatchId(group.info.matchId)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer ${
                    isSelected ? "border-[#FADC06]/60 bg-[#FADC06] text-black" : "border-white/15 bg-white/8 text-white"
                  }`}
                >
                  <span className="block text-sm font-extrabold leading-tight">Partido {group.info.jornadaNumero}</span>
                  <span className={`block text-xs font-semibold ${isSelected ? "text-black/70" : "text-[#ACB5C9]"}`}>
                    {formatVipMatchDate(group.info.matchDate, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                    {group.activeCount} activas
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {error && !loading && orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#C43D3D]/20 bg-white p-6 text-center">
          <p className="text-lg font-semibold text-[#A83232]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#187B56] px-4 font-bold text-white cursor-pointer"
          >
            <RotateCw className="h-5 w-5" />
            Reintentar
          </button>
        </div>
      ) : loading && orders.length === 0 ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <div className="h-20 rounded-2xl bg-white animate-pulse" />
          <div className="h-48 rounded-2xl bg-white animate-pulse" />
        </div>
      ) : !selected ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#CCD5D1] bg-white/60 p-6 text-center">
          <CalendarClock className="h-9 w-9 text-[#9E7844]" />
          <p className="font-headline-md text-lg font-extrabold text-[#171A19]">Sin preventas programadas</p>
          <p className="max-w-sm text-base text-[#66706B]">
            Cuando un palco programe un pedido aparecerá aquí, ordenado por horario de entrega.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["scheduled", "Programadas"],
                ["preparing", "Por entregar"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="min-w-0 rounded-2xl border border-[#E2E8E5] bg-white px-2 py-2.5 text-center">
                <span className="block font-headline-md text-2xl font-extrabold leading-none tabular-nums text-[#171A19]">
                  {stageCounts[key]}
                </span>
                <span className="mt-1 block text-xs font-bold uppercase leading-tight tracking-tight text-[#66706B]">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {summary.length > 0 && (
            <section className="rounded-2xl border border-[#E2E8E5] bg-white p-4">
              <h3 className="flex items-center gap-2 font-headline-md text-base font-extrabold text-[#171A19]">
                <ClipboardList className="h-5 w-5 text-[#9E7844]" />
                Producción pendiente
                <span className="ml-auto text-sm font-semibold text-[#66706B]">
                  {summary.reduce((sum, row) => sum + row.quantity, 0)} piezas
                </span>
              </h3>
              <ul className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {visibleSummary.map((row) => (
                  <li key={row.key} className="flex items-baseline gap-2 rounded-xl bg-[#F5F7F6] px-3 py-2">
                    <span className="font-headline-md text-lg font-extrabold tabular-nums text-[#187B56]">{row.quantity}×</span>
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-[#171A19]">{row.name}</span>
                      {row.detail && <span className="block truncate text-sm italic text-[#66706B]">{row.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {summary.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllPrep((value) => !value)}
                  className="mt-2 text-sm font-bold text-[#187B56] cursor-pointer"
                >
                  {showAllPrep ? "Ver menos" : `Ver ${summary.length - 6} más`}
                </button>
              )}
            </section>
          )}

          {slots.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-[#CCD5D1] bg-white/60 p-5 text-center text-base text-[#66706B]">
              Todas las preventas de este partido están cerradas.
            </div>
          )}

          {slots.map((slot) => {
            const { urgency, label } = slotUrgency(slot.info.windowStartAt, slot.info.windowEndAt, now);
            const pendingPrep = slot.orders.filter((order) => stageOf(order.estado) === "scheduled");
            const canBulkPrepare = pendingPrep.length > 1 && urgency !== "later";
            const phase = preorderPhaseLabel(slot.info.windowStartAt, slot.info.kickoffAt);
            return (
              <section key={slot.info.windowStart} className="flex flex-col gap-2.5" aria-label={`Ventana ${slot.info.windowLabel}`}>
                <header className="sticky top-0 z-10 -mx-0.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl bg-[#F5F7F6]/95 px-1 py-1.5 backdrop-blur">
                  <span className="font-headline-md text-2xl font-black tabular-nums tracking-tight text-[#171A19]">
                    {slot.info.windowLabel}
                  </span>
                  <span className="text-sm font-semibold text-[#66706B]">
                    {slot.orders.length} {slot.orders.length === 1 ? "pedido" : "pedidos"}
                    {phase ? ` · ${phase}` : ""}
                  </span>
                  {label && (
                    <span className={`ml-auto rounded-full px-3 py-1 text-sm font-extrabold ${URGENCY_STYLE[urgency]}`}>{label}</span>
                  )}
                  {canBulkPrepare && (
                    <button
                      type="button"
                      onClick={() => onAdvanceMany(pendingPrep, "PREPARING")}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#102D24]/15 bg-white text-base font-bold text-[#102D24] hover:border-[#102D24]/40 cursor-pointer"
                    >
                      <ChefHat className="h-5 w-5" />
                      Preparar las {pendingPrep.length} de esta ventana
                    </button>
                  )}
                </header>
                {slot.orders.map((order) => (
                  <PreorderOrderCard
                    key={order.id}
                    order={order}
                    busy={busyIds.has(order.id)}
                    onAdvance={onAdvance}
                    onOpenDetails={onOpenDetails}
                  />
                ))}
              </section>
            );
          })}

          {completed.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShowCompleted((value) => !value)}
                aria-expanded={showCompleted}
                className="flex min-h-12 items-center justify-between rounded-2xl border border-[#E2E8E5] bg-white px-4 text-base font-bold text-[#4E5C56] cursor-pointer"
              >
                <span>Completadas ({completed.length})</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${showCompleted ? "rotate-180" : ""}`} />
              </button>
              {showCompleted &&
                completed.map((order) => (
                  <PreorderOrderCard
                    key={order.id}
                    order={order}
                    busy={false}
                    onAdvance={onAdvance}
                    onOpenDetails={onOpenDetails}
                  />
                ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

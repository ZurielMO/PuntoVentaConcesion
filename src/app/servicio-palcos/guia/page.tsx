"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, RotateCw } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipPreorderTicket } from "@/components/vip/preorder/preorder-ticket";
import { VipOrderProgress } from "@/components/vip/preorder/order-progress";
import { VipGuideLookupForm, guideLookupPath } from "@/components/vip/preorder/guide-lookup-form";
import { VipRecentOrdersList } from "@/components/vip/preorder/home-preorder-cards";
import { VipSkeleton } from "@/components/vip/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { VipService } from "@/lib/vip/vip-service";
import { formatVipGuide, normalizeVipGuide, shortVipOrderNumber, type VipGuideLookupResponse } from "@/lib/vip/types";
import {
  isVipCancelledStatus,
  isVipTerminalStatus,
  vipOrderStatusHeadline,
  vipOrderTimeline,
  vipPaymentStatusLabel,
} from "@/lib/vip/preorder";
import { formatVipPrice } from "@/lib/vip/money";
import { catalogAcronyms, formatDisplayName } from "@/lib/vip/catalog";
import { VipLegalLinks } from "@/components/vip/legal/legal-links";
import { GUIDE_CODE_FONT } from "@/components/vip/ui/guide-font";

const POLL_MS = 20_000;

type LookupError = { title: string; detail: string };

function lookupError(error: unknown): LookupError {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return { title: "No encontramos esa guía", detail: "Revisa que coincida con la de tu correo de confirmación." };
    }
    if (error.status === 400) {
      return { title: "Guía no válida", detail: "La guía tiene 8 caracteres, por ejemplo 7KQ4-M2XD." };
    }
    if (error.status === 429) {
      return { title: "Demasiadas consultas", detail: "Espera un minuto y vuelve a intentarlo." };
    }
  }
  return { title: "No pudimos consultar tu pedido", detail: "Revisa tu conexión e inténtalo de nuevo." };
}

const PAYMENT_TONE: Record<string, string> = {
  ok: "bg-palco-50 text-palco-500",
  warn: "bg-palco-warning-50 text-palco-warning",
  muted: "bg-palco-sunken text-palco-ink-2",
  bad: "bg-palco-danger-50 text-palco-danger",
};

function GuideSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <VipSkeleton className="h-[22rem] w-full rounded-[var(--radius-palco-lg)]" />
      <VipSkeleton className="h-40 w-full rounded-[var(--radius-palco-lg)]" />
    </div>
  );
}

function updatedLabel(at: number | null): string {
  if (!at) return "";
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(at));
}

function GuideResult({
  order,
  refreshing,
  updatedAt,
  onRefresh,
}: {
  order: VipGuideLookupResponse;
  refreshing: boolean;
  updatedAt: number | null;
  onRefresh: () => void;
}) {
  const preorder = order.orderType === "PREORDER" && order.preorder ? order.preorder : null;
  const headline = vipOrderStatusHeadline(order.status, Boolean(preorder));
  const payment = vipPaymentStatusLabel(order.paymentStatus);
  const cancelled = isVipCancelledStatus(order.status);
  const live = !isVipTerminalStatus(order.status);

  const acronyms = useMemo(
    () => catalogAcronyms(order.fulfillments.map((row) => row.concessionName)),
    [order.fulfillments],
  );
  const groups = useMemo(() => {
    const names = new Map(order.fulfillments.map((row) => [row.concessionId, formatDisplayName(row.concessionName, acronyms)]));
    const map = new Map<string, typeof order.items>();
    for (const item of order.items) map.set(item.concessionId, [...(map.get(item.concessionId) || []), item]);
    return [...map.entries()].map(([id, items]) => ({ id, name: names.get(id) || "", items }));
  }, [order, acronyms]);

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="guia-status" className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full bg-palco-sunken px-3 py-1 ${GUIDE_CODE_FONT} text-sm font-semibold tracking-[0.12em] text-palco-ink`}>
              {formatVipGuide(order.guideCode) || order.guideCode}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_TONE[payment.tone]}`}>{payment.label}</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="palco-press -mx-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-palco-ink-2 hover:bg-palco-sunken disabled:opacity-60"
          >
            <RotateCw aria-hidden className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            {live ? `Actualizado ${updatedLabel(updatedAt)}` : "Actualizar"}
          </button>
        </div>

        <h1 id="guia-status" className="mt-5 font-palco-display text-[1.625rem] font-extrabold leading-tight tracking-[-0.02em] text-palco-ink sm:text-[1.875rem]">
          {headline.title}
        </h1>
        <p className="mt-1.5 text-[15px] text-palco-ink-2">{headline.detail}</p>
        <p className="palco-num mt-1.5 text-sm text-palco-ink-3">
          Orden {shortVipOrderNumber(order.orderNumber)}
          {live && <span> · se actualiza sola cada 20 segundos</span>}
        </p>

        <div className="mt-6 border-t border-palco-line pt-6">
          {cancelled ? (
            <div className="flex items-start gap-3 rounded-[var(--radius-palco-md)] bg-palco-danger-50 p-4 text-sm text-palco-ink">
              <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-palco-danger" />
              Este pedido ya no se entregará. Si tienes dudas, acércate a un módulo de Servicio Palcos con tu guía.
            </div>
          ) : (
            <VipOrderProgress steps={vipOrderTimeline(order.status, Boolean(preorder), order.timestamps)} preorder={Boolean(preorder)} />
          )}
        </div>
      </section>

      {preorder && <VipPreorderTicket info={preorder} palco={order.delivery.palco || null} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="guia-entrega" className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-5 sm:p-6">
          <h2 id="guia-entrega" className="font-palco-display text-base font-bold text-palco-ink">
            Entrega
          </h2>
          <dl className="mt-3 grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
            {[
              ["Zona", order.delivery.zona],
              ["Palco", order.delivery.palco],
              ["Piso", order.delivery.nivel.replace(/^Piso\s*/i, "")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[var(--radius-palco-sm)] bg-palco-ground px-3 py-2.5">
                <dt className="text-xs text-palco-ink-3">{label}</dt>
                <dd className="palco-num break-words font-palco-display text-base font-bold leading-snug text-palco-ink">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-palco-ink-2">
            Recibe <span className="font-semibold text-palco-ink">{order.customer.name}</span>
          </p>
          <p className="mt-3 text-[13px] text-palco-ink-3">
            ¿Algo no está bien? Muestra tu guía en un módulo de Servicio Palcos.
          </p>
        </section>

        <section aria-labelledby="guia-resumen" className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-5 sm:p-6">
          <h2 id="guia-resumen" className="font-palco-display text-base font-bold text-palco-ink">
            Tu pedido
          </h2>
          <div className="mt-2 flex flex-col gap-3">
            {groups.map((group) => (
              <div key={group.id}>
                {groups.length > 1 && group.name && <h3 className="mt-1 text-[13px] font-semibold text-palco-ink-3">{group.name}</h3>}
                <ul className="divide-y divide-palco-line">
                  {group.items.map((item) => {
                    const extras = [...item.selectedOptions, ...item.extras]
                      .map((option) => formatDisplayName(option.name, acronyms))
                      .filter(Boolean);
                    return (
                      <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                        <div className="min-w-0 text-[15px]">
                          <p className="text-palco-ink">
                            <span className="palco-num font-semibold text-palco-700">{item.quantity}×</span>{" "}
                            {formatDisplayName(item.name, acronyms)}
                          </p>
                          {extras.length > 0 && <p className="text-[13px] text-palco-ink-3">{extras.join(" · ")}</p>}
                        </div>
                        <span className="palco-num shrink-0 text-[15px] text-palco-ink-2">{formatVipPrice(item.lineTotal, { cents: "always" })}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <dl className="palco-num mt-2 flex flex-col gap-1.5 border-t border-palco-line pt-3 text-sm">
            <div className="flex justify-between text-palco-ink-2">
              <dt>Productos</dt>
              <dd>{formatVipPrice(order.subtotal, { cents: "always" })}</dd>
            </div>
            <div className="flex justify-between text-palco-ink-2">
              <dt>Servicio a palco</dt>
              <dd>{formatVipPrice(order.serviceFee, { cents: "always" })}</dd>
            </div>
            <div className="mt-1 flex justify-between font-palco-display text-base font-bold text-palco-ink">
              <dt>Total</dt>
              <dd>{formatVipPrice(order.total, { cents: "always" })}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function GuidePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCode = searchParams.get("codigo") || searchParams.get("guia") || "";
  const code = normalizeVipGuide(rawCode);

  const [order, setOrder] = useState<VipGuideLookupResponse | null>(null);
  const [error, setError] = useState<LookupError | null>(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(
    async (mode: "initial" | "refresh" | "poll") => {
      if (!code || inFlight.current) return;
      inFlight.current = true;
      if (mode === "refresh") setRefreshing(true);
      try {
        const next = await VipService.lookupOrderByGuide(code);
        setOrder(next);
        setError(null);
        setUpdatedAt(Date.now());
      } catch (err) {
        // En sondeo se conserva lo último mostrado; solo la primera carga muestra el error.
        if (mode !== "poll") {
          setError(lookupError(err));
          if (mode === "initial") setOrder(null);
        }
      } finally {
        inFlight.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [code],
  );

  useEffect(() => {
    setOrder(null);
    setError(null);
    setLoading(Boolean(code));
    void load("initial");
  }, [code, load]);

  const live = Boolean(order && !isVipTerminalStatus(order.status));
  useEffect(() => {
    if (!live) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load("poll");
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load("poll");
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live, load]);

  const goTo = (next: string) => router.replace(guideLookupPath(next));

  return (
    <div className="flex min-h-screen flex-col pb-28 md:pb-12">
      <VipTopBar
        variant="linear"
        title="Mi pedido"
        subtitle={order ? `Guía ${formatVipGuide(order.guideCode)}` : "Consulta con tu guía"}
        titleTag="p"
        onBack={() => router.push("/servicio-palcos/inicio")}
      />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-5 sm:py-8">
        {!code ? (
          <section aria-labelledby="guia-empty" className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-5 sm:p-7">
            <h1 id="guia-empty" className="font-palco-display text-[1.625rem] font-extrabold tracking-[-0.02em] text-palco-ink">
              Consulta tu pedido
            </h1>
            <p className="mt-1.5 text-[15px] text-palco-ink-2">
              Escribe la guía de 8 caracteres de tu correo de confirmación para ver en qué va tu pedido.
            </p>
            <div className="mt-5">
              <VipGuideLookupForm onSubmitCode={goTo} />
            </div>
            <div className="mt-6 empty:hidden">
              <VipRecentOrdersList />
            </div>
          </section>
        ) : loading ? (
          <GuideSkeleton />
        ) : error && !order ? (
          <section aria-labelledby="guia-error" className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-5 sm:p-7">
            <span className="flex size-11 items-center justify-center rounded-full bg-palco-danger-50 text-palco-danger">
              <CircleAlert aria-hidden className="size-5" />
            </span>
            <h1 id="guia-error" className="mt-3 font-palco-display text-xl font-bold text-palco-ink">
              {error.title}
            </h1>
            <p className="mb-5 mt-1 text-sm text-palco-ink-2">{error.detail}</p>
            <VipGuideLookupForm key={code} initialValue={code} onSubmitCode={goTo} />
          </section>
        ) : order ? (
          <>
            <GuideResult order={order} refreshing={refreshing} updatedAt={updatedAt} onRefresh={() => void load("refresh")} />
            <section aria-label="Consultar otra guía" className="rounded-[var(--radius-palco-lg)] border border-dashed border-palco-line-strong p-5">
              <VipGuideLookupForm onSubmitCode={goTo} label="¿Tienes otra guía?" />
            </section>
          </>
        ) : null}
      </main>
      <VipLegalLinks className="px-4 pb-4" />
    </div>
  );
}

export default function VipGuiaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <div className="h-14 bg-palco-900 md:h-16" />
        </div>
      }
    >
      <GuidePageInner />
    </Suspense>
  );
}

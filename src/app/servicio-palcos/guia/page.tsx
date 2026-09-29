"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Armchair, PackageSearch, ReceiptText, RotateCw } from "lucide-react";
import { motion } from "motion/react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipPreorderTicket } from "@/components/vip/preorder/preorder-ticket";
import { VipOrderProgress } from "@/components/vip/preorder/order-progress";
import { VipGuideLookupForm, guideLookupPath } from "@/components/vip/preorder/guide-lookup-form";
import { ApiError } from "@/lib/api/client";
import { VipService } from "@/lib/vip/vip-service";
import { formatVipGuide, normalizeVipGuide, type VipGuideLookupResponse } from "@/lib/vip/types";
import {
  isVipCancelledStatus,
  isVipTerminalStatus,
  vipOrderProgress,
  vipOrderStatusHeadline,
  vipPaymentStatusLabel,
} from "@/lib/vip/preorder";
import { formatVipMxn } from "@/lib/vip/money";

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
  ok: "bg-[#187B56]/10 text-[#136244] border-[#187B56]/25",
  warn: "bg-[#B7791F]/10 text-[#8A5A12] border-[#B7791F]/25",
  muted: "bg-[#7E8E87]/10 text-[#4E5C56] border-[#7E8E87]/25",
  bad: "bg-[#C43D3D]/10 text-[#A83232] border-[#C43D3D]/25",
};

function GuideSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="h-[220px] rounded-[22px] bg-white border border-[#DFE5E2] animate-pulse" />
      <div className="h-[180px] rounded-[22px] bg-[#E4EAE6] animate-pulse" />
      <div className="h-[160px] rounded-[22px] bg-white border border-[#DFE5E2] animate-pulse" />
    </div>
  );
}

function GuideResult({ order, refreshing, onRefresh }: {
  order: VipGuideLookupResponse;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const preorder = order.orderType === "PREORDER" && order.preorder ? order.preorder : null;
  const headline = vipOrderStatusHeadline(order.status, Boolean(preorder));
  const payment = vipPaymentStatusLabel(order.paymentStatus);
  const cancelled = isVipCancelledStatus(order.status);
  const live = !isVipTerminalStatus(order.status);
  const concessionNames = [...new Set(order.fulfillments.map((row) => row.concessionName).filter(Boolean))];
  const concessionById = new Map(order.fulfillments.map((row) => [row.concessionId, row.concessionName]));

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[22px] border border-[#DFE5E2] bg-white p-5 sm:p-7 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[#F1F4F2] px-2.5 py-1 font-mono text-sm font-bold tracking-[0.14em] text-[#111614]">
              {formatVipGuide(order.guideCode) || order.guideCode}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${PAYMENT_TONE[payment.tone]}`}>
              {payment.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-[#4E5C56] hover:text-[#187B56] disabled:opacity-60 cursor-pointer"
          >
            {live && <span className="h-1.5 w-1.5 rounded-full bg-[#187B56] animate-pulse" aria-hidden />}
            <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {live ? "En vivo" : "Actualizar"}
          </button>
        </div>

        <h2 className="mt-4 font-headline-md text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#111614]">
          {headline.title}
        </h2>
        <p className="mt-1 text-sm sm:text-base text-[#4E5C56]">{headline.detail}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#8A9992]">
          Orden {order.orderNumber}
        </p>

        <div className="mt-6">
          {cancelled ? (
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#C43D3D]/20 bg-[#C43D3D]/[0.05] p-3.5 text-sm text-[#8C2828]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Este pedido ya no se entregará. Si tienes dudas, acércate a un módulo de Servicio Palcos con tu guía.
            </div>
          ) : (
            <VipOrderProgress steps={vipOrderProgress(order.status, Boolean(preorder))} />
          )}
        </div>
      </motion.section>

      {preorder && <VipPreorderTicket info={preorder} palco={order.delivery.palco || null} />}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-[1fr_1.35fr]">
        <section className="rounded-[22px] border border-[#DFE5E2] bg-white p-5 sm:p-6 shadow-xs">
          <h3 className="flex items-center gap-2 font-headline-md text-base font-extrabold text-[#111614]">
            <Armchair className="h-4 w-4 text-[#9E7844]" />
            Entrega
          </h3>
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {[
              ["Zona", order.delivery.zona],
              ["Palco", order.delivery.palco],
              ["Piso", order.delivery.nivel.replace(/^Piso\s*/i, "")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#F6F8F7] px-3 py-2.5">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-[#8A9992]">{label}</dt>
                <dd className="font-headline-md text-base font-extrabold text-[#111614] truncate">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-[#4E5C56]">
            Recibe <span className="font-bold text-[#111614]">{order.customer.name}</span>
          </p>
        </section>

        <section className="rounded-[22px] border border-[#DFE5E2] bg-white p-5 sm:p-6 shadow-xs">
          <h3 className="flex items-center gap-2 font-headline-md text-base font-extrabold text-[#111614]">
            <ReceiptText className="h-4 w-4 text-[#9E7844]" />
            Resumen
            {concessionNames.length > 0 && (
              <span className="ml-auto truncate text-xs font-semibold text-[#8A9992]">{concessionNames.join(" · ")}</span>
            )}
          </h3>
          <ul className="mt-3 divide-y divide-[#EEF2F0]">
            {order.items.map((item) => {
              const extras = [...item.selectedOptions, ...item.extras].map((option) => option.name).filter(Boolean);
              return (
                <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111614]">
                      <span className="tabular-nums text-[#187B56]">{item.quantity}×</span> {item.name}
                    </p>
                    {(extras.length > 0 || (concessionNames.length > 1 && concessionById.get(item.concessionId))) && (
                      <p className="text-xs text-[#6E7E77] truncate">
                        {[concessionNames.length > 1 ? concessionById.get(item.concessionId) : "", ...extras]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-[#3B4843]">
                    {formatVipMxn(item.lineTotal)}
                  </span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-2 flex flex-col gap-1 border-t border-[#DFE5E2] pt-3 text-sm">
            <div className="flex justify-between text-[#4E5C56]">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatVipMxn(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-[#4E5C56]">
              <dt>Cargo por servicio</dt>
              <dd className="tabular-nums">{formatVipMxn(order.serviceFee)}</dd>
            </div>
            <div className="mt-1 flex justify-between font-headline-md text-base font-extrabold text-[#111614]">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatVipMxn(order.total)}</dd>
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
  const inFlight = useRef(false);

  const load = useCallback(async (mode: "initial" | "refresh" | "poll") => {
    if (!code || inFlight.current) return;
    inFlight.current = true;
    if (mode === "refresh") setRefreshing(true);
    try {
      const next = await VipService.lookupOrderByGuide(code);
      setOrder(next);
      setError(null);
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
  }, [code]);

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
    return () => window.clearInterval(interval);
  }, [live, load]);

  const goTo = (next: string) => router.replace(guideLookupPath(next));

  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-16 bg-[#F6F8F7] text-[#111614]">
      <VipTopBar
        variant="linear"
        title="Estatus del pedido"
        subtitle="Consulta con tu guía"
        onBack={() => router.push("/servicio-palcos/inicio")}
      />

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 flex flex-col gap-5">
        {!code ? (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0A1C16] via-[#102D24] to-[#14382C] p-6 sm:p-8 text-white border border-[#234D41]/80 shadow-[0_14px_36px_rgba(10,28,22,0.22)]"
          >
            <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#187B56]/25 blur-3xl" />
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#FADC06]">
                <PackageSearch className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-headline-md text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#FFFFFF" }}>
                Consulta tu pedido
              </h2>
              <p className="mt-1.5 mb-5 text-sm sm:text-base text-[#C9D5CF]" style={{ color: "#C9D5CF" }}>
                Escribe la guía de 8 caracteres que llegó a tu correo de confirmación.
              </p>
              <VipGuideLookupForm tone="dark" autoFocus onSubmitCode={goTo} />
            </div>
          </motion.section>
        ) : loading ? (
          <GuideSkeleton />
        ) : error && !order ? (
          <section className="rounded-[22px] border border-[#DFE5E2] bg-white p-6 sm:p-7 shadow-xs">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C43D3D]/10 text-[#C43D3D]">
              <AlertCircle className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-headline-md text-xl font-extrabold text-[#111614]">{error.title}</h2>
            <p className="mt-1 mb-5 text-sm text-[#4E5C56]">{error.detail}</p>
            <VipGuideLookupForm key={code} initialValue={code} onSubmitCode={goTo} />
          </section>
        ) : order ? (
          <>
            <GuideResult order={order} refreshing={refreshing} onRefresh={() => void load("refresh")} />
            <section className="rounded-[22px] border border-dashed border-[#DFE5E2] p-5">
              <p className="mb-3 text-sm font-bold text-[#3B4843]">¿Tienes otra guía?</p>
              <VipGuideLookupForm onSubmitCode={goTo} />
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default function VipGuiaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6F8F7] text-[#7E8E87]">
          Cargando…
        </div>
      }
    >
      <GuidePageInner />
    </Suspense>
  );
}

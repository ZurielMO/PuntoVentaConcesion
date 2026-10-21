"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CircleAlert, Loader2, RotateCw } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipPreorderTicket } from "@/components/vip/preorder/preorder-ticket";
import { VipGuideCodeCard } from "@/components/vip/preorder/guide-code-card";
import { guideLookupPath } from "@/components/vip/preorder/guide-lookup-form";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { useVipOrders } from "@/hooks/vip/use-vip-orders";
import { ApiError } from "@/lib/api/client";
import {
  clearPendingCheckout,
  mapVipPreorderInfo,
  readPendingCheckout,
  saveGuestTrackingToken,
  VipService,
  type VipPendingCheckout,
} from "@/lib/vip/vip-service";
import { isVipCancelledStatus } from "@/lib/vip/preorder";
import { normalizeVipGuide, shortVipOrderNumber, type VipOrderStatus, type VipPreorderInfo } from "@/lib/vip/types";
import { formatVipPrice } from "@/lib/vip/money";
import { saveRecentOrder } from "@/lib/vip/recent-orders";
import { VipLegalLinks } from "@/components/vip/legal/legal-links";

const CONFIRM_ATTEMPTS = 4;

const isRetryableConfirmError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) return true;
  return error.status === 429 || error.status >= 500;
};

type Outcome = "confirming" | "paid" | "validating" | "refunded" | "error";

function SuccessMark() {
  const reduceMotion = useReducedMotion();
  return (
    <span className="flex size-16 items-center justify-center rounded-full bg-palco-700 text-white">
      <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
        />
      </svg>
    </span>
  );
}

export default function VipPagoExitoPage() {
  const { clearCart, setOrderMode } = useVipCart();
  const { refreshOrders, patchOrderStatus } = useVipOrders();
  const [pending, setPending] = useState<VipPendingCheckout | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("confirming");
  const [error, setError] = useState<string | null>(null);
  const [guideCode, setGuideCode] = useState<string | null>(null);
  const [preorder, setPreorder] = useState<VipPreorderInfo | null>(null);
  const clearCartRef = useRef(clearCart);
  const setOrderModeRef = useRef(setOrderMode);
  const patchOrderStatusRef = useRef(patchOrderStatus);
  const refreshOrdersRef = useRef(refreshOrders);
  clearCartRef.current = clearCart;
  setOrderModeRef.current = setOrderMode;
  patchOrderStatusRef.current = patchOrderStatus;
  refreshOrdersRef.current = refreshOrders;

  useEffect(() => {
    const stored = readPendingCheckout();
    setPending(stored);
    clearCartRef.current();

    const params = new URLSearchParams(window.location.search);
    // `cs` es el nombre actual; `session_id` se sigue leyendo por si Stripe
    // reenvía a un checkout creado antes del cambio.
    const sessionId = params.get("cs") || params.get("session_id") || stored?.checkoutSessionId || "";

    if (!sessionId) {
      setOutcome("error");
      setError("No encontramos la sesión de pago para confirmar el pedido.");
      return;
    }

    let cancelled = false;

    const confirm = async () => {
      for (let attempt = 0; attempt < CONFIRM_ATTEMPTS; attempt += 1) {
        if (cancelled) return;
        try {
          const result = await VipService.confirmCheckout(sessionId);
          if (cancelled) return;
          const orderCancelled = isVipCancelledStatus(result.status as VipOrderStatus);
          if (!result.paid && !orderCancelled && attempt < CONFIRM_ATTEMPTS - 1) {
            await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
            continue;
          }
          const kitchenReady = result.paid && !orderCancelled;
          const guide = kitchenReady ? normalizeVipGuide(result.guideCode || "") : null;
          const preorderInfo = kitchenReady && result.orderType === "PREORDER" ? mapVipPreorderInfo(result.preorder) : null;
          setOutcome(orderCancelled ? "refunded" : kitchenReady ? "paid" : "validating");
          setError(
            orderCancelled
              ? "El cobro se reembolsó y el pedido no quedó programado en Central. Puedes volver a intentar la preventa."
              : null,
          );
          setGuideCode(guide);
          setPreorder(preorderInfo);
          if (kitchenReady && result.orderType === "PREORDER") setOrderModeRef.current("NOW");
          patchOrderStatusRef.current(result.orderId, result.status);
          const orderNumber = result.orderNumber || stored?.orderNumber || "";
          setPending({
            ...(stored || {}),
            orderId: result.orderId,
            orderNumber,
            trackingToken: stored?.trackingToken || "",
            checkoutSessionId: sessionId,
            isPreorder: result.orderType === "PREORDER" || stored?.isPreorder,
          });
          if (stored?.trackingToken) {
            saveGuestTrackingToken(result.orderId, stored.trackingToken);
          }
          if (guide) {
            saveRecentOrder({
              guide,
              orderNumber,
              preorder: preorderInfo
                ? { matchLabel: preorderInfo.matchLabel, windowLabel: preorderInfo.windowLabel, matchDate: preorderInfo.matchDate }
                : null,
            });
          }
          clearPendingCheckout();
          try {
            await refreshOrdersRef.current();
          } catch {
            // El pago ya quedó confirmado; el listado de cocina se actualiza al recargar.
          }
          return;
        } catch (err) {
          const canRetry = isRetryableConfirmError(err) && attempt < CONFIRM_ATTEMPTS - 1;
          if (!canRetry) {
            if (!cancelled) {
              setOutcome("error");
              setError("El pago se recibió, pero aún no pudimos confirmar la orden en cocina. Recarga en unos segundos.");
            }
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
        }
      }
    };

    void confirm();

    return () => {
      cancelled = true;
    };
  }, []);

  const palcoLine = pending?.palco
    ? [`Palco ${pending.palco}`, pending.zona, pending.nivel].filter(Boolean).join(" · ")
    : null;
  const orderShort = pending?.orderNumber ? shortVipOrderNumber(pending.orderNumber) : "";
  const items = pending?.items || [];

  const title = {
    confirming: "Confirmando tu pago",
    paid: preorder ? "¡Preventa confirmada!" : "¡Pedido confirmado!",
    validating: "Tu pago está en validación",
    refunded: "Pedido no programado",
    error: "No pudimos confirmar tu pedido",
  }[outcome];

  const detail = {
    confirming: "Verificamos el cobro con Stripe y avisamos a cocina. No cierres esta pantalla.",
    paid: preorder
      ? `Lo preparamos para tu horario${palcoLine ? ` y lo llevamos a ${palcoLine}` : ""}.`
      : `Tu pedido ya está en cocina${palcoLine ? ` y va a ${palcoLine}` : ""}.`,
    validating: "Tu pedido pasa a cocina en cuanto Stripe confirme el cobro. Revisa de nuevo en unos segundos.",
    refunded: error || "",
    error: error || "",
  }[outcome];

  return (
    <div className="flex min-h-screen flex-col pb-28 md:pb-12">
      <VipTopBar variant="linear" title={outcome === "paid" ? "Pedido confirmado" : "Pago"} titleTag="p" onBack={() => window.location.assign("/servicio-palcos/inicio")} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
        <section aria-live="polite" className="flex flex-col items-center text-center">
          {outcome === "confirming" ? (
            <span className="flex size-16 items-center justify-center rounded-full bg-palco-sunken text-palco-700">
              <Loader2 aria-hidden className="size-8 animate-spin" />
            </span>
          ) : outcome === "paid" ? (
            <SuccessMark />
          ) : (
            <span
              className={`flex size-16 items-center justify-center rounded-full ${
                outcome === "validating" ? "bg-palco-warning-50 text-palco-warning" : "bg-palco-danger-50 text-palco-danger"
              }`}
            >
              <CircleAlert aria-hidden className="size-8" />
            </span>
          )}
          <h1 className="mt-4 font-palco-display text-[1.75rem] font-extrabold leading-tight tracking-[-0.02em] text-palco-ink">{title}</h1>
          <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-palco-ink-2">{detail}</p>
          {orderShort && outcome !== "confirming" && (
            <p className="palco-num mt-2 text-sm text-palco-ink-3">Orden {orderShort}</p>
          )}
        </section>

        {outcome === "paid" && preorder && <VipPreorderTicket info={preorder} palco={pending?.palco || null} />}
        {outcome === "paid" && guideCode && <VipGuideCodeCard guide={guideCode} />}

        {outcome === "paid" && items.length > 0 && (
          <section aria-labelledby="exito-items" className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-4 sm:p-5">
            <h2 id="exito-items" className="font-palco-display text-base font-bold text-palco-ink">
              Lo que pediste
            </h2>
            <ul className="mt-2 divide-y divide-palco-line">
              {items.map((item, index) => (
                <li key={`${item.nombre}-${index}`} className="flex items-baseline justify-between gap-3 py-2.5 text-[15px]">
                  <span className="min-w-0 text-palco-ink">
                    <span className="palco-num font-semibold text-palco-700">{item.cantidad}×</span> {item.nombre}
                  </span>
                </li>
              ))}
            </ul>
            {typeof pending?.total === "number" && (
              <p className="palco-num mt-2 flex justify-between border-t border-palco-line pt-3 font-palco-display font-bold text-palco-ink">
                <span>Total pagado</span>
                <span>{formatVipPrice(pending.total, { cents: "always" })}</span>
              </p>
            )}
          </section>
        )}

        <div className="mt-2 flex flex-col gap-2.5">
          {outcome === "paid" && guideCode && (
            <Link
              href={guideLookupPath(guideCode)}
              className="palco-press inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-palco-700 px-6 font-palco-display text-base font-bold text-white hover:bg-palco-600"
            >
              Ver estado del pedido
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          )}
          {(outcome === "validating" || outcome === "error") && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="palco-press inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-palco-700 px-6 font-palco-display text-base font-bold text-white hover:bg-palco-600"
            >
              <RotateCw aria-hidden className="size-4" />
              Volver a consultar
            </button>
          )}
          {outcome !== "confirming" && (
            <Link
              href="/servicio-palcos/inicio"
              className="palco-press inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-palco-line-strong bg-palco-surface px-6 font-palco-display text-base font-bold text-palco-ink hover:border-palco-ink-3"
            >
              Volver al menú
            </Link>
          )}
        </div>
      </main>
      <VipLegalLinks className="px-4 pb-6" />
    </div>
  );
}

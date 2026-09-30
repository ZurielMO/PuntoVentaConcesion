"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Radar } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipMascot } from "@/components/vip/ui/mascot";
import { VipButton } from "@/components/vip/ui/button";
import { VipPreorderTicket } from "@/components/vip/preorder/preorder-ticket";
import { VipGuideCodeCard } from "@/components/vip/preorder/guide-code-card";
import { VipOrderProcessingOverlay } from "@/components/vip/orders/order-processing-animation";
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
import { normalizeVipGuide, type VipOrderStatus, type VipPreorderInfo } from "@/lib/vip/types";
import { motion } from "motion/react";
import { VipLegalLinks } from "@/components/vip/legal/legal-links";

const CONFIRM_ATTEMPTS = 4;

const isRetryableConfirmError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) return true;
  return error.status === 429 || error.status >= 500;
};

export default function VipPagoExitoPage() {
  const { clearCart, setOrderMode } = useVipCart();
  const { refreshOrders, patchOrderStatus } = useVipOrders();
  const [pending, setPending] = useState<VipPendingCheckout | null>(null);
  const [paid, setPaid] = useState(false);
  const [refunded, setRefunded] = useState(false);
  const [confirming, setConfirming] = useState(true);
  const [showProcessingOverlay, setShowProcessingOverlay] = useState(true);
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
    const sessionId =
      params.get("cs") ||
      params.get("session_id") ||
      stored?.checkoutSessionId ||
      "";

    if (!sessionId) {
      setConfirming(false);
      setShowProcessingOverlay(false);
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
          setPaid(kitchenReady);
          setRefunded(orderCancelled);
          setError(
            orderCancelled
              ? "El cobro se reembolsó y el pedido no quedó programado en Central. Puedes volver a intentar la preventa."
              : null,
          );
          setGuideCode(kitchenReady ? normalizeVipGuide(result.guideCode || "") : null);
          setPreorder(kitchenReady && result.orderType === "PREORDER" ? mapVipPreorderInfo(result.preorder) : null);
          if (kitchenReady && result.orderType === "PREORDER") setOrderModeRef.current("NOW");
          patchOrderStatusRef.current(result.orderId, result.status);
          setPending({
            ...(stored || {}),
            orderId: result.orderId,
            orderNumber: result.orderNumber || stored?.orderNumber || "",
            trackingToken: stored?.trackingToken || "",
            checkoutSessionId: sessionId,
            isPreorder: result.orderType === "PREORDER" || stored?.isPreorder,
          });
          if (stored?.trackingToken) {
            saveGuestTrackingToken(result.orderId, stored.trackingToken);
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
              setError(
                "El pago se recibió, pero aún no pudimos confirmar la orden en cocina. Recarga en unos segundos.",
              );
            }
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
        }
      }
    };

    void confirm().finally(() => {
      if (!cancelled) setConfirming(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-0 bg-[#F8FAF9] text-[#111827]">
      <VipTopBar variant="linear" title="Confirmación de Pago" subtitle="Servicio Palcos VIP · Club León" />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-3xl border border-[#E5EBE8] shadow-[0_4px_20px_rgba(6,46,32,0.04)] flex flex-col items-center gap-4 w-full"
        >
          <div className="relative flex items-center justify-center min-h-[196px]">
            {confirming ? (
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-[#187B56]/10 text-[#187B56]">
                <Loader2 className="w-10 h-10 animate-spin text-[#187B56]" />
              </div>
            ) : (
              <VipMascot
                name={paid ? "ordenConfirmada" : "pagos"}
                size="empty"
                className="-my-2"
              />
            )}
          </div>

          <div>
            <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-[#111614] tracking-tight">
              {confirming
                ? "Confirmando pago…"
                : refunded
                  ? "Pedido no programado"
                  : paid
                  ? preorder
                    ? "¡Pedido confirmado!"
                    : "¡Pago Confirmado!"
                  : "Pago recibido"}
            </h1>
            <p className="font-body-md text-base sm:text-lg text-[#4E5C56] mt-2 leading-relaxed">
              {confirming
                ? "Estamos notificando a la cocina de la concesión."
                : paid
                ? preorder
                  ? `Tu pedido quedó programado.${pending?.orderNumber ? ` Orden #${pending.orderNumber}.` : ""} Lo preparamos con anticipación para tu horario.`
                  : `Tu pedido ya está en cocina.${pending?.orderNumber ? ` Orden #${pending.orderNumber}.` : ""} Te lo llevan a tu palco.`
                : error || "Tu pedido pasará a cocina en cuanto se valide el cobro."}
            </p>
          </div>

          {paid && preorder && <VipPreorderTicket info={preorder} surface="#FFFFFF" className="w-full text-left" />}
          {paid && guideCode && <VipGuideCodeCard guide={guideCode} />}

          <div className="w-full pt-2 flex flex-col gap-2.5">
            {paid && guideCode && (
              <Link href={`/servicio-palcos/guia/?codigo=${guideCode}`} className="w-full block">
                <VipButton variant="secondary" fullWidth size="lg" className="flex items-center justify-center gap-2">
                  <Radar className="w-4 h-4" />
                  <span>Ver estatus del pedido</span>
                </VipButton>
              </Link>
            )}
            <Link href="/servicio-palcos/inicio" className="w-full block">
              <VipButton
                variant={paid && guideCode ? "outline" : "primary"}
                fullWidth
                size="lg"
                className="flex items-center justify-center gap-2"
              >
                <span>Volver al menú</span>
                <ArrowRight className="w-4 h-4" />
              </VipButton>
            </Link>
          </div>
        </motion.div>
      </main>

      <VipOrderProcessingOverlay
        isOpen={showProcessingOverlay}
        onClose={() => setShowProcessingOverlay(false)}
        estadio="Estadio León"
        zona={pending?.zona || "Oriente"}
        palco={pending?.palco || "1"}
        nivel={pending?.nivel || "Piso 1"}
        customerName={pending?.customerName || "Aficionado"}
        items={pending?.items || []}
        restauranteNombre={pending?.restaurantNombre || "Servicio Palcos"}
        metodoPagoTitulo="Tarjeta digital · Stripe"
        total={pending?.total}
        isPreorder={Boolean(preorder || pending?.isPreorder)}
        preorderWindowLabel={preorder?.windowLabel}
        mode="confirmation"
        isDone={paid && !confirming}
        confirmSettled={!confirming}
        error={error}
        onRetry={() => {
          setError(null);
          setConfirming(true);
          window.location.reload();
        }}
        onAnimationFinished={() => {
          setShowProcessingOverlay(false);
        }}
      />
      <VipLegalLinks className="px-4 pb-6" />
    </div>
  );
}

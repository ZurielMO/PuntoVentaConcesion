"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Utensils, CalendarClock, ShoppingBag } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipCheckoutDetailsCard, type VipCheckoutDetails } from "@/components/vip/cart/checkout-details-card";
import { VipCartItemRow } from "@/components/vip/cart/cart-item-row";
import { VipPaymentSelectorCard } from "@/components/vip/cart/payment-selector-card";
import { VipOrderBreakdownCard } from "@/components/vip/cart/order-breakdown-card";
import { VipButton } from "@/components/vip/ui/button";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { useVipOrders } from "@/hooks/vip/use-vip-orders";
import {
  VIP_STRIPE_PAYMENT_METHOD,
  normalizeVipFloor,
  type VipPreorderSelection,
} from "@/lib/vip/types";
import { isValidMxPhone } from "@/lib/vip/phone";
import { vipToast } from "@/hooks/vip/use-vip-toast";
import { ApiError } from "@/lib/api/client";
import { VipSalesClosedNotice } from "@/components/vip/ui/sales-closed-notice";
import { useVipPublicSalesOpen } from "@/hooks/vip/use-vip-public-sales";
import { useVipPreorderAvailability } from "@/hooks/vip/use-vip-preorder-availability";
import { VipOrderModeSwitch } from "@/components/vip/preorder/order-mode-switch";
import { VipPreorderScheduler } from "@/components/vip/preorder/preorder-scheduler";
import { VipPreorderTicket } from "@/components/vip/preorder/preorder-ticket";
import { vipRestaurantPath } from "@/lib/vip/vip-routes";
import { formatVipMxn } from "@/lib/vip/money";
import {
  VIP_PURCHASE_UNAVAILABLE_HINT,
  VIP_PURCHASE_UNAVAILABLE_TITLE,
} from "@/lib/vip/purchase-availability";
import { motion } from "motion/react";
import { VipLegalConsent } from "@/components/vip/legal/legal-consent";
import { VIP_LEGAL_DOCUMENT_VERSION } from "@/lib/vip/legal-config";

const PURCHASE_UNAVAILABLE = {
  title: VIP_PURCHASE_UNAVAILABLE_TITLE,
  description: VIP_PURCHASE_UNAVAILABLE_HINT,
};

const PURCHASE_UNAVAILABLE_CODES = new Set([
  "VIP_PREORDER_WINDOW_FULL",
  "VIP_PREORDER_WINDOW_CLOSED",
  "VIP_PREORDER_WINDOW_INVALID",
  "VIP_PREORDER_MATCH_UNAVAILABLE",
  "VIP_PREORDER_CLOSED",
  "VIP_OUT_OF_STOCK",
  "VIP_SERVICE_PAUSED",
  "VIP_SERVICE_CLOSED",
  "VIP_NOT_MATCH_DAY",
  "VIP_CAPACITY_REACHED",
  "VIP_NOT_CONFIGURED",
  "VIP_PRODUCT_DISABLED",
]);

const PREORDER_SLOT_RESET_CODES = new Set([
  "VIP_PREORDER_WINDOW_FULL",
  "VIP_PREORDER_WINDOW_CLOSED",
  "VIP_PREORDER_WINDOW_INVALID",
  "VIP_PREORDER_MATCH_UNAVAILABLE",
]);

function checkoutFailure(error: unknown): { title: string; description?: string } {
  if (error instanceof ApiError && error.code && PURCHASE_UNAVAILABLE_CODES.has(error.code)) {
    return PURCHASE_UNAVAILABLE;
  }
  return {
    title: error instanceof Error ? error.message : "No se pudo iniciar el pago con tarjeta.",
  };
}

export default function VipCarritoPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    updateInstructions,
    removeItem,
    subtotal,
    cargoServicio,
    descuento,
    total,
    restaurantId,
    restaurantNombre,
    orderMode,
    setOrderMode,
  } = useVipCart();

  const menuRestaurantId = restaurantId || items[0]?.producto.concesionId || "";
  const menuHref = menuRestaurantId
    ? vipRestaurantPath(menuRestaurantId)
    : "/servicio-palcos/inicio";

  const { createOrder } = useVipOrders();
  const { preordersEnabled, liveOrdersOpen, matchDay, acceptingOrders, ready } = useVipPublicSalesOpen();
  const entregaAhoraAbierta = liveOrdersOpen && matchDay && acceptingOrders;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState<VipCheckoutDetails>({
    name: "",
    email: "",
    phone: "",
    zona: "",
    palco: "",
    nivel: "",
  });

  const isPreorder = orderMode === "PREORDER";

  useEffect(() => {
    if (!ready || entregaAhoraAbierta || !preordersEnabled || orderMode !== "NOW") return;
    setOrderMode("PREORDER");
  }, [ready, entregaAhoraAbierta, preordersEnabled, orderMode, setOrderMode]);

  const preorderAvailability = useVipPreorderAvailability(checkoutDetails.zona, { enabled: isPreorder });
  const [preorderSelection, setPreorderSelection] = useState<VipPreorderSelection | null>(null);
  const schedulerRef = useRef<HTMLDivElement>(null);

  const selectedMatch =
    preorderAvailability.data?.matches.find((match) => match.matchId === preorderSelection?.matchId) ||
    (preorderAvailability.data?.matches.length === 1 ? preorderAvailability.data.matches[0] : null);
  const selectedWindow =
    selectedMatch?.windows.find(
      (window) => preorderSelection?.matchId === selectedMatch.matchId && window.start === preorderSelection.windowStart,
    ) || null;

  const staleWindow =
    Boolean(preorderSelection?.windowStart) &&
    Boolean(preorderAvailability.data) &&
    (!selectedWindow || !selectedWindow.available);

  useEffect(() => {
    if (!staleWindow || !preorderSelection) return;
    setPreorderSelection({ matchId: preorderSelection.matchId, windowStart: "" });
    vipToast.info(VIP_PURCHASE_UNAVAILABLE_TITLE, {
      id: "vip-preorder-window-stale",
      description: VIP_PURCHASE_UNAVAILABLE_HINT,
    });
  }, [staleWindow, preorderSelection]);

  const finalTotal = total;
  const canSubmit = isPreorder ? preordersEnabled : entregaAhoraAbierta;
  const payLabel = isPreorder ? `Pagar preventa ${formatVipMxn(finalTotal)}` : `Pagar con tarjeta ${formatVipMxn(finalTotal)}`;

  const focusScheduler = () => {
    schedulerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if ((isPreorder && !preordersEnabled) || (!isPreorder && !entregaAhoraAbierta)) {
      vipToast.error(VIP_PURCHASE_UNAVAILABLE_TITLE, { description: VIP_PURCHASE_UNAVAILABLE_HINT });
      return;
    }
    const name = checkoutDetails.name.trim();
    const email = checkoutDetails.email.trim();
    const phone = checkoutDetails.phone.trim();
    const palco = checkoutDetails.palco.trim();

    if (name.length < 2) {
      vipToast.error("Escribe tu nombre para la entrega en el palco.");
      return;
    }
    if (!email.includes("@") || !email.split("@")[1]?.includes(".")) {
      vipToast.error("Escribe un correo válido para tu recibo.");
      return;
    }
    if (!isValidMxPhone(phone)) {
      vipToast.error("Escribe un teléfono de 10 dígitos para contactarte en el palco.");
      return;
    }
    if (!palco) {
      vipToast.error("Indica el número de palco al que debemos entregar.");
      return;
    }
    if (checkoutDetails.zona !== "Oriente" && checkoutDetails.zona !== "Poniente") {
      vipToast.error("Elige Oriente o Poniente para la entrega.");
      return;
    }
    const piso = normalizeVipFloor(checkoutDetails.zona, checkoutDetails.nivel);
    if (!piso) {
      vipToast.error(
        checkoutDetails.zona === "Oriente"
          ? "Elige el piso 1, 2 o 3 para Oriente."
          : "Elige el piso 1 o 2 para Poniente.",
      );
      return;
    }
    if (isPreorder && preorderAvailability.data && preorderAvailability.data.matches.length === 0) {
      vipToast.error(VIP_PURCHASE_UNAVAILABLE_TITLE, { description: VIP_PURCHASE_UNAVAILABLE_HINT });
      focusScheduler();
      return;
    }
    if (isPreorder && !selectedMatch) {
      vipToast.error("Elige el partido de tu preventa.");
      focusScheduler();
      return;
    }
    if (isPreorder && (!selectedWindow || !selectedWindow.available)) {
      vipToast.error("Elige el horario en que quieres recibir tu pedido.");
      focusScheduler();
      return;
    }
    if (!legalAccepted) {
      vipToast.error("Acepta los términos, el aviso de privacidad y la política de cookies para continuar.");
      return;
    }
    if (!isPreorder && items.some((item) => item.producto.disponible === false)) {
      vipToast.error(VIP_PURCHASE_UNAVAILABLE_TITLE, {
        description: VIP_PURCHASE_UNAVAILABLE_HINT,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newOrder = await createOrder({
        restauranteId: restaurantId || items[0]?.producto.concesionId || "",
        restauranteNombre: restaurantNombre || "Servicio Palcos",
        restauranteLogo: items[0]?.producto.imagen || "",
        customer: { name, email, phone },
        delivery: {
          zona: checkoutDetails.zona,
          palco,
          nivel: piso,
        },
        items: [...items],
        subtotal,
        cargoServicio,
        descuento,
        propina: 0,
        total: finalTotal,
        metodoPago: VIP_STRIPE_PAYMENT_METHOD,
        legalAcceptance: { accepted: true, version: VIP_LEGAL_DOCUMENT_VERSION },
        preorder: isPreorder && selectedMatch && selectedWindow
          ? { match: selectedMatch, window: selectedWindow }
          : null,
      });

      if (!newOrder.checkoutUrl) {
        throw new Error("No se pudo obtener la URL de pago.");
      }

      window.location.assign(newOrder.checkoutUrl);
    } catch (error) {
      const failure = checkoutFailure(error);
      vipToast.error(failure.title, failure.description ? { description: failure.description } : undefined);
      if (error instanceof ApiError && error.code && PREORDER_SLOT_RESET_CODES.has(error.code)) {
        setPreorderSelection((prev) => (prev ? { matchId: prev.matchId, windowStart: "" } : prev));
        void preorderAvailability.reload(true);
        focusScheduler();
      }
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen pb-28 bg-[#F8FAF9] text-[#111827]">
        <VipTopBar
          variant="linear"
          title="Mi Carrito"
          subtitle="Servicio Palcos VIP · Club León"
          onBack={() => router.push("/servicio-palcos/inicio")}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-[#0D4A34]/8 border border-[#0D4A34]/15 flex items-center justify-center text-[#0D4A34] shadow-sm -mt-2">
            <ShoppingBag className="w-10 h-10 text-[#C5A059]" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-montserrat)] text-2xl font-extrabold text-[#111827] tracking-tight">
              Tu carrito está vacío
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#4B5563] mt-1 max-w-xs leading-relaxed">
              Explora los diferentes restaurantes del Estadio León para ordenar directo a tu palco.
            </p>
          </div>
          <Link
            href="/servicio-palcos/inicio"
            className="mt-2 h-12 px-6 bg-gradient-to-r from-[#062E20] to-[#0D4A34] hover:from-[#093E2B] hover:to-[#115C41] text-white font-[family-name:var(--font-montserrat)] font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(6,46,32,0.22)] active:scale-95 cursor-pointer border border-[#C5A059]/30"
          >
            <ArrowLeft className="w-4 h-4 text-[#E6C687]" />
            <span>Explorar Concesiones</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${isPreorder ? "pb-80" : "pb-72"} lg:pb-16 bg-[#F8FAF9] text-[#111827]`}>
      {/* Top Header */}
      <VipTopBar
        variant="linear"
        title={isPreorder ? "Confirmar Preventa" : "Confirmar Pedido"}
        subtitle={isPreorder ? "Entrega programada en tu palco" : "Entrega Exclusiva en Palco"}
        onBack={() => router.push(menuHref)}
      />

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8"
      >
        {/* Desktop 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
          {/* Left Column: Form Details & Items */}
          <div className="flex flex-col gap-6">
            <VipOrderModeSwitch
              value={orderMode}
              onChange={setOrderMode}
              nowAvailable={entregaAhoraAbierta}
              nowClosedLabel={VIP_PURCHASE_UNAVAILABLE_TITLE}
              preorderAvailable={preordersEnabled}
            />

            <VipCheckoutDetailsCard
              value={checkoutDetails}
              onChange={setCheckoutDetails}
              totalSteps={isPreorder ? 3 : 2}
            />

            {isPreorder && preordersEnabled && (
              <div ref={schedulerRef} className="scroll-mt-28">
                <VipPreorderScheduler
                  availability={preorderAvailability.data}
                  loading={preorderAvailability.loading}
                  error={preorderAvailability.error}
                  zona={checkoutDetails.zona}
                  value={preorderSelection}
                  onChange={setPreorderSelection}
                  onRetry={() => void preorderAvailability.reload()}
                  stepLabel="Paso 3 de 3"
                />
              </div>
            )}

            {/* Cart Items Section */}
            <section className="flex flex-col gap-3.5">
              <div className="flex justify-between items-center border-b border-[#DFE5E2] pb-3 gap-3">
                <h3 className="font-headline-md text-xl sm:text-2xl font-extrabold text-[#111614] tracking-tight">
                  Productos en la Orden
                </h3>
                <Link
                  href={menuHref}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-xl text-sm sm:text-base font-headline-md font-bold text-[#187B56] hover:text-[#136244] hover:bg-[#187B56]/8 border border-transparent hover:border-[#187B56]/20 transition-colors"
                >
                  <Utensils className="w-4 h-4" />
                  Volver al menú
                </Link>
              </div>

              <p className="text-sm font-medium leading-snug text-[#4E5C56]">
                No olvides dejar un comentario si es que el producto requiere algo especial.
              </p>

              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <VipCartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onUpdateInstructions={updateInstructions}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Payment Method, Breakdown & Sticky Checkout Action */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24">
            {isPreorder && selectedMatch && selectedWindow && (
              <VipPreorderTicket
                info={{
                  jornadaNumero: selectedMatch.jornadaNumero,
                  matchLabel: selectedMatch.matchLabel,
                  matchDate: selectedMatch.matchDate,
                  kickoffAt: selectedMatch.kickoffAt,
                  stadium: selectedMatch.stadium,
                  windowLabel: selectedWindow.label,
                  windowStartAt: selectedWindow.startAt,
                }}
                palco={checkoutDetails.palco.trim() || null}
              />
            )}

            {/* Payment Method Card */}
            <VipPaymentSelectorCard />

            <VipOrderBreakdownCard
              subtotal={subtotal}
              cargoServicio={cargoServicio}
              total={total}
            />

            {!canSubmit && <VipSalesClosedNotice />}

            <div className="hidden lg:block">
              <VipLegalConsent accepted={legalAccepted} onChange={setLegalAccepted} />
            </div>

            {/* Desktop Pay CTA */}
            <div className="hidden lg:flex flex-col gap-2.5">
              <VipButton
                onClick={handleCheckout}
                loading={isSubmitting}
                disabled={!canSubmit || !legalAccepted}
                variant="primary"
                size="lg"
                fullWidth
                className="font-headline-md font-extrabold text-lg min-h-[54px] tracking-wide shadow-md cursor-pointer"
              >
                {payLabel}
              </VipButton>
              {isPreorder && (
                <p className="text-center text-sm text-[#6E7E77]">
                  Recibirás por correo tu guía de pedido para seguir el proceso de entrega.
                </p>
              )}
              <VipButton
                type="button"
                variant="outline"
                size="md"
                fullWidth
                className="font-headline-md font-bold text-base"
                onClick={() => router.push(menuHref)}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al menú
              </VipButton>
              <div className="flex items-center justify-center gap-1.5 text-sm text-[#7E8E87] font-medium text-center">
                <ShieldCheck className="w-4 h-4 text-[#187B56]" />
                <span>Transacción segura</span>
              </div>
            </div>
          </div>
        </div>
      </motion.main>

      {/* Fixed Bottom Checkout Action for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DFE5E2] px-4 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(10,28,22,0.14)]">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          <VipLegalConsent accepted={legalAccepted} onChange={setLegalAccepted} compact />
          {isPreorder && (
            <button
              type="button"
              onClick={focusScheduler}
              className="flex items-center gap-2 rounded-xl bg-[#102D24] px-3.5 py-2 text-left text-white cursor-pointer"
            >
              <CalendarClock className="h-4 w-4 shrink-0 text-[#FADC06]" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {selectedMatch && selectedWindow
                  ? `Partido ${selectedMatch.jornadaNumero} · ${selectedMatch.matchLabel}`
                  : "Elige partido y horario de entrega"}
              </span>
              {selectedWindow && (
                <span className="shrink-0 font-headline-md text-sm font-black tabular-nums text-[#FADC06]">
                  {selectedWindow.label}
                </span>
              )}
            </button>
          )}
          <VipButton
            onClick={handleCheckout}
            loading={isSubmitting}
            disabled={!canSubmit || !legalAccepted}
            variant="primary"
            size="lg"
            fullWidth
            className="font-headline-md font-black text-lg min-h-[56px] shadow-lg cursor-pointer tracking-tight"
          >
            {payLabel}
          </VipButton>
          <div className="flex items-center justify-between px-1">
            <Link
              href={menuHref}
              className="inline-flex items-center gap-1.5 min-h-[38px] text-sm sm:text-base font-headline-md font-bold text-[#187B56]"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al menú
            </Link>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#7E8E87] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#187B56]" />
              <span>Pago seguro con tarjeta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

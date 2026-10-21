"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Plus, ShoppingBag } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import {
  VipCheckoutDetailsCard,
  validateContact,
  type VipCheckoutDetails,
} from "@/components/vip/cart/checkout-details-card";
import { VipCheckoutSection } from "@/components/vip/cart/checkout-section";
import { VipCartItemRow } from "@/components/vip/cart/cart-item-row";
import { VipPaymentSelectorCard } from "@/components/vip/cart/payment-selector-card";
import { VipOrderBreakdownCard } from "@/components/vip/cart/order-breakdown-card";
import { VipPalcoFields, validatePalco } from "@/components/vip/location/palco-fields";
import { VipRememberPalco } from "@/components/vip/location/palco-sheet";
import { VipButton } from "@/components/vip/ui/button";
import { VipSkeleton } from "@/components/vip/ui/skeleton";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { useVipOrders } from "@/hooks/vip/use-vip-orders";
import { useVipSavedPalco } from "@/hooks/vip/use-vip-saved-palco";
import { VIP_STRIPE_PAYMENT_METHOD, normalizeVipFloor, type VipCartItem, type VipPreorderSelection } from "@/lib/vip/types";
import { vipToast } from "@/hooks/vip/use-vip-toast";
import { ApiError } from "@/lib/api/client";
import { useVipPublicSalesOpen } from "@/hooks/vip/use-vip-public-sales";
import { useVipPreorderAvailability } from "@/hooks/vip/use-vip-preorder-availability";
import { VipOrderModeSwitch } from "@/components/vip/preorder/order-mode-switch";
import { VipPreorderScheduler } from "@/components/vip/preorder/preorder-scheduler";
import { VipPreorderTicket } from "@/components/vip/preorder/preorder-ticket";
import { vipRestaurantPath } from "@/lib/vip/vip-routes";
import { formatVipPrice } from "@/lib/vip/money";
import { VipService } from "@/lib/vip/vip-service";
import {
  VIP_PURCHASE_UNAVAILABLE_HINT,
  VIP_PURCHASE_UNAVAILABLE_TITLE,
} from "@/lib/vip/purchase-availability";
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

type FieldKey = "zona" | "nivel" | "palco" | "preorder" | "name" | "email" | "phone" | "legal";
const FIELD_ORDER: FieldKey[] = ["zona", "nivel", "palco", "preorder", "name", "email", "phone", "legal"];

function focusField(field: FieldKey) {
  const target =
    field === "preorder"
      ? document.getElementById("checkout-preorder")
      : document.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable =
    target.matches("input, textarea, button")
      ? target
      : target.querySelector<HTMLElement>('input, button[aria-checked="true"], button:not([disabled])');
  window.setTimeout(() => focusable?.focus({ preventScroll: true }), 350);
}

function CartSkeleton() {
  return (
    <div aria-hidden className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-5 md:px-6 lg:grid-cols-[1fr_24rem] lg:gap-6">
      <div className="flex flex-col gap-4">
        <VipSkeleton className="h-20 w-full rounded-[var(--radius-palco-lg)]" />
        <VipSkeleton className="h-64 w-full rounded-[var(--radius-palco-lg)]" />
      </div>
      <VipSkeleton className="h-56 w-full rounded-[var(--radius-palco-lg)]" />
    </div>
  );
}

export default function VipCarritoPage() {
  const router = useRouter();
  const {
    ready: cartReady,
    items,
    updateQuantity,
    updateInstructions,
    removeItem,
    subtotal,
    cargoServicio,
    descuento,
    total,
    totalItems,
    restaurantId,
    restaurantNombre,
    orderMode,
    setOrderMode,
  } = useVipCart();
  const savedPalco = useVipSavedPalco();

  const menuRestaurantId = restaurantId || items[0]?.producto.concesionId || "";
  const menuHref = menuRestaurantId ? vipRestaurantPath(menuRestaurantId) : "/servicio-palcos/inicio";

  const { createOrder } = useVipOrders();
  const { preordersEnabled, liveOrdersOpen, matchDay, acceptingOrders, ready } = useVipPublicSalesOpen();
  const entregaAhoraAbierta = liveOrdersOpen && matchDay && acceptingOrders;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [rememberPalco, setRememberPalco] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState<VipCheckoutDetails>({
    name: "",
    email: "",
    phone: "",
    zona: "",
    palco: "",
    nivel: "",
  });
  const [touched, setTouched] = useState<Set<FieldKey>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});

  const isPreorder = orderMode === "PREORDER";

  // El palco guardado (o elegido en inicio) llena la entrega; el aficionado puede cambiarlo.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !savedPalco.palco) return;
    prefilled.current = true;
    const { zona, nivel, palco } = savedPalco.palco;
    setCheckoutDetails((prev) => (prev.zona || prev.palco ? prev : { ...prev, zona, nivel, palco }));
    setRememberPalco(savedPalco.remembered);
  }, [savedPalco.palco, savedPalco.remembered]);

  // Nombres de los establecimientos para agrupar el pedido (solo presentación).
  useEffect(() => {
    let active = true;
    VipService.getRestaurants().then((list) => {
      if (active) setRestaurantNames(Object.fromEntries(list.map((row) => [row.id, row.nombre])));
    });
    return () => {
      active = false;
    };
  }, []);

  // Al volver de Stripe con "atrás" la página puede restaurarse desde caché: se libera el botón.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      submittingRef.current = false;
      setIsSubmitting(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  useEffect(() => {
    if (!ready || entregaAhoraAbierta || !preordersEnabled || orderMode !== "NOW") return;
    setOrderMode("PREORDER");
  }, [ready, entregaAhoraAbierta, preordersEnabled, orderMode, setOrderMode]);

  const preorderAvailability = useVipPreorderAvailability(checkoutDetails.zona, { enabled: isPreorder });
  const [preorderSelection, setPreorderSelection] = useState<VipPreorderSelection | null>(null);

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
      description: "El horario que elegiste ya no está disponible. Elige otro.",
    });
  }, [staleWindow, preorderSelection]);

  const finalTotal = total;
  const canSubmit = isPreorder ? preordersEnabled : entregaAhoraAbierta;
  const noMatches = Boolean(isPreorder && preorderAvailability.data && preorderAvailability.data.matches.length === 0);

  // Errores calculados del estado actual: se corrigen solos mientras el aficionado escribe.
  const errors = useMemo(() => {
    const result: Partial<Record<FieldKey, string>> = {
      ...validatePalco({ zona: checkoutDetails.zona, nivel: checkoutDetails.nivel, palco: checkoutDetails.palco }),
      ...validateContact(checkoutDetails),
    };
    if (isPreorder && (noMatches || !selectedMatch || !selectedWindow || !selectedWindow.available)) {
      result.preorder = noMatches ? VIP_PURCHASE_UNAVAILABLE_TITLE : !selectedMatch ? "Elige el partido de tu preventa." : "Elige el horario de entrega.";
    }
    if (!legalAccepted) result.legal = "Acepta los términos, el aviso de privacidad y la política de cookies para continuar.";
    return result;
  }, [checkoutDetails, isPreorder, noMatches, selectedMatch, selectedWindow, legalAccepted]);

  const shown = (field: FieldKey) => (attempted || touched.has(field) ? errors[field] : undefined);
  const touch = (field: FieldKey) => setTouched((prev) => (prev.has(field) ? prev : new Set(prev).add(field)));
  const pendingCount = FIELD_ORDER.filter((field) => errors[field]).length;

  // Sin existencia para entrega inmediata: la regla de siempre bloquea el pago en ese modo.
  const unavailableNow = !isPreorder ? items.filter((item) => item.producto.disponible === false) : [];

  const groups = useMemo(() => {
    const map = new Map<string, VipCartItem[]>();
    for (const item of items) {
      const key = item.producto.concesionId || "otros";
      map.set(key, [...(map.get(key) || []), item]);
    }
    return [...map.entries()].map(([id, list]) => ({
      id,
      name: restaurantNames[id] || (id === restaurantId ? restaurantNombre : null),
      items: list,
    }));
  }, [items, restaurantNames, restaurantId, restaurantNombre]);

  const handleCheckout = async () => {
    if (items.length === 0 || submittingRef.current) return;
    if ((isPreorder && !preordersEnabled) || (!isPreorder && !entregaAhoraAbierta)) {
      vipToast.error(VIP_PURCHASE_UNAVAILABLE_TITLE, { description: VIP_PURCHASE_UNAVAILABLE_HINT });
      return;
    }
    setAttempted(true);
    const firstInvalid = FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalid) {
      if (firstInvalid === "preorder" && noMatches) {
        vipToast.error(VIP_PURCHASE_UNAVAILABLE_TITLE, { description: VIP_PURCHASE_UNAVAILABLE_HINT });
      }
      focusField(firstInvalid);
      return;
    }
    if (unavailableNow.length > 0) {
      vipToast.error(VIP_PURCHASE_UNAVAILABLE_TITLE, {
        description: `${unavailableNow.map((item) => item.producto.nombre).join(", ")} no tiene existencia para entrega inmediata.`,
      });
      return;
    }

    const name = checkoutDetails.name.trim();
    const email = checkoutDetails.email.trim();
    const phone = checkoutDetails.phone.trim();
    const palco = checkoutDetails.palco.trim();
    const zona = checkoutDetails.zona;
    const piso = zona ? normalizeVipFloor(zona, checkoutDetails.nivel) : null;
    if (!zona || !piso) {
      focusField("nivel");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    savedPalco.save({ zona, nivel: piso, palco }, rememberPalco);

    try {
      const newOrder = await createOrder({
        restauranteId: restaurantId || items[0]?.producto.concesionId || "",
        restauranteNombre: restaurantNombre || "Servicio Palcos",
        restauranteLogo: items[0]?.producto.imagen || "",
        customer: { name, email, phone },
        delivery: { zona, palco, nivel: piso },
        items: [...items],
        subtotal,
        cargoServicio,
        descuento,
        propina: 0,
        total: finalTotal,
        metodoPago: VIP_STRIPE_PAYMENT_METHOD,
        legalAcceptance: { accepted: true, version: VIP_LEGAL_DOCUMENT_VERSION },
        preorder: isPreorder && selectedMatch && selectedWindow ? { match: selectedMatch, window: selectedWindow } : null,
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
        focusField("preorder");
      }
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const topBar = (
    <VipTopBar
      variant="linear"
      title={isPreorder ? "Confirmar preventa" : "Tu pedido"}
      subtitle={items.length > 0 ? `${totalItems} ${totalItems === 1 ? "producto" : "productos"} · entrega en tu palco` : undefined}
      onBack={() => router.push(menuHref)}
      hideCart
    />
  );

  if (!cartReady) {
    return (
      <div className="flex min-h-screen flex-col">
        {topBar}
        <CartSkeleton />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        {topBar}
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-palco-sunken text-palco-ink-3">
            <ShoppingBag aria-hidden className="size-7" />
          </span>
          <h2 className="mt-4 font-palco-display text-xl font-bold text-palco-ink">Tu carrito está vacío</h2>
          <p className="mt-1 text-sm text-palco-ink-3">Elige algo del menú del estadio y te lo llevamos a tu palco.</p>
          <Link
            href="/servicio-palcos/inicio"
            className="palco-press mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-palco-700 px-6 font-palco-display text-[15px] font-bold text-white hover:bg-palco-600"
          >
            Ver el menú
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </main>
      </div>
    );
  }

  const payLabel = !ready
    ? "Consultando disponibilidad…"
    : !canSubmit
    ? "No disponible por ahora"
    : `${isPreorder ? "Pagar preventa" : "Pagar"} ${formatVipPrice(finalTotal, { cents: "always" })}`;

  return (
    <div className="flex min-h-screen flex-col pb-36 lg:pb-16">
      {topBar}

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-4 px-4 py-5 md:px-6 lg:grid-cols-[1fr_24rem] lg:gap-6 lg:py-8">
        <div className="flex flex-col gap-4">
          <VipCheckoutSection id="checkout-mode" title="¿Cuándo lo quieres?">
            {ready ? (
              <VipOrderModeSwitch
                value={orderMode}
                onChange={setOrderMode}
                nowAvailable={entregaAhoraAbierta}
                preorderAvailable={preordersEnabled}
              />
            ) : (
              <div aria-hidden className="grid grid-cols-2 gap-2">
                <VipSkeleton className="h-[4.5rem] rounded-[var(--radius-palco-md)]" />
                <VipSkeleton className="h-[4.5rem] rounded-[var(--radius-palco-md)]" />
              </div>
            )}
            {ready && !entregaAhoraAbierta && preordersEnabled && (
              <p className="mt-3 text-sm text-palco-ink-3">
                Hoy no hay entrega inmediata: tu pedido se programa para un partido y eliges el horario abajo.
              </p>
            )}
          </VipCheckoutSection>

          <VipCheckoutSection
            id="checkout-items"
            title="Tu pedido"
            action={
              <Link
                href={menuHref}
                className="palco-press -mr-2 flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-palco-700 hover:bg-palco-50"
              >
                <Plus aria-hidden className="size-4" />
                Agregar más
              </Link>
            }
          >
            <div className="flex flex-col gap-5">
              {groups.map((group) => (
                <div key={group.id}>
                  {(groups.length > 1 || group.name) && group.name && (
                    <h3 className="mb-3 text-[13px] font-semibold text-palco-ink-3">{group.name}</h3>
                  )}
                  <ul className="divide-y divide-palco-line">
                    {group.items.map((item) => (
                      <VipCartItemRow
                        key={item.id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onUpdateInstructions={updateInstructions}
                        onRemove={removeItem}
                        warning={
                          !isPreorder && item.producto.disponible === false
                            ? "Sin existencia para entrega inmediata. Puedes quitarlo o pedirlo en preventa."
                            : undefined
                        }
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </VipCheckoutSection>

          <VipCheckoutSection id="checkout-palco" title="Entrega en tu palco" description="Oriente o Poniente, piso y número de palco.">
            <VipPalcoFields
              value={{ zona: checkoutDetails.zona, nivel: checkoutDetails.nivel, palco: checkoutDetails.palco }}
              onChange={(next) => setCheckoutDetails((prev) => ({ ...prev, ...next }))}
              errors={{ zona: shown("zona"), nivel: shown("nivel"), palco: shown("palco") }}
              onBlurField={(field) => touch(field)}
            />
            <div className="mt-4">
              <VipRememberPalco checked={rememberPalco} onChange={setRememberPalco} />
            </div>
          </VipCheckoutSection>

          {isPreorder && preordersEnabled && (
            <VipCheckoutSection id="checkout-preorder" title="Partido y horario de entrega">
              <VipPreorderScheduler
                availability={preorderAvailability.data}
                loading={preorderAvailability.loading}
                error={preorderAvailability.error}
                zona={checkoutDetails.zona}
                value={preorderSelection}
                onChange={setPreorderSelection}
                onRetry={() => void preorderAvailability.reload()}
                invalid={Boolean(shown("preorder"))}
              />
            </VipCheckoutSection>
          )}

          <VipCheckoutSection id="checkout-contact" title="Tus datos">
            <VipCheckoutDetailsCard
              value={checkoutDetails}
              onChange={setCheckoutDetails}
              errors={{ name: shown("name"), email: shown("email"), phone: shown("phone") }}
              onBlurField={(field) => touch(field)}
            />
          </VipCheckoutSection>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label="Resumen y pago">
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

          <VipCheckoutSection id="checkout-summary" title="Resumen">
            <VipOrderBreakdownCard subtotal={subtotal} cargoServicio={cargoServicio} total={total} itemCount={totalItems} />
          </VipCheckoutSection>

          <VipCheckoutSection id="checkout-payment" title="Pago">
            <VipPaymentSelectorCard />
            <div className="mt-4">
              <VipLegalConsent accepted={legalAccepted} onChange={setLegalAccepted} error={shown("legal")} />
            </div>

            {ready && !canSubmit && (
              <div role="status" className="mt-4 flex items-start gap-3 rounded-[var(--radius-palco-md)] bg-palco-warning-50 px-4 py-3">
                <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-palco-warning" />
                <p className="text-sm text-palco-ink">
                  <span className="font-semibold">{VIP_PURCHASE_UNAVAILABLE_TITLE}.</span> {VIP_PURCHASE_UNAVAILABLE_HINT} Tu
                  carrito se queda guardado.
                </p>
              </div>
            )}

            <div className="mt-5 hidden flex-col gap-2 lg:flex">
              {attempted && pendingCount > 0 && (
                <p className="text-sm font-medium text-palco-danger" role="alert">
                  Revisa {pendingCount === 1 ? "el dato marcado" : `los ${pendingCount} datos marcados`} para continuar.
                </p>
              )}
              <VipButton
                onClick={handleCheckout}
                loading={isSubmitting}
                loadingLabel="Abriendo el pago seguro…"
                disabled={!canSubmit}
                size="lg"
                fullWidth
                className="palco-num"
              >
                {payLabel}
              </VipButton>
              {isPreorder && (
                <p className="text-center text-[13px] text-palco-ink-3">Recibirás por correo la guía para seguir tu pedido.</p>
              )}
            </div>
          </VipCheckoutSection>
        </aside>
      </main>

      {/* Barra de pago fija en el teléfono */}
      <div className="palco-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-palco-line bg-palco-surface px-4 pt-3 shadow-palco-sheet lg:hidden">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {attempted && pendingCount > 0 && (
            <p className="text-[13px] font-medium text-palco-danger" role="alert">
              Revisa {pendingCount === 1 ? "el dato marcado" : `los ${pendingCount} datos marcados`} para continuar.
            </p>
          )}
          <div className="flex items-center gap-4">
            <div className="palco-num shrink-0">
              <span className="block text-xs text-palco-ink-3">Total</span>
              <span className="block font-palco-display text-lg font-extrabold leading-tight text-palco-ink">
                {formatVipPrice(finalTotal, { cents: "always" })}
              </span>
            </div>
            <VipButton
              onClick={handleCheckout}
              loading={isSubmitting}
              loadingLabel="Abriendo pago…"
              disabled={!canSubmit}
              size="lg"
              fullWidth
            >
              {!ready ? "Consultando…" : canSubmit ? (isPreorder ? "Pagar preventa" : "Ir a pagar") : "No disponible"}
              {canSubmit && <ArrowRight aria-hidden className="size-4" />}
            </VipButton>
          </div>
        </div>
      </div>
    </div>
  );
}

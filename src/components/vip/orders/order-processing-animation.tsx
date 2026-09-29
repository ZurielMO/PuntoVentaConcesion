"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Check, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatVipMxn } from "@/lib/vip/money";
import { VipMascot } from "@/components/vip/ui/mascot";
import type { VipMascotName } from "@/lib/vip/mascot";

export interface VipOrderProcessingItem {
  nombre: string;
  cantidad: number;
  precio?: number;
  opciones?: string[];
}

export interface VipOrderProcessingProps {
  isOpen: boolean;
  onClose?: () => void;
  // Delivery details
  estadio?: string;
  zona?: string;
  palco?: string;
  nivel?: string;
  // Customer
  customerName?: string;
  // Items
  items?: VipOrderProcessingItem[];
  // Concession / Restaurant
  restauranteNombre?: string;
  // Payment
  metodoPagoTitulo?: string;
  total?: number;
  isPreorder?: boolean;
  preorderWindowLabel?: string;
  // Flow control
  mode?: "checkout" | "confirmation";
  isDone?: boolean;
  /** La confirmación con el servidor ya terminó, aunque el pago siga sin acreditarse. */
  confirmSettled?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAnimationFinished?: () => void;
}

export const VipOrderProcessingOverlay: React.FC<VipOrderProcessingProps> = ({
  isOpen,
  onClose,
  estadio = "Estadio León",
  zona = "Oriente",
  palco = "1",
  nivel,
  customerName = "Aficionado",
  items = [],
  restauranteNombre = "Servicio Palcos",
  metodoPagoTitulo = "Tarjeta digital",
  total,
  isPreorder = false,
  preorderWindowLabel,
  mode = "checkout",
  isDone = false,
  confirmSettled = false,
  error = null,
  onRetry,
  onAnimationFinished,
}) => {
  // Staggered step progression (0: step 1 running, 1: step 1 done & step 2 running, etc.)
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState<boolean>(false);

  // Trigger haptic vibration on mobile if available
  const triggerHaptic = (pattern = [15, 25]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored if browser prevents it
      }
    }
  };

  // Reset or run step-by-step sequence when opened
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setMinTimeElapsed(false);
      return;
    }

    let isMounted = true;
    setCurrentStep(0);
    setMinTimeElapsed(false);

    // Stagger step 1 -> step 2 -> step 3
    const t1 = setTimeout(() => {
      if (!isMounted) return;
      setCurrentStep(1);
      triggerHaptic();
    }, 700);

    const t2 = setTimeout(() => {
      if (!isMounted) return;
      setCurrentStep(2);
      triggerHaptic();
    }, 1500);

    const t3 = setTimeout(() => {
      if (!isMounted) return;
      setCurrentStep(3);
      triggerHaptic();
    }, 2300);

    const t4 = setTimeout(() => {
      if (!isMounted) return;
      setMinTimeElapsed(true);
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen]);

  // When step 3 reached AND server is done (or minTimeElapsed if done already)
  const isAllCompleted = isDone && minTimeElapsed && !error;
  const awaitingValidation = confirmSettled && !isDone && !error;

  useEffect(() => {
    if (isAllCompleted && onAnimationFinished) {
      triggerHaptic([30, 40, 50]);
      const t = setTimeout(() => {
        onAnimationFinished();
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [isAllCompleted, onAnimationFinished]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Format delivery location
  const deliveryLocationSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (palco) parts.push(`Palco ${palco}`);
    if (zona) parts.push(zona);
    if (nivel) parts.push(nivel);
    return parts.length > 0 ? parts.join(" · ") : "Entrega en palco";
  }, [palco, zona, nivel]);

  const mascot: VipMascotName = error
    ? "pagos"
    : isAllCompleted
      ? "ordenConfirmada"
      : currentStep >= 3
        ? "comida"
        : currentStep >= 2
          ? "pagos"
          : currentStep >= 1
            ? "comida"
            : "inicio";

  const canDismiss = Boolean(error) || isAllCompleted || awaitingValidation || mode === "checkout";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Procesando pedido"
        className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-[#F6F8F7]"
      >
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#187B56]/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#FADC06]/25 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative z-10 flex min-h-screen w-full flex-col justify-between gap-4 bg-[#F6F8F7] p-5 text-[#111614] pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:min-h-0 sm:max-w-md sm:justify-start sm:rounded-3xl sm:border sm:border-[#DFE5E2] sm:bg-white sm:p-7 sm:shadow-[0_24px_60px_rgba(16,45,36,0.12)]"
        >
          {/* Top Row: Back button (disabled or clean dismiss) */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={!canDismiss}
              className={`flex h-10 w-10 -ml-2 items-center justify-center rounded-full transition-all ${
                canDismiss
                  ? "cursor-pointer text-[#187B56] hover:bg-[#187B56]/10 active:scale-95"
                  : "cursor-not-allowed text-[#111614]/25"
              }`}
              aria-label="Cerrar o volver"
            >
              <ArrowLeft className="h-5 w-5 stroke-[2.2]" />
            </button>

            <div className="flex items-center gap-1.5 rounded-full border border-[#187B56]/20 bg-white px-3 py-1 text-[11px] font-bold text-[#187B56]">
              <span
                className={`h-2 w-2 rounded-full ${
                  error ? "animate-ping bg-red-500" : isAllCompleted ? "bg-[#187B56]" : "animate-pulse bg-[#FADC06]"
                }`}
              />
              <span>
                {error ? "Atención requerida" : isAllCompleted ? "Confirmado" : isPreorder ? "Preventa" : "En progreso"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <motion.div
              key={mascot}
              initial={{ opacity: 0, scale: 0.86, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="flex items-center justify-center"
            >
              <VipMascot name={mascot} size="empty" priority className="w-[168px] sm:w-[196px]" />
            </motion.div>
            <h2 className="font-headline-md text-2xl font-extrabold tracking-tight text-[#111614] sm:text-[26px]">
              {error
                ? "Hubo un inconveniente"
                : isAllCompleted
                  ? "¡Pedido confirmado!"
                  : awaitingValidation
                    ? "Pago recibido"
                    : "Un momento por favor"}
            </h2>
            <p className="mt-1 max-w-xs text-sm font-medium text-[#4E5C56]">
              {error
                ? "No se pudo completar el paso. Revisa los datos."
                : isAllCompleted
                  ? "Tu orden ya se está preparando en cocina."
                  : awaitingValidation
                    ? "Tu pedido pasará a cocina en cuanto se valide el cobro."
                    : "Validando tu pago y avisando a la cocina."}
            </p>
          </div>

          {/* Checklist Sections with dividers */}
          <div className="my-1 flex flex-1 flex-col divide-y divide-[#DFE5E2] rounded-2xl border border-[#DFE5E2] bg-white px-3">
            {/* ITEM 1: ESTADIO LEÓN / UBICACIÓN */}
            <div className="py-4 flex items-start gap-4 transition-all">
              <StepCheckIcon state={currentStep >= 1 ? "checked" : "loading"} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold tracking-tight text-[#111614]">
                    {estadio}
                  </h3>
                  <span className="rounded-full bg-[#187B56] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    VIP
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-medium text-[#4E5C56] sm:text-sm">
                  {deliveryLocationSubtitle}
                </p>
                <span className="mt-0.5 inline-block text-[11px] text-[#7E8E87]">
                  En mano en tu palco
                </span>
              </div>
            </div>

            {/* ITEM 2: TU PEDIDO + PRODUCTOS */}
            <div className="py-4 flex items-start gap-4 transition-all">
              <StepCheckIcon
                state={currentStep >= 2 ? "checked" : currentStep === 1 ? "loading" : "pending"}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold tracking-tight text-[#111614]">
                  Tu pedido, {customerName}
                </h3>

                {/* Items breakdown pills */}
                <div className="mt-2 flex flex-col gap-2 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#187B56]/20 bg-[#187B56]/10 font-mono text-xs font-bold text-[#187B56]">
                          {item.cantidad}
                        </span>
                        <span className="truncate font-semibold text-[#111614]">
                          {item.nombre}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2.5 text-xs text-[#4E5C56]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#187B56]/10 font-mono text-xs font-bold text-[#187B56]">
                        1
                      </span>
                      <span>Consumo en Palco VIP</span>
                    </div>
                  )}
                </div>

                {isPreorder && preorderWindowLabel && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[#C5A059]/40 bg-[#FADC06]/30 px-2 py-0.5 text-[11px] font-semibold text-[#6B5420]">
                    <span>Horario programado:</span>
                    <span>{preorderWindowLabel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ITEM 3: MÉTODO DE PAGO */}
            <div className="py-4 flex items-start gap-4 transition-all">
              <StepCheckIcon
                state={currentStep >= 3 ? "checked" : currentStep === 2 ? "loading" : "pending"}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold tracking-tight text-[#111614]">
                  Método de pago: {metodoPagoTitulo}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-[#4E5C56] sm:text-sm">
                  {total !== undefined
                    ? `Total a cobrar: ${formatVipMxn(total)} · Transacción cifrada`
                    : "Cifrado bancario seguro SSL 256-bit"}
                </p>
                <span className="mt-0.5 inline-block text-[11px] text-[#7E8E87]">
                  Confirmación digital en tiempo real
                </span>
              </div>
            </div>

            {/* ITEM 4: COCINA DE CONCESIÓN */}
            <div className="py-4 flex items-start gap-4 transition-all">
              <StepCheckIcon
                state={
                  error
                    ? "error"
                    : isAllCompleted
                      ? "checked"
                      : awaitingValidation
                        ? "pending"
                        : currentStep >= 3
                          ? "loading"
                          : "pending"
                }
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold tracking-tight text-[#111614]">
                  {mode === "confirmation" ? "Cocina de la concesión" : `Cocina: ${restauranteNombre}`}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-[#4E5C56] sm:text-sm">
                  {error
                    ? error
                    : isAllCompleted
                      ? "La cocina ya tiene tu comanda"
                      : awaitingValidation
                        ? "Esperando la validación del cobro"
                        : "Avisando a la cocina de tu palco"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer actions or Status message */}
          <div className="pt-2 flex flex-col gap-2.5">
            {error ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 sm:text-sm">
                  {error}
                </div>
                <div className="flex items-center gap-2">
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#187B56] px-4 py-3 text-sm font-extrabold text-white transition-all hover:bg-[#136244] active:scale-98"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Reintentar</span>
                    </button>
                  )}
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="cursor-pointer rounded-xl border border-[#DFE5E2] bg-white px-4 py-3 text-sm font-bold text-[#111614] transition-all hover:bg-[#F6F8F7] active:scale-98"
                    >
                      Regresar
                    </button>
                  )}
                </div>
              </div>
            ) : isAllCompleted ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#187B56]/25 bg-[#187B56]/10 p-3.5 text-center"
              >
                <p className="text-xs font-bold text-[#187B56] sm:text-sm">
                  Tu orden quedó confirmada. Mostrando los detalles…
                </p>
              </motion.div>
            ) : awaitingValidation ? (
              <div className="flex flex-col gap-2">
                <p className="rounded-xl border border-[#C5A059]/40 bg-[#FADC06]/25 px-3 py-3 text-center text-sm font-semibold text-[#6B5420]">
                  El cobro ya llegó. En un momento lo verás en cocina.
                </p>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer rounded-xl bg-[#187B56] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#136244]"
                  >
                    Ver confirmación
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#7E8E87]">
                <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-[#187B56]" />
                <span>Procesando tu pedido de palco</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Sub-component for the animated checkmark / spinner icon
function StepCheckIcon({
  state,
}: {
  state: "pending" | "loading" | "checked" | "error";
}) {
  if (state === "checked") {
    return (
      <motion.div
        initial={{ scale: 0.2, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 450, damping: 22 }}
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#187B56]"
      >
        <Check className="h-5 w-5 stroke-[3.2]" />
      </motion.div>
    );
  }

  if (state === "loading") {
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#DFE5E2] border-t-[#187B56]" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-red-400 shrink-0 mt-0.5">
        <AlertCircle className="w-5 h-5 stroke-[2.4]" />
      </div>
    );
  }

  // Pending
  return (
    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#DFE5E2]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#C5D3CB]" />
    </div>
  );
}

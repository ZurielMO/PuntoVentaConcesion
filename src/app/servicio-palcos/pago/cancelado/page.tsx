"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { clearPendingCheckout, readPendingCheckout, VipService } from "@/lib/vip/vip-service";
import { VipLegalLinks } from "@/components/vip/legal/legal-links";

export default function VipPagoCanceladoPage() {
  const [releasing, setReleasing] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const stored = readPendingCheckout();
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("cs") || params.get("session_id") || stored?.checkoutSessionId || "";
    const orderId = params.get("order_id") || stored?.orderId || "";
    const trackingToken = stored?.trackingToken || "";

    const releaseHold = async () => {
      if (!sessionId && !(orderId && trackingToken)) return;
      try {
        await VipService.abandonCheckout({
          ...(sessionId ? { sessionId } : {}),
          ...(orderId ? { orderId } : {}),
          ...(trackingToken ? { trackingToken } : {}),
        });
      } catch {
        // Cron y webhook de Stripe siguen liberando si esta llamada falla.
      } finally {
        clearPendingCheckout();
      }
    };

    void releaseHold().finally(() => setReleasing(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col pb-28 md:pb-12">
      <VipTopBar variant="linear" title="Pago no completado" titleTag="p" onBack={() => window.location.assign("/servicio-palcos/carrito")} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-palco-sunken text-palco-ink-2">
          {releasing ? <Loader2 aria-hidden className="size-7 animate-spin" /> : <CreditCard aria-hidden className="size-7" />}
        </span>
        <h1 className="mt-4 font-palco-display text-[1.75rem] font-extrabold leading-tight tracking-[-0.02em] text-palco-ink">
          No se completó el pago
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-palco-ink-2" aria-live="polite">
          {releasing
            ? "Estamos liberando la reserva de tus productos. No se hizo ningún cargo a tu tarjeta."
            : "No se hizo ningún cargo a tu tarjeta. Tus productos siguen en el carrito para cuando quieras intentarlo de nuevo."}
        </p>
        <div className="mt-7 flex w-full flex-col gap-2.5">
          <Link
            href="/servicio-palcos/carrito"
            className="palco-press inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-palco-700 px-6 font-palco-display text-base font-bold text-white hover:bg-palco-600"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Volver al carrito
          </Link>
          <Link
            href="/servicio-palcos/inicio"
            className="palco-press inline-flex min-h-14 items-center justify-center rounded-full border border-palco-line-strong bg-palco-surface px-6 font-palco-display text-base font-bold text-palco-ink"
          >
            Seguir viendo el menú
          </Link>
        </div>
      </main>
      <VipLegalLinks className="px-4 pb-6" />
    </div>
  );
}

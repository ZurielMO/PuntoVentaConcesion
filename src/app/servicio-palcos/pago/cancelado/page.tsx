"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipMascot } from "@/components/vip/ui/mascot";
import { VipButton } from "@/components/vip/ui/button";
import { clearPendingCheckout, readPendingCheckout, VipService } from "@/lib/vip/vip-service";
import { motion } from "motion/react";

export default function VipPagoCanceladoPage() {
  const [releasing, setReleasing] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const stored = readPendingCheckout();
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id") || stored?.checkoutSessionId || "";
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
    <div className="flex flex-col min-h-screen pb-24 md:pb-0 bg-[#F6F8F7] text-[#111614]">
      <VipTopBar variant="linear" title="Pago no completado" subtitle="Servicio Palcos · Estadio León" />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-3xl border border-[#DFE5E2] shadow-xs flex flex-col items-center gap-4 w-full"
        >
          <VipMascot name="pagos" size="empty" className="-my-2" />
          <div>
            <h1 className="font-headline-md text-xl sm:text-2xl font-extrabold text-[#111614] tracking-tight">
              Proceso Cancelado
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-[#4E5C56] mt-1.5 leading-relaxed">
              {releasing
                ? "Estamos liberando la reserva de inventario. No se realizó ningún cargo en tu tarjeta."
                : "No se realizó ningún cargo en tu tarjeta. Los productos siguen guardados en tu carrito para cuando desees reintentar."}
            </p>
          </div>
          <div className="w-full pt-2">
            <Link href="/servicio-palcos/carrito" className="w-full block">
              <VipButton variant="primary" fullWidth size="lg" className="flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Volver al Carrito</span>
              </VipButton>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

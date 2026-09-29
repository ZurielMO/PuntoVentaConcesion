"use client";

import { useEffect, useState } from "react";
import { VipService } from "@/lib/vip/vip-service";
import type { VipPublicServiceStatus } from "@/lib/vip/types";

export function useVipPublicSalesOpen(pollMs = 15000) {
  const [status, setStatus] = useState<VipPublicServiceStatus>({
    acceptingOrders: false,
    matchDay: false,
    liveOrdersOpen: false,
    preordersEnabled: false,
    preordersOpen: false,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const next = await VipService.getPublicServiceStatus();
        if (mounted) setStatus(next);
      } catch {
        // Si el estado no llega, se conserva el último valor. El checkout sigue cerrado en el servidor.
      } finally {
        if (mounted) setReady(true);
      }
    };
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, pollMs);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [pollMs]);

  return {
    ready,
    acceptingOrders: status.acceptingOrders,
    matchDay: status.matchDay,
    liveOrdersOpen: status.liveOrdersOpen,
    preordersEnabled: status.preordersEnabled,
    preordersOpen: status.preordersOpen,
    /** Se puede armar carrito si hoy hay entrega inmediata o Central tiene la preventa abierta. */
    canOrder: status.liveOrdersOpen || status.preordersEnabled,
  };
}

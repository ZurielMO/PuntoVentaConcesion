"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { VipService } from "@/lib/vip/vip-service";
import type { VipPublicServiceStatus } from "@/lib/vip/types";

const CLOSED: VipPublicServiceStatus = {
  acceptingOrders: false,
  matchDay: false,
  liveOrdersOpen: false,
  preordersEnabled: false,
  preordersOpen: false,
};

type ServiceState = { status: VipPublicServiceStatus; ready: boolean; failed: boolean };

const ServiceStatusContext = createContext<ServiceState | null>(null);

function useServiceStatusPolling(enabled: boolean, pollMs: number): ServiceState {
  const [state, setState] = useState<ServiceState>({ status: CLOSED, ready: false, failed: false });

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    const load = async () => {
      try {
        const next = await VipService.getPublicServiceStatus();
        if (mounted) setState({ status: next, ready: true, failed: false });
      } catch {
        // Si el estado no llega se conserva el último valor; el checkout sigue cerrado en el servidor.
        if (mounted) setState((prev) => ({ ...prev, ready: true, failed: !prev.ready || prev.failed }));
      }
    };
    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, pollMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, pollMs]);

  return state;
}

/** Un solo sondeo de `/vip/service-status` para todo el storefront. */
export function VipServiceStatusProvider({ children, pollMs = 15000 }: { children: React.ReactNode; pollMs?: number }) {
  const state = useServiceStatusPolling(true, pollMs);
  return <ServiceStatusContext.Provider value={state}>{children}</ServiceStatusContext.Provider>;
}

export function useVipPublicSalesOpen(pollMs = 15000) {
  const shared = useContext(ServiceStatusContext);
  // Fuera del proveedor (pantallas aisladas) se sondea por cuenta propia.
  const own = useServiceStatusPolling(!shared, pollMs);
  const { status, ready, failed } = shared || own;

  return {
    ready,
    /** No se pudo leer el estado en la primera carga (sin conexión o backend caído). */
    failed,
    acceptingOrders: status.acceptingOrders,
    matchDay: status.matchDay,
    liveOrdersOpen: status.liveOrdersOpen,
    preordersEnabled: status.preordersEnabled,
    preordersOpen: status.preordersOpen,
    /** Se puede armar carrito si hoy hay entrega inmediata o Central tiene la preventa abierta. */
    canOrder: status.liveOrdersOpen || status.preordersEnabled,
  };
}

export type VipServiceStatusView = ReturnType<typeof useVipPublicSalesOpen>;

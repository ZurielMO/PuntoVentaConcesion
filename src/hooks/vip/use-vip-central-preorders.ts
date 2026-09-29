"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VipService } from "@/lib/vip/vip-service";
import type { StadiumZone, VipOrder, VipOrderStatus } from "@/lib/vip/types";
import { isVipPreorderOrder } from "@/lib/vip/types";
import { vipToast } from "./use-vip-toast";

function announceNewPreorders(fresh: VipOrder[]) {
  const first = fresh[0];
  vipToast.info(fresh.length === 1 ? "Nueva preventa programada" : `${fresh.length} preventas nuevas`, {
    id: "vip-central-preorder-new",
    description: isVipPreorderOrder(first)
      ? `Partido ${first.preventa.jornadaNumero} · ${first.preventa.windowLabel} · Palco ${first.ubicacion.palco}`
      : undefined,
  });
}

/**
 * Preventas pagadas de la zona. Van en su propio flujo: las nuevas solo generan un aviso
 * discreto y un contador; nunca disparan la alerta de aceptación de la venta en vivo.
 */
export function useVipCentralPreorders({
  token,
  zona,
  enabled,
  autoRefresh,
  viewing,
  pollMs = 15_000,
}: {
  token: string | null | undefined;
  zona: StadiumZone | null;
  enabled: boolean;
  autoRefresh: boolean;
  viewing: boolean;
  pollMs?: number;
}) {
  const [orders, setOrders] = useState<VipOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unseenIds, setUnseenIds] = useState<string[]>([]);
  const knownIds = useRef<Set<string> | null>(null);
  const viewingRef = useRef(viewing);
  viewingRef.current = viewing;

  const refresh = useCallback(async () => {
    if (!enabled || !token || !zona) return;
    try {
      const data = (await VipService.getAdminPreorders(zona, token)).filter(isVipPreorderOrder);
      const previous = knownIds.current;
      const fresh = previous ? data.filter((order) => !previous.has(order.id)) : [];
      if (fresh.length > 0) {
        announceNewPreorders(fresh);
        if (!viewingRef.current) {
          setUnseenIds((prev) => [...new Set([...prev, ...fresh.map((order) => order.id)])]);
        }
      }
      knownIds.current = new Set(data.map((order) => order.id));
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las preventas.");
    } finally {
      setLoading(false);
    }
  }, [enabled, token, zona]);

  useEffect(() => {
    knownIds.current = null;
    setOrders([]);
    setUnseenIds([]);
    setLoading(true);
  }, [zona]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !autoRefresh) return;
    const interval = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(interval);
  }, [autoRefresh, enabled, pollMs, refresh]);

  useEffect(() => {
    if (viewing) setUnseenIds([]);
  }, [viewing]);

  const patchStatus = useCallback((orderId: string, estado: VipOrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, estado } : order)));
  }, []);

  return { orders, loading, error, refresh, patchStatus, unseenCount: unseenIds.length };
}

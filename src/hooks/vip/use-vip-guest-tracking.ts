"use client";

import { useEffect, useRef, useState } from "react";
import { useVipOrders } from "@/hooks/vip/use-vip-orders";
import {
  applyVipTracking,
  isVipGuestTrackingTerminal,
  readGuestTrackingToken,
  readPendingCheckout,
  saveGuestTrackingToken,
  VipService,
} from "@/lib/vip/vip-service";

const LIVE_POLL_MS = 3000;

export function useVipGuestTracking(orderId: string) {
  const { getOrderById, upsertGuestTrackedOrder } = useVipOrders();
  const order = getOrderById(orderId);
  const [loading, setLoading] = useState(!order);
  const [unavailable, setUnavailable] = useState(false);
  const getOrderByIdRef = useRef(getOrderById);
  const upsertRef = useRef(upsertGuestTrackedOrder);
  getOrderByIdRef.current = getOrderById;
  upsertRef.current = upsertGuestTrackedOrder;

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const resolveToken = () => {
      const local = getOrderByIdRef.current(orderId);
      const pending = readPendingCheckout();
      const pendingToken = pending?.orderId === orderId ? pending.trackingToken : "";
      return local?.trackingToken || readGuestTrackingToken(orderId) || pendingToken || "";
    };

    const tick = async () => {
      const token = resolveToken();
      const local = getOrderByIdRef.current(orderId);
      if (!token) {
        if (!cancelled) {
          setLoading(false);
          setUnavailable(!local);
        }
        return local;
      }
      saveGuestTrackingToken(orderId, token);
      const tracking = await VipService.getTracking(orderId, token);
      if (cancelled) return local;
      if (tracking) {
        upsertRef.current(applyVipTracking(local, tracking, token));
        setUnavailable(false);
      } else if (!local) {
        setUnavailable(true);
      }
      setLoading(false);
      return getOrderByIdRef.current(orderId) || local;
    };

    const loop = async () => {
      const latest = await tick();
      if (cancelled) return;
      if (isVipGuestTrackingTerminal(latest?.estado)) return;
      timer = setTimeout(() => {
        void loop();
      }, LIVE_POLL_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
    };

    document.addEventListener("visibilitychange", onVisibility);
    void loop();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [orderId]);

  return { order, loading, unavailable };
}

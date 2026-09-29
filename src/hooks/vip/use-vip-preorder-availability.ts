"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VipService } from "@/lib/vip/vip-service";
import type { StadiumZone, VipPreorderAvailability } from "@/lib/vip/types";
import {
  VIP_PURCHASE_UNAVAILABLE_HINT,
  VIP_PURCHASE_UNAVAILABLE_TITLE,
} from "@/lib/vip/purchase-availability";

type State = {
  data: VipPreorderAvailability | null;
  loading: boolean;
  error: string | null;
};

/**
 * Partidos y ventanas reservables (sin límites de cupo por horario ni por zona);
 * se refresca en segundo plano porque las ventanas cierran con el tiempo de anticipación.
 */
export function useVipPreorderAvailability(
  zona: StadiumZone | "" | null,
  { enabled = true, pollMs = 45_000 }: { enabled?: boolean; pollMs?: number } = {},
) {
  const [state, setState] = useState<State>({ data: null, loading: enabled, error: null });
  const requestRef = useRef(0);

  const load = useCallback(async (silent = false) => {
    const requestId = ++requestRef.current;
    if (!silent) setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await VipService.getPreorderAvailability(zona || null);
      if (requestId === requestRef.current) setState({ data, loading: false, error: null });
    } catch {
      if (requestId !== requestRef.current) return;
      setState((prev) => ({
        data: prev.data,
        loading: false,
        error: `${VIP_PURCHASE_UNAVAILABLE_TITLE} ${VIP_PURCHASE_UNAVAILABLE_HINT}`,
      }));
    }
  }, [zona]);

  useEffect(() => {
    if (!enabled) return;
    void load();
    const interval = window.setInterval(() => void load(true), pollMs);
    return () => window.clearInterval(interval);
  }, [enabled, load, pollMs]);

  return { ...state, reload: load };
}

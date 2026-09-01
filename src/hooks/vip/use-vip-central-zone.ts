"use client";

import { useCallback, useEffect, useState } from "react";
import { isVipStadiumZone, type StadiumZone } from "@/lib/vip/types";

const STORAGE_KEY = "vip.central.zona";

export function useVipCentralZone() {
  const [zona, setZonaState] = useState<StadiumZone | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) || "";
    setZonaState(isVipStadiumZone(stored) ? stored : null);
    setReady(true);
  }, []);

  const setZona = useCallback((next: StadiumZone) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setZonaState(next);
  }, []);

  return { zona, ready, setZona };
}

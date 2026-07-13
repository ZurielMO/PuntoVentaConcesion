"use client";

import { useEffect, useRef, useState } from "react";

function readParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Lee un query param una vez al montar (deep-link).
 * No reacciona a cambios posteriores del dropdown — solo hidrata la entrada.
 */
export function useDeepLinkParam(name: string): string {
  const [value] = useState(() => readParam(name) ?? "");
  return value;
}

type SucursalTab = "equipo" | "cajas";

/**
 * Hidrata selección de sucursal + pestaña desde ?sucursalId=&tab=
 * cuando la lista visible ya está disponible.
 * Sin deep-link, no auto-selecciona la primera sucursal.
 */
export function useSucursalDeepLink(visibleIds: string[]) {
  const deepSucursalId = useDeepLinkParam("sucursalId");
  const deepTabRaw = useDeepLinkParam("tab");
  const deepTab: SucursalTab | null =
    deepTabRaw === "cajas" || deepTabRaw === "equipo" ? deepTabRaw : null;

  const [selectedSucursalId, setSelectedSucursalId] = useState("");
  const [detailTab, setDetailTab] = useState<SucursalTab>(deepTab ?? "equipo");
  const appliedRef = useRef(false);
  /** Evita resetear la pestaña en la primera hidratación (deep-link). */
  const skipTabResetRef = useRef(true);

  useEffect(() => {
    if (visibleIds.length === 0) {
      setSelectedSucursalId("");
      return;
    }

    if (!appliedRef.current && deepSucursalId && visibleIds.includes(deepSucursalId)) {
      appliedRef.current = true;
      setSelectedSucursalId(deepSucursalId);
      return;
    }

    if (selectedSucursalId && !visibleIds.includes(selectedSucursalId)) {
      setSelectedSucursalId("");
    }
  }, [visibleIds, selectedSucursalId, deepSucursalId]);

  useEffect(() => {
    if (skipTabResetRef.current) {
      if (selectedSucursalId) {
        skipTabResetRef.current = false;
      }
      return;
    }
    setDetailTab("equipo");
  }, [selectedSucursalId]);

  return {
    selectedSucursalId,
    setSelectedSucursalId,
    detailTab,
    setDetailTab,
  } as const;
}

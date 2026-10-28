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

/**
 * Hidrata la sucursal seleccionada desde ?sucursalId=
 * cuando la lista visible ya está disponible.
 * Sin deep-link, no auto-selecciona la primera sucursal.
 */
export function useSucursalDeepLink(visibleIds: string[]) {
  const deepSucursalId = useDeepLinkParam("sucursalId");
  const [selectedSucursalId, setSelectedSucursalId] = useState("");
  const appliedRef = useRef(false);

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

  return {
    selectedSucursalId,
    setSelectedSucursalId,
  } as const;
}

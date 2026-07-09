"use client";

import { useEffect, useRef, useState } from "react";
import { useActiveConcesionOptional } from "@/hooks/use-active-concesion";

function readConcesionIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("concesionId");
}

/**
 * Filtro de concesión para SuperAdmin.
 * Solo hidrata desde ?concesionId= (deep-link desde Configurar).
 * No reutiliza la concesión activa / localStorage al entrar por el menú.
 */
export function useConcesionFilterParam(defaultValue = "") {
  const activeCtx = useActiveConcesionOptional();
  const urlAppliedRef = useRef(false);
  const [concesionFilter, setConcesionFilter] = useState(() => {
    const fromUrl = readConcesionIdFromUrl();
    return fromUrl ?? defaultValue;
  });

  useEffect(() => {
    if (urlAppliedRef.current) return;
    urlAppliedRef.current = true;

    const paramId = readConcesionIdFromUrl();
    if (paramId) {
      setConcesionFilter(paramId);
      activeCtx?.setActiveConcesionId(paramId);
    }
  }, [activeCtx]);

  return [concesionFilter, setConcesionFilter] as const;
}

"use client";

import { useEffect, useState } from "react";
import { useActiveConcesionOptional } from "@/hooks/use-active-concesion";

/**
 * Filtro de concesión para SuperAdmin: prioridad URL ?concesionId= → contexto activo.
 */
export function useConcesionFilterParam(defaultValue = "") {
  const activeCtx = useActiveConcesionOptional();
  const [concesionFilter, setConcesionFilter] = useState(defaultValue);

  useEffect(() => {
    const paramId = new URLSearchParams(window.location.search).get("concesionId");
    if (paramId) {
      setConcesionFilter(paramId);
      activeCtx?.setActiveConcesionId(paramId);
      return;
    }
    if (activeCtx?.activeConcesionId) {
      setConcesionFilter(activeCtx.activeConcesionId);
    }
  }, [activeCtx?.activeConcesionId, activeCtx?.setActiveConcesionId, activeCtx]);

  return [concesionFilter, setConcesionFilter] as const;
}

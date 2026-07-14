"use client";

import { useCallback, useRef, useState } from "react";

export const CORTE_PDF_EXPORT_ERROR =
  "No se pudo generar el resumen PDF. Intenta nuevamente.";

export function useCortePdfExport() {
  const activeRef = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (id: string, task: () => Promise<void> | void) => {
    if (activeRef.current) return false;
    activeRef.current = id;
    setActiveId(id);
    setError(null);
    try {
      await task();
      return true;
    } catch {
      setError(CORTE_PDF_EXPORT_ERROR);
      return false;
    } finally {
      activeRef.current = null;
      setActiveId(null);
    }
  }, []);

  return {
    activeId,
    error,
    exporting: activeId !== null,
    run,
    clearError: () => setError(null),
  };
}

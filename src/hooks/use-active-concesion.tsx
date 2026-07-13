"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useConcessions } from "@/hooks/use-concessions";
import { usePermissions } from "@/hooks/use-permissions";

const LEGACY_STORAGE_KEY = "pos_active_concesion_id";

type ActiveConcesionContextValue = {
  activeConcesionId: string | null;
  setActiveConcesionId: (id: string | null) => void;
  activeConcesionNombre: string | null;
};

const ActiveConcesionContext = createContext<ActiveConcesionContextValue | null>(
  null,
);

export function ActiveConcesionProvider({ children }: { children: ReactNode }) {
  const perms = usePermissions();
  const { concessions } = useConcessions();
  const [activeConcesionId, setActiveConcesionIdState] = useState<string | null>(
    null,
  );

  // Limpia persistencia legacy: la concesión no debe sobrevivir entre módulos.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (!perms.isSuperAdmin) {
      setActiveConcesionIdState(null);
    }
  }, [perms.isSuperAdmin]);

  const setActiveConcesionId = useCallback((id: string | null) => {
    setActiveConcesionIdState(id);
  }, []);

  const activeConcesionNombre = useMemo(() => {
    if (!activeConcesionId) return null;
    return (
      concessions.find((c) => c.id === activeConcesionId)?.nombre ?? null
    );
  }, [activeConcesionId, concessions]);

  const value = useMemo(
    () => ({
      activeConcesionId,
      setActiveConcesionId,
      activeConcesionNombre,
    }),
    [activeConcesionId, setActiveConcesionId, activeConcesionNombre],
  );

  return (
    <ActiveConcesionContext.Provider value={value}>
      {children}
    </ActiveConcesionContext.Provider>
  );
}

export function useActiveConcesion() {
  const ctx = useContext(ActiveConcesionContext);
  if (!ctx) {
    throw new Error("useActiveConcesion debe usarse dentro de ActiveConcesionProvider");
  }
  return ctx;
}

/** Versión segura para componentes que pueden renderizarse fuera del provider. */
export function useActiveConcesionOptional() {
  return useContext(ActiveConcesionContext);
}

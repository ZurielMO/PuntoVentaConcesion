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

const STORAGE_KEY = "pos_active_concesion_id";

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!perms.isSuperAdmin) {
      setActiveConcesionIdState(null);
      setHydrated(true);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setActiveConcesionIdState(stored || null);
    } catch {
      setActiveConcesionIdState(null);
    }
    setHydrated(true);
  }, [perms.isSuperAdmin]);

  const setActiveConcesionId = useCallback((id: string | null) => {
    setActiveConcesionIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const activeConcesionNombre = useMemo(() => {
    if (!activeConcesionId) return null;
    return (
      concessions.find((c) => c.id === activeConcesionId)?.nombre ?? null
    );
  }, [activeConcesionId, concessions]);

  const value = useMemo(
    () => ({
      activeConcesionId: hydrated ? activeConcesionId : null,
      setActiveConcesionId,
      activeConcesionNombre,
    }),
    [hydrated, activeConcesionId, setActiveConcesionId, activeConcesionNombre],
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

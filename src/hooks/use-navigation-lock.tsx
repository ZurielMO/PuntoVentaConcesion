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
import { createPortal } from "react-dom";

type NavigationLockOptions = {
  title?: string;
  subtitle?: string;
};

type LockState = {
  title: string;
  subtitle?: string;
};

type NavigationLockContextValue = {
  isLocked: boolean;
  lock: (options?: NavigationLockOptions) => void;
  unlock: () => void;
};

const NavigationLockContext = createContext<NavigationLockContextValue | null>(
  null,
);

export function NavigationLockProvider({ children }: { children: ReactNode }) {
  const [lockState, setLockState] = useState<LockState | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLocked = lockState !== null;

  const lock = useCallback((options?: NavigationLockOptions) => {
    setLockState({
      title: options?.title ?? "Procesando…",
      subtitle: options?.subtitle,
    });
  }, []);

  const unlock = useCallback(() => {
    setLockState(null);
  }, []);

  useEffect(() => {
    if (!isLocked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isLocked]);

  useEffect(() => {
    if (!isLocked) return;
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isLocked]);

  const value = useMemo(
    () => ({ isLocked, lock, unlock }),
    [isLocked, lock, unlock],
  );

  return (
    <NavigationLockContext.Provider value={value}>
      {children}
      {mounted &&
        lockState &&
        createPortal(
          <div
            className="app-nav-lock-overlay"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-nav-lock-title"
            aria-describedby={
              lockState.subtitle ? "app-nav-lock-sub" : undefined
            }
          >
            <div className="app-nav-lock-card">
              <div className="app-nav-lock-spinner" aria-hidden />
              <p id="app-nav-lock-title" className="app-nav-lock-title">
                {lockState.title}
              </p>
              {lockState.subtitle ? (
                <p id="app-nav-lock-sub" className="app-nav-lock-sub">
                  {lockState.subtitle}
                </p>
              ) : null}
            </div>
          </div>,
          document.body,
        )}
    </NavigationLockContext.Provider>
  );
}

export function useNavigationLock() {
  const ctx = useContext(NavigationLockContext);
  if (!ctx) {
    throw new Error(
      "useNavigationLock debe usarse dentro de NavigationLockProvider",
    );
  }
  return ctx;
}

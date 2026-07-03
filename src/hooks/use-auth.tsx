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
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import type { PosUser } from "@/lib/types";

export type { PosUser };

/** Sesión mínima (reemplaza Firebase User). */
export type SessionUser = {
  uid: string;
  email?: string;
  nombre?: string;
};

const TOKEN_STORAGE_KEY = "pos_auth_token";

type AuthContextValue = {
  user: SessionUser | null;
  posUser: PosUser | null;
  token: string | null;
  loading: boolean;
  isConfigured: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [posUser, setPosUser] = useState<PosUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((jwt: string | null, profile: PosUser | null) => {
    setToken(jwt);
    writeStoredToken(jwt);
    setPosUser(profile);
    if (profile?.uid || profile?.email) {
      setUser({
        uid: String(profile.uid ?? ""),
        email: profile.email,
        nombre: typeof profile.nombre === "string" ? profile.nombre : undefined,
      });
    } else {
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async (activeToken?: string) => {
    const jwt = activeToken ?? token ?? readStoredToken();
    if (!jwt) {
      applySession(null, null);
      return;
    }
    try {
      const res = await api.get<ApiResponse<never> & { usuario: PosUser }>(
        apiPaths.auth.me,
        jwt,
      );
      const profile = res.usuario ?? null;
      if (!profile) {
        applySession(null, null);
        return;
      }
      applySession(jwt, profile);
    } catch {
      applySession(null, null);
    }
  }, [token, applySession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = readStoredToken();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await api.get<ApiResponse<never> & { usuario: PosUser }>(
          apiPaths.auth.me,
          stored,
        );
        if (cancelled) return;
        const profile = res.usuario ?? null;
        if (profile) {
          applySession(stored, profile);
        } else {
          applySession(null, null);
        }
      } catch {
        if (!cancelled) applySession(null, null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<
        ApiResponse<never> & { token: string; usuario: PosUser }
      >(apiPaths.auth.loginPassword, { email, password });

      const jwt = res.token;
      const profile = res.usuario;
      if (!jwt || !profile) {
        throw new Error("Respuesta de login incompleta");
      }
      applySession(jwt, profile);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    applySession(null, null);
  }, [applySession]);

  const value = useMemo(
    () => ({
      user,
      posUser,
      token,
      loading,
      isConfigured: true,
      loginWithPassword,
      logout,
      refreshProfile: () => refreshProfile(),
    }),
    [user, posUser, token, loading, loginWithPassword, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}

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
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import type { PosUser } from "@/lib/types";

export type { PosUser };

type AuthContextValue = {
  user: User | null;
  posUser: PosUser | null;
  token: string | null;
  loading: boolean;
  isConfigured: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [posUser, setPosUser] = useState<PosUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseConfigured();

  const refreshProfile = useCallback(async (idToken?: string) => {
    const activeToken = idToken ?? token;
    if (!activeToken) {
      setPosUser(null);
      return;
    }
    try {
      const res = await api.get<ApiResponse<never> & { usuario: PosUser }>(
        apiPaths.auth.me,
        activeToken,
      );
      setPosUser(res.usuario ?? null);
    } catch {
      setPosUser(null);
    }
  }, [token]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        await refreshProfile(idToken);
      } else {
        setToken(null);
        setPosUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [refreshProfile]);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error(
          "Firebase no configurado. Revisa NEXT_PUBLIC_AUTH_FIREBASE_* en .env.local",
        );
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      await api.post(apiPaths.auth.login, { idToken });

      setUser(credential.user);
      setToken(idToken);
      await refreshProfile(idToken);
    },
    [refreshProfile],
  );

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    setUser(null);
    setToken(null);
    setPosUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      posUser,
      token,
      loading,
      isConfigured,
      loginWithPassword,
      logout,
      refreshProfile: () => refreshProfile(),
    }),
    [
      user,
      posUser,
      token,
      loading,
      isConfigured,
      loginWithPassword,
      logout,
      refreshProfile,
    ],
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

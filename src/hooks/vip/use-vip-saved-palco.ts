"use client";

import { useSyncExternalStore } from "react";
import { isVipStadiumZone, normalizeVipFloor, type StadiumZone } from "@/lib/vip/types";

/**
 * Palco de entrega elegido por el aficionado. Solo se guarda en este dispositivo
 * (localStorage) cuando marca "Recordar"; si no, vive en la pestaña (sessionStorage)
 * para no volver a pedirlo entre inicio y el pago.
 */
export interface VipSavedPalco {
  zona: StadiumZone;
  nivel: string;
  palco: string;
}

const REMEMBER_KEY = "vip_saved_palco_v1";
const SESSION_KEY = "vip_palco_session_v1";

type Snapshot = { palco: VipSavedPalco | null; remembered: boolean };

const EMPTY: Snapshot = { palco: null, remembered: false };
let cache: Snapshot | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): VipSavedPalco | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<VipSavedPalco>;
    const zona = String(value.zona || "");
    const palco = String(value.palco || "").trim();
    if (!isVipStadiumZone(zona) || !palco) return null;
    return { zona, nivel: normalizeVipFloor(zona, String(value.nivel || "")) || "", palco };
  } catch {
    return null;
  }
}

function read(): Snapshot {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const remembered = parse(localStorage.getItem(REMEMBER_KEY));
    if (remembered) cache = { palco: remembered, remembered: true };
    else cache = { palco: parse(sessionStorage.getItem(SESSION_KEY)), remembered: false };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function emit() {
  for (const listener of listeners) listener();
}

export function saveVipPalco(palco: VipSavedPalco, remember: boolean) {
  const clean: VipSavedPalco = { zona: palco.zona, nivel: palco.nivel, palco: palco.palco.trim() };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean));
    if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify(clean));
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Almacenamiento bloqueado: se conserva solo en memoria.
  }
  cache = { palco: clean, remembered: remember };
  emit();
}

export function forgetVipPalco() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  cache = EMPTY;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === REMEMBER_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useVipSavedPalco() {
  const snapshot = useSyncExternalStore(subscribe, read, () => EMPTY);
  return { ...snapshot, save: saveVipPalco, forget: forgetVipPalco };
}

export function formatVipPalco(palco: VipSavedPalco): string {
  return [`Palco ${palco.palco}`, palco.zona, palco.nivel].filter(Boolean).join(" · ");
}

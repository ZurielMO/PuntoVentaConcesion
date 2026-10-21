import { normalizeVipGuide } from "./types";

/**
 * Guías de pedidos pagados en este dispositivo, para consultarlos sin volver a escribirlas.
 * Se guardan al confirmar el pago (la guía ya se muestra en pantalla y llega por correo).
 * Solo la guía y datos de referencia; nada de contacto ni de pago.
 */
export interface VipRecentOrder {
  guide: string;
  orderNumber: string;
  savedAt: string;
  preorder?: { matchLabel: string; windowLabel: string; matchDate: string } | null;
}

const KEY = "vip_recent_guides_v1";
const MAX = 5;

export function readRecentOrders(): VipRecentOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as VipRecentOrder[]) : [];
    return Array.isArray(list) ? list.filter((row) => normalizeVipGuide(row.guide)) : [];
  } catch {
    return [];
  }
}

export function saveRecentOrder(order: Omit<VipRecentOrder, "savedAt">): void {
  if (typeof window === "undefined") return;
  const guide = normalizeVipGuide(order.guide);
  if (!guide) return;
  try {
    const next = [
      { ...order, guide, savedAt: new Date().toISOString() },
      ...readRecentOrders().filter((row) => normalizeVipGuide(row.guide) !== guide),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Sin almacenamiento la guía sigue en el correo de confirmación.
  }
}

export function forgetRecentOrder(guide: string): void {
  try {
    const target = normalizeVipGuide(guide);
    localStorage.setItem(KEY, JSON.stringify(readRecentOrders().filter((row) => normalizeVipGuide(row.guide) !== target)));
  } catch {
    // ignore
  }
}

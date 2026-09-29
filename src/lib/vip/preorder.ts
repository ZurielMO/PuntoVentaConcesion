import type { VipOrderStatus, VipPreorderInfo } from "./types";
import { formatVipMatchDate, formatVipStadiumTime } from "./types";

const MINUTE = 60_000;

/** Momento del partido en que cae la ventana (el partido dura ~105 min con medio tiempo). */
export function preorderPhaseLabel(startAt: string | null | undefined, kickoffAt: string | null | undefined): string {
  const start = Date.parse(String(startAt || ""));
  const kickoff = Date.parse(String(kickoffAt || ""));
  if (!Number.isFinite(start) || !Number.isFinite(kickoff)) return "";
  const offset = (start - kickoff) / MINUTE;
  if (offset < 0) return "Antes del partido";
  if (offset < 45) return "Primer tiempo";
  if (offset < 65) return "Medio tiempo";
  return "Segundo tiempo";
}

export function preorderMatchLine(info: Pick<VipPreorderInfo, "matchDate" | "kickoffAt" | "stadium">): string {
  const date = formatVipMatchDate(info.matchDate);
  const kickoff = formatVipStadiumTime(info.kickoffAt);
  return [date ? date.charAt(0).toUpperCase() + date.slice(1) : "", kickoff ? `${kickoff} h` : "", info.stadium || ""]
    .filter(Boolean)
    .join(" · ");
}

export function preorderDateBadge(matchDate: string): { day: string; month: string; weekday: string } {
  const parsed = Date.parse(`${matchDate}T12:00:00Z`);
  if (!Number.isFinite(parsed)) return { day: "--", month: "", weekday: "" };
  const date = new Date(parsed);
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-MX", { ...options, timeZone: "UTC" }).format(date).replace(".", "");
  return {
    day: fmt({ day: "numeric" }),
    month: fmt({ month: "short" }).toUpperCase(),
    weekday: fmt({ weekday: "short" }),
  };
}

export function vipPaymentStatusLabel(status: string): { label: string; tone: "ok" | "warn" | "muted" | "bad" } {
  switch (status) {
    case "PAID":
      return { label: "Pagado", tone: "ok" };
    case "REFUND_PENDING":
      return { label: "Reembolso en proceso", tone: "warn" };
    case "PARTIALLY_REFUNDED":
      return { label: "Reembolso parcial", tone: "warn" };
    case "REFUNDED":
      return { label: "Reembolsado", tone: "muted" };
    case "FAILED":
      return { label: "Pago rechazado", tone: "bad" };
    case "REQUIRES_ACTION":
      return { label: "Pago por confirmar", tone: "warn" };
    default:
      return { label: "Pago pendiente", tone: "warn" };
  }
}

export type VipProgressStep = {
  key: string;
  title: string;
  state: "done" | "current" | "upcoming";
};

const PROGRESS_LEVEL: Partial<Record<VipOrderStatus, number>> = {
  PAID: 1,
  RECIBIDO: 1,
  RECEIVED: 1,
  ACCEPTED: 2,
  PREPARANDO: 3,
  PREPARING: 3,
  READY_FOR_PICKUP: 3,
  PICKED_UP: 4,
  EN_CAMINO: 4,
  ON_THE_WAY: 4,
  ENTREGADO: 5,
  DELIVERED: 5,
};

export function isVipCancelledStatus(status: VipOrderStatus): boolean {
  return status === "CANCELLED" || status === "CANCELADO" || status === "REFUNDED" || status === "PAYMENT_FAILED";
}

export function isVipTerminalStatus(status: VipOrderStatus): boolean {
  return isVipCancelledStatus(status) || status === "DELIVERED" || status === "ENTREGADO";
}

export function vipOrderProgress(status: VipOrderStatus, preorder: boolean): VipProgressStep[] {
  const level = PROGRESS_LEVEL[status] ?? 0;
  const steps = [
    { key: "paid", title: "Pago confirmado" },
    { key: "accepted", title: preorder ? "Programado" : "Aceptado" },
    { key: "preparing", title: "En preparación" },
    { key: "on_the_way", title: "En camino" },
    { key: "delivered", title: "Entregado" },
  ];
  return steps.map((step, index) => {
    const stepLevel = index + 1;
    const state: VipProgressStep["state"] =
      stepLevel < level || (stepLevel === level && level === 5)
        ? "done"
        : stepLevel === level
          ? "current"
          : "upcoming";
    return { ...step, state };
  });
}

export function vipOrderStatusHeadline(status: VipOrderStatus, preorder: boolean): { title: string; detail: string } {
  if (status === "PENDING_PAYMENT") {
    return { title: "Esperando tu pago", detail: "Completa el pago con tarjeta para confirmar el pedido." };
  }
  if (status === "PAYMENT_FAILED") {
    return { title: "El pago no se completó", detail: "No se realizó ningún cargo. Puedes volver a intentarlo." };
  }
  if (status === "CANCELLED" || status === "CANCELADO") {
    return { title: "Pedido cancelado", detail: "Si ya se cobró, el reembolso se refleja en tu tarjeta en unos días." };
  }
  if (status === "REFUNDED") {
    return { title: "Pedido reembolsado", detail: "El reembolso se refleja en tu tarjeta en unos días hábiles." };
  }
  const level = PROGRESS_LEVEL[status] ?? 0;
  if (level >= 5) return { title: "Pedido entregado", detail: "¡Buen provecho y vamos León!" };
  if (level === 4) return { title: "Va en camino a tu palco", detail: "Ten a la mano tu guía por si el repartidor la solicita." };
  if (level === 3) return { title: "Estamos preparando tu pedido", detail: "Saldrá a tu palco en cuanto esté listo." };
  if (preorder) {
    return {
      title: "Tu preventa está programada",
      detail: "Cocina lo prepara con anticipación para entregarlo en la ventana que elegiste.",
    };
  }
  if (level === 2) return { title: "Cocina aceptó tu pedido", detail: "En breve comenzará la preparación." };
  return { title: "Pago confirmado", detail: "Tu pedido está en la fila de cocina." };
}

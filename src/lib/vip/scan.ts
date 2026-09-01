export const VIP_QR_PREFIX = "PALCO|";
const LEGACY_QR_PREFIXES = ["PALCO|", "PALCO:", "VIP|", "VIP:"];

export function buildVipOrderQrPayload(orderId: string): string {
  return `${VIP_QR_PREFIX}${orderId}`;
}

export function parseVipScanPayload(raw: string): string {
  const value = raw.trim().replace(/^#+/, "");
  if (!value) return "";
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || value;
    return parseVipScanPayload(last);
  } catch {
    const upper = value.toUpperCase();
    for (const prefix of LEGACY_QR_PREFIXES) {
      if (upper.startsWith(prefix)) return value.slice(prefix.length).trim();
    }
    return value;
  }
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    return (target as HTMLInputElement).type !== "hidden";
  }
  return target.isContentEditable;
}

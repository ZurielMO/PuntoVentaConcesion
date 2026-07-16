const OPERATIONAL_TIME_ZONE = "America/Mexico_City";

export function formatBusinessDate(value?: string | null): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value?.trim() || "Sin registro";
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: OPERATIONAL_TIME_ZONE,
  }).format(date);
}

export function formatCorteTimestamp(value: unknown): string {
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (value && typeof value === "object") {
    const row = value as { _seconds?: number; seconds?: number };
    const seconds = Number(row._seconds ?? row.seconds);
    if (Number.isFinite(seconds)) date = new Date(seconds * 1000);
  }
  if (!date || Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: OPERATIONAL_TIME_ZONE,
  }).format(date);
}

export function corteCalculationLabel(version?: string | null): string {
  if (!version || version === "legacy-v1") return "Legacy v1";
  return version === "cortes-v2" ? "Cálculo nuevo v2" : version;
}

export function corteLifecycleLabel(status?: string | null): string {
  const normalized = status?.trim().toUpperCase() ?? "";
  if (normalized === "CERRADO") return "Cerrado";
  if (normalized === "AJUSTADO") return "Ajustado";
  if (normalized === "ANULADO") return "Anulado";
  if (normalized === "REABIERTO") return "Reabierto";
  return normalized || "Sin estado";
}

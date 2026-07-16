import type { CloseCortePayload, CorteFilters } from "./contracts";

export type CorteCloseAttempt = {
  fingerprint: string;
  key: string;
};

export const CORTE_IDEMPOTENCY_HEADER = "Idempotency-Key" as const;

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)]),
  );
};

export function closeSubmissionFingerprint(
  payload: CloseCortePayload,
  filters: CorteFilters,
): string {
  return JSON.stringify(stableValue({ payload, filters }));
}

export function createCorteIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `corte:${crypto.randomUUID()}`;
  }
  return `corte:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateCloseAttempt(
  current: CorteCloseAttempt | null,
  payload: CloseCortePayload,
  filters: CorteFilters,
  generateKey: () => string = createCorteIdempotencyKey,
): CorteCloseAttempt {
  const fingerprint = closeSubmissionFingerprint(payload, filters);
  if (current?.fingerprint === fingerprint) return current;
  return { fingerprint, key: generateKey() };
}

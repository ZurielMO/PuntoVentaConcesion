/**
 * UUID v4 sin depender de `crypto.randomUUID()` (solo disponible en HTTPS).
 * En foodmarket por FTP se sirve en `http://`.
 */
function uuidV4(): string {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createId(): string {
  const c = globalThis.crypto;
  // Solo usar native en contexto seguro; tras polyfill, randomUUID apunta a uuidV4
  // y no debe reentrar por createId.
  if (c && typeof c.randomUUID === "function" && globalThis.isSecureContext) {
    try {
      return c.randomUUID();
    } catch {
      // HTTP / restricciones del navegador
    }
  }
  return uuidV4();
}

/** Polyfill global: NUNCA debe llamar createId (evita recursión infinita). */
export function ensureRandomUUID(): void {
  const c = globalThis.crypto as Crypto | undefined;
  if (!c || typeof c.randomUUID === "function") return;
  try {
    Object.defineProperty(c, "randomUUID", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: uuidV4,
    });
  } catch {
    // Algunos entornos no permiten redefinir crypto; createId sigue disponible.
  }
}

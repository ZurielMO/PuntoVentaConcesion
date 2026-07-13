/** Convierte URLs con token inválido a URL pública (?alt=media) para reglas Storage. */
export function normalizeStorageImageUrl(
  url: string | undefined | null,
): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (!trimmed.includes("firebasestorage.googleapis.com")) return trimmed;

  const bucketMatch = trimmed.match(/\/b\/([^/]+)\//);
  const pathMatch = trimmed.match(/\/o\/([^?]+)/);
  if (!bucketMatch || !pathMatch) return trimmed;

  return `https://firebasestorage.googleapis.com/v0/b/${bucketMatch[1]}/o/${pathMatch[1]}?alt=media`;
}

/**
 * Primera URL usable de un arreglo (o fallback).
 * Prefiere la última entrada no vacía: los uploads hacen append y el logo
 * vigente queda al final; entradas viejas pueden ser 404.
 */
export function firstStoredImage(
  imagenes?: string[] | null,
  fallback?: string | null,
): string | undefined {
  const urls = (imagenes ?? [])
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim());
  const raw = urls.at(-1) ?? (fallback?.trim() || undefined);
  return normalizeStorageImageUrl(raw);
}

/** @deprecated Prefer firstStoredImage; kept for productos POS. */
export function firstProductImage(
  imagenes?: string[] | null,
  imagen?: string | null,
): string | undefined {
  return firstStoredImage(imagenes, imagen);
}

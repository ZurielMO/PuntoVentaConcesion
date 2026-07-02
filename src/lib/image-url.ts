/** Convierte URLs con token inválido a URL pública (?alt=media) para reglas Storage. */
export function normalizeStorageImageUrl(
  url: string | undefined | null,
): string | undefined {
  if (!url) return undefined;
  if (!url.includes("firebasestorage.googleapis.com")) return url;

  const bucketMatch = url.match(/\/b\/([^/]+)\//);
  const pathMatch = url.match(/\/o\/([^?]+)/);
  if (!bucketMatch || !pathMatch) return url;

  return `https://firebasestorage.googleapis.com/v0/b/${bucketMatch[1]}/o/${pathMatch[1]}?alt=media`;
}

export function firstProductImage(
  imagenes?: string[] | null,
  imagen?: string | null,
): string | undefined {
  const raw = imagenes?.find(Boolean) ?? imagen;
  return normalizeStorageImageUrl(raw ?? undefined);
}

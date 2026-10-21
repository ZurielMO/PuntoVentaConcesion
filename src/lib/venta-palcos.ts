/**
 * Detecta ventas de palcos (sistema VIP Stripe) por convención de datos.
 * Case-insensitive: cajaNombre === "VIP", cajeroNombre contiene "VIP Stripe",
 * o ventaId empieza con "vip_".
 */
export function isVentaPalcos(venta: {
  cajaNombre?: string | null;
  cajeroNombre?: string | null;
  ventaId?: string | null;
} | null | undefined): boolean {
  if (!venta) return false;

  const cajaNombre = String(venta.cajaNombre ?? "")
    .trim()
    .toLowerCase();
  if (cajaNombre === "vip") return true;

  const cajeroNombre = String(venta.cajeroNombre ?? "")
    .trim()
    .toLowerCase();
  if (cajeroNombre.includes("vip stripe")) return true;

  const ventaId = String(venta.ventaId ?? "")
    .trim()
    .toLowerCase();
  if (ventaId.startsWith("vip_")) return true;

  return false;
}

/** Cargo de palcos sobre el neto. Ya incluye la comisión de Stripe. */
export const COMISION_PALCOS_PERCENT = 15;

/** Comisión en pesos, redondeada a centavos como el checkout de palcos. */
export function comisionPalcosDesdeNeto(neto: number): number {
  if (!Number.isFinite(neto) || neto <= 0) return 0;
  const minor = Math.round(neto * 100);
  return Math.round((minor * COMISION_PALCOS_PERCENT) / 100) / 100;
}

/** Neto de palcos más la comisión del 15%. */
export function totalCobradoPalcos(neto: number): number {
  if (!Number.isFinite(neto) || neto <= 0) return 0;
  const minor = Math.round(neto * 100);
  const feeMinor = Math.round((minor * COMISION_PALCOS_PERCENT) / 100);
  return (minor + feeMinor) / 100;
}

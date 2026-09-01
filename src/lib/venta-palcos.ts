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

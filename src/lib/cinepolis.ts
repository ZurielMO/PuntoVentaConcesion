export const CINEPOLIS_CASHIER_EMAIL = "cinepoliscl@clubleon.mx";

export const isCinepolisCashier = (email?: string | null): boolean =>
  (email ?? "").trim().toLowerCase() === CINEPOLIS_CASHIER_EMAIL;

/** Misma regla que concesiones / BackendCL: 10% del monto, redondeo estándar. */
export const calcularPuntosCinepolis = (montoMxn: number): number => {
  if (!Number.isFinite(montoMxn) || montoMxn <= 0) return 0;
  return Math.round(montoMxn * 0.1);
};

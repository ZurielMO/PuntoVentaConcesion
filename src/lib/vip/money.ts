export const VIP_SERVICE_FEE_PERCENT = 15;

export const formatVipAmount = (value: number): string =>
  Number(value || 0).toFixed(2);

export const formatVipMxn = (value: number): string =>
  `$${formatVipAmount(value)} MXN`;

const PRICE_WHOLE = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const PRICE_CENTS = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Precio para mostrar: "$150" en catálogo; "$150.00" donde se suman importes (`cents: "always"`).
 * Solo presentación; los importes que se cobran los calcula el backend.
 */
export const formatVipPrice = (value: number, { cents = "auto" }: { cents?: "auto" | "always" } = {}): string => {
  const amount = Number(value || 0);
  const useCents = cents === "always" || !Number.isInteger(Math.round(amount * 100) / 100);
  return `$${(useCents ? PRICE_CENTS : PRICE_WHOLE).format(amount)}`;
};

export const vipServiceFeeFromSubtotal = (subtotal: number): number => {
  const rawMinor = Math.round(Number(subtotal || 0) * 100);
  if (rawMinor <= 0) return 0;
  return Number((Math.round((rawMinor * VIP_SERVICE_FEE_PERCENT) / 100) / 100).toFixed(2));
};

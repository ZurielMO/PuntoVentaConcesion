export const VIP_SERVICE_FEE_PERCENT = 15;

export const formatVipAmount = (value: number): string =>
  Number(value || 0).toFixed(2);

export const formatVipMxn = (value: number): string =>
  `$${formatVipAmount(value)} MXN`;

export const vipServiceFeeFromSubtotal = (subtotal: number): number => {
  const rawMinor = Math.round(Number(subtotal || 0) * 100);
  if (rawMinor <= 0) return 0;
  return Number((Math.round((rawMinor * VIP_SERVICE_FEE_PERCENT) / 100) / 100).toFixed(2));
};

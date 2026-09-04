export const formatVipAmount = (value: number): string =>
  Number(value || 0).toFixed(2);

export const formatVipMxn = (value: number): string =>
  `$${formatVipAmount(value)} MXN`;

export function digitsFromPhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidMxPhone(value: string): boolean {
  const digits = digitsFromPhone(value);
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("52"));
}

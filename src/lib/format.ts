export function formatPrice(precio: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(precio ?? 0);
}

export function formatDateTime(fecha?: unknown) {
  if (!fecha) return "—";
  if (typeof fecha === "string") {
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? fecha : d.toLocaleString("es-MX");
  }
  if (typeof fecha === "object" && fecha !== null && "_seconds" in fecha) {
    const sec = (fecha as { _seconds: number })._seconds;
    return new Date(sec * 1000).toLocaleString("es-MX");
  }
  return "—";
}

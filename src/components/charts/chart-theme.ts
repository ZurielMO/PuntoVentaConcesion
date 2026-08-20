/**
 * Paleta y estilos compartidos por las gráficas del dashboard.
 * Los colores son literales (no var(--token)) porque Recharts los usa como
 * atributos SVG de fill/stroke y también para las leyendas.
 */
export const CHART_COLORS = [
  "#15803d", // green-accent
  "#052e16", // green-dark
  "#22c55e", // green-light-accent
  "#14532d", // green-secondary
  "#f59e0b", // yellow
  "#0e7490", // teal
  "#7c3aed", // violet
  "#dc2626", // red
] as const;

export const CHART_PRIMARY = CHART_COLORS[0];
export const CHART_DARK = CHART_COLORS[1];
export const CHART_LIGHT = CHART_COLORS[2];
export const CHART_WARNING = "#f59e0b";
export const CHART_DANGER = "#dc2626";

export const CHART_GRID = "rgba(5, 46, 22, 0.08)";
export const CHART_AXIS_TEXT = "rgba(5, 46, 22, 0.58)";

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/** Props comunes de los ejes: tipografía de 12px en la escala 62.5%. */
export const axisProps = {
  tick: { fill: CHART_AXIS_TEXT, fontSize: 12 },
  stroke: CHART_GRID,
  tickLine: false,
} as const;

export const cursorFill = "rgba(21, 128, 61, 0.06)";

/** Una decimal como máximo, sin ".0" colgando: 16500 -> "16.5k", 22000 -> "22k". */
function compact(value: number): string {
  const abs = Math.abs(value);
  const [divisor, sufijo] =
    abs >= 1_000_000 ? [1_000_000, "M"] : abs >= 1_000 ? [1_000, "k"] : [1, ""];
  const escalado = value / divisor;
  const redondeado = Math.round(escalado * 10) / 10;
  const texto = Number.isInteger(redondeado)
    ? String(redondeado)
    : redondeado.toFixed(1);
  return `${texto}${sufijo}`;
}

/** Ejes de dinero: "$16.5k" para no romper el ancho del eje. */
export function formatCompactMoney(value: number): string {
  return `$${compact(value)}`;
}

export function formatCompactNumber(value: number): string {
  return compact(value);
}

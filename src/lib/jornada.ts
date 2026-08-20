const JORNADA_ID_RE = /^(\d{4}-\d{2}-\d{2})__J(\d+)$/;

export function buildJornadaId(fecha: string, jornadaNumero: number | string) {
  return `${fecha}__J${jornadaNumero}`;
}

export function parseJornadaId(
  jornadaId?: string | null,
): { fecha: string; numero: number } | null {
  if (!jornadaId) return null;
  const match = jornadaId.match(JORNADA_ID_RE);
  if (!match) return null;
  return { fecha: match[1], numero: Number(match[2]) };
}

/** "2026-07-14__J11" -> "Jornada 11 · 14/07/2026" */
export function formatJornadaLabel(jornadaId?: string | null): string {
  const parsed = parseJornadaId(jornadaId);
  if (!parsed) return jornadaId ?? "—";
  const [y, m, d] = parsed.fecha.split("-");
  return `Jornada ${parsed.numero} · ${d}/${m}/${y}`;
}

/** Etiqueta corta para ejes de gráficas: "J11 14/07" */
export function formatJornadaShort(jornadaId?: string | null): string {
  const parsed = parseJornadaId(jornadaId);
  if (!parsed) return jornadaId ?? "—";
  const [, m, d] = parsed.fecha.split("-");
  return `J${parsed.numero} ${d}/${m}`;
}

/**
 * Orden cronológico ascendente. La fecha manda; el número de jornada sólo
 * desempata cuando dos jornadas caen el mismo día.
 */
export function compareJornadaIds(a: string, b: string): number {
  const pa = parseJornadaId(a);
  const pb = parseJornadaId(b);
  if (!pa || !pb) return a.localeCompare(b);
  if (pa.fecha !== pb.fecha) return pa.fecha < pb.fecha ? -1 : 1;
  return pa.numero - pb.numero;
}

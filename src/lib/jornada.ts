export type JornadaRama = "varonil" | "femenil";

/** Valor del select para ver ventas sin filtrar por jornada. */
export const JORNADA_TODAS_ID = "__todas__";

export const JORNADA_TODAS_LABEL = "Todas las jornadas (Ventas generales)";

export function isJornadaTodas(jornadaId?: string | null): boolean {
  return jornadaId === JORNADA_TODAS_ID;
}

const JORNADA_ID_RE = /^(\d{4}-\d{2}-\d{2})__J(\d+)(?:__(femenil))?$/;

export function normalizeRama(rama?: string | null): JornadaRama {
  return rama === "femenil" ? "femenil" : "varonil";
}

/** Normaliza fecha a YYYY-MM-DD (acepta YYYY-MM-DD o DD/MM/YYYY). */
export function normalizeFechaJornada(fecha: string): string {
  const raw = fecha.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return raw;
}

export function buildJornadaId(
  fecha: string,
  jornadaNumero: number | string,
  rama: JornadaRama | string | null | undefined = "varonil",
) {
  const r = normalizeRama(rama);
  const f = normalizeFechaJornada(String(fecha));
  return r === "femenil"
    ? `${f}__J${jornadaNumero}__femenil`
    : `${f}__J${jornadaNumero}`;
}

export function parseJornadaId(
  jornadaId?: string | null,
): { fecha: string; numero: number; rama: JornadaRama } | null {
  if (!jornadaId) return null;
  const match = jornadaId.match(JORNADA_ID_RE);
  if (!match) return null;
  return {
    fecha: match[1],
    numero: Number(match[2]),
    rama: match[3] === "femenil" ? "femenil" : "varonil",
  };
}

export function ramaLabel(rama?: JornadaRama | string | null): string {
  return normalizeRama(rama) === "femenil" ? "Femenil" : "Varonil";
}

/** Detecta rama en ids de jornada/inventario (`…__femenil` / `…__femenil__{suc}`). */
export function ramaFromId(id?: string | null): JornadaRama | null {
  const raw = String(id ?? "").trim();
  if (!raw) return null;
  if (/(?:^|__)femenil(?:__|$)/.test(raw)) return "femenil";
  if (/^\d{4}-\d{2}-\d{2}__J\d+/.test(raw)) return "varonil";
  return null;
}

/**
 * Alinea etiqueta de jornada con inventario cuando jornadaId quedó sin `__femenil`.
 */
export function alignJornadaIdWithInventario(
  jornadaId?: string | null,
  inventarioId?: string | null,
): string | null {
  const invId = String(inventarioId ?? "").trim();
  const current = String(jornadaId ?? "").trim();
  const ramaInv = ramaFromId(invId);
  if (!ramaInv || !invId) return current || null;

  const parsed = parseJornadaId(current);
  if (parsed) {
    if (parsed.rama === ramaInv) return current;
    return buildJornadaId(parsed.fecha, parsed.numero, ramaInv);
  }

  const match = invId.match(/^(\d{4}-\d{2}-\d{2})__J(\d+)/);
  if (match) return buildJornadaId(match[1], Number(match[2]), ramaInv);
  return current || null;
}

export function formatFechaDisplay(fecha: string): string {
  const normalized = normalizeFechaJornada(fecha);
  const [y, m, d] = normalized.split("-");
  if (!y || !m || !d) return fecha;
  return `${d}/${m}/${y}`;
}

/** Etiqueta rica para selects: número, fecha, rama, rival opcional. */
export function buildJornadaSelectLabel(opts: {
  numero: number;
  fecha: string;
  rama?: JornadaRama | string | null;
  equipoLocal?: string | null;
  equipoVisitante?: string | null;
  activa?: boolean;
}): string {
  const rama = normalizeRama(opts.rama);
  let label = `Jornada ${opts.numero} · ${formatFechaDisplay(opts.fecha)} · ${ramaLabel(rama)}`;
  if (opts.equipoLocal || opts.equipoVisitante) {
    label += ` · ${opts.equipoLocal ?? "—"} vs ${opts.equipoVisitante ?? "—"}`;
  }
  if (opts.activa) label += " · ACTIVA";
  return label;
}

/** "2026-07-14__J11" -> "Jornada 11 · 14/07/2026 · Varonil" */
export function formatJornadaLabel(
  jornadaId?: string | null,
  inventarioId?: string | null,
): string {
  const aligned = alignJornadaIdWithInventario(jornadaId, inventarioId);
  const parsed = parseJornadaId(aligned);
  if (!parsed) return aligned ?? jornadaId ?? "—";
  return buildJornadaSelectLabel({
    numero: parsed.numero,
    fecha: parsed.fecha,
    rama: parsed.rama,
  });
}

/** Etiqueta corta para ejes de gráficas: "J11 14/07" o "J11F 14/07" */
export function formatJornadaShort(jornadaId?: string | null): string {
  const parsed = parseJornadaId(jornadaId);
  if (!parsed) return jornadaId ?? "—";
  const [, m, d] = parsed.fecha.split("-");
  const prefix =
    parsed.rama === "femenil" ? `J${parsed.numero}F` : `J${parsed.numero}`;
  return `${prefix} ${d}/${m}`;
}

/**
 * Orden cronológico ascendente. La fecha manda; el número de jornada sólo
 * desempata cuando dos jornadas caen el mismo día; luego varonil antes que femenil.
 */
export function compareJornadaIds(a: string, b: string): number {
  const pa = parseJornadaId(a);
  const pb = parseJornadaId(b);
  if (!pa || !pb) return a.localeCompare(b);
  if (pa.fecha !== pb.fecha) return pa.fecha < pb.fecha ? -1 : 1;
  if (pa.numero !== pb.numero) return pa.numero - pb.numero;
  return pa.rama.localeCompare(pb.rama);
}

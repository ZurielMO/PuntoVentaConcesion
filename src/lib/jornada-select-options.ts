import {
  buildJornadaId,
  buildJornadaSelectLabel,
  normalizeFechaJornada,
  normalizeRama,
  type JornadaRama,
} from "@/lib/jornada";
import type { JornadaActivaValue, JornadaDisponible } from "@/lib/types";
import type { JornadaSelectOption } from "@/components/dashboard/jornada-select";

type ActivasPorRama = {
  varonil: JornadaActivaValue | null;
  femenil: JornadaActivaValue | null;
};

/**
 * Une jornadas históricas (Firestore) con activas (RTDB) para el select.
 * Marca activas, añade rival y ordena activas primero.
 */
export function buildJornadaSelectOptions(
  jornadas: JornadaDisponible[],
  activas: ActivasPorRama,
): JornadaSelectOption[] {
  const activeIds = new Set<string>();
  const activeMeta = new Map<
    string,
    { equipoLocal?: string; equipoVisitante?: string }
  >();

  for (const rama of ["varonil", "femenil"] as const) {
    const j = activas[rama];
    if (!j?.fecha || j.jornada == null) continue;
    const fecha = normalizeFechaJornada(String(j.fecha));
    const id = buildJornadaId(fecha, Number(j.jornada), rama);
    activeIds.add(id);
    activeMeta.set(id, {
      equipoLocal: j.equipo_local,
      equipoVisitante: j.equipo_visitante,
    });
  }

  // Asegurar que las activas aparezcan aunque aún no estén en `jornadas`.
  const byId = new Map<string, JornadaSelectOption>();

  for (const j of jornadas) {
    const rama = normalizeRama(j.rama);
    const activa = activeIds.has(j.jornadaId);
    const meta = activeMeta.get(j.jornadaId);
    byId.set(j.jornadaId, {
      jornadaId: j.jornadaId,
      numero: j.numero,
      fecha: j.fecha,
      rama,
      activa,
      equipoLocal: meta?.equipoLocal,
      equipoVisitante: meta?.equipoVisitante,
      etiqueta: buildJornadaSelectLabel({
        numero: j.numero,
        fecha: j.fecha,
        rama,
        equipoLocal: meta?.equipoLocal,
        equipoVisitante: meta?.equipoVisitante,
        activa,
      }),
    });
  }

  for (const jornadaId of activeIds) {
    if (byId.has(jornadaId)) continue;
    const meta = activeMeta.get(jornadaId);
    // Reconstruct from activas
    for (const rama of ["varonil", "femenil"] as const) {
      const j = activas[rama];
      if (!j?.fecha || j.jornada == null) continue;
      const fecha = normalizeFechaJornada(String(j.fecha));
      const id = buildJornadaId(fecha, Number(j.jornada), rama);
      if (id !== jornadaId) continue;
      byId.set(id, {
        jornadaId: id,
        numero: Number(j.jornada),
        fecha,
        rama,
        activa: true,
        equipoLocal: meta?.equipoLocal ?? j.equipo_local,
        equipoVisitante: meta?.equipoVisitante ?? j.equipo_visitante,
        etiqueta: buildJornadaSelectLabel({
          numero: Number(j.jornada),
          fecha,
          rama,
          equipoLocal: j.equipo_local,
          equipoVisitante: j.equipo_visitante,
          activa: true,
        }),
      });
    }
  }

  // Si hay femenil y varonil fantasma (misma fecha/número) y solo femenil está activa,
  // ocultar el varonil no activo.
  for (const opt of [...byId.values()]) {
    if (opt.rama !== "varonil" || opt.activa) continue;
    const femenilId = buildJornadaId(opt.fecha, opt.numero, "femenil");
    const femenil = byId.get(femenilId);
    if (femenil) {
      byId.delete(opt.jornadaId);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.activa !== b.activa) return a.activa ? -1 : 1;
    return (
      b.fecha.localeCompare(a.fecha) ||
      b.numero - a.numero ||
      String(a.rama as JornadaRama).localeCompare(String(b.rama as JornadaRama))
    );
  });
}

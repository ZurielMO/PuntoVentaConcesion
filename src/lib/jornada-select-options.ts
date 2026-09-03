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

function isActivaReal(j: JornadaActivaValue | null | undefined): boolean {
  return Boolean(j && j.activo === true && j.fecha && j.jornada != null);
}

/**
 * Une jornadas históricas (Firestore) con activas (RTDB) para el select.
 * Marca activas solo con activo===true. Conserva historial de ambas ramas.
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
    if (!isActivaReal(j)) continue;
    const fecha = normalizeFechaJornada(String(j!.fecha));
    const id = buildJornadaId(fecha, Number(j!.jornada), rama);
    activeIds.add(id);
    activeMeta.set(id, {
      equipoLocal: j!.equipo_local,
      equipoVisitante: j!.equipo_visitante,
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
    for (const rama of ["varonil", "femenil"] as const) {
      const j = activas[rama];
      if (!isActivaReal(j)) continue;
      const fecha = normalizeFechaJornada(String(j!.fecha));
      const id = buildJornadaId(fecha, Number(j!.jornada), rama);
      if (id !== jornadaId) continue;
      byId.set(id, {
        jornadaId: id,
        numero: Number(j!.jornada),
        fecha,
        rama,
        activa: true,
        equipoLocal: meta?.equipoLocal ?? j!.equipo_local,
        equipoVisitante: meta?.equipoVisitante ?? j!.equipo_visitante,
        etiqueta: buildJornadaSelectLabel({
          numero: Number(j!.jornada),
          fecha,
          rama,
          equipoLocal: j!.equipo_local,
          equipoVisitante: j!.equipo_visitante,
          activa: true,
        }),
      });
    }
  }

  // Fantasma: varonil no activo, misma fecha/número que femenil, y el varonil
  // no vino del listado histórico (solo se habría inyectado por error).
  // Si está en `jornadas` con rama varonil, se conserva (contabilidad).
  const historicoIds = new Set(jornadas.map((j) => j.jornadaId));
  for (const opt of [...byId.values()]) {
    if (opt.rama !== "varonil" || opt.activa) continue;
    if (historicoIds.has(opt.jornadaId)) continue;
    const femenilId = buildJornadaId(opt.fecha, opt.numero, "femenil");
    if (byId.has(femenilId)) {
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

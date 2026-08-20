import { compareJornadaIds, formatJornadaLabel, formatJornadaShort } from "@/lib/jornada";
import type {
  ComprobanteVenta,
  Concession,
  Corte,
  Sucursal,
  Zona,
} from "@/lib/types";

/** Fila de un desglose de ventas por dimensión (concesión, zona, sucursal, caja…). */
export type BreakdownItem = {
  id: string;
  nombre: string;
  total: number;
  transacciones: number;
  /** Porcentaje del total general, 0-100. */
  participacion: number;
};

export type JornadaStat = {
  jornadaId: string;
  label: string;
  shortLabel: string;
  total: number;
  transacciones: number;
  ticketPromedio: number;
};

export type ConcesionSerie = {
  /** Llave usada en el dataset de la gráfica apilada. */
  key: string;
  nombre: string;
};

export type JornadaConcesionData = {
  series: ConcesionSerie[];
  rows: Array<Record<string, string | number>>;
};

export type ProductoStat = {
  productoId: string;
  nombre: string;
  cantidad: number;
  subtotal: number;
};

export type Variacion = {
  /** null cuando no hay base de comparación (jornada anterior sin venta). */
  pct: number | null;
  direccion: "up" | "down" | "flat";
};

const montoVenta = (venta: ComprobanteVenta) => Number(venta.total ?? 0) || 0;

export function sumVentas(ventas: ComprobanteVenta[]): number {
  return ventas.reduce((acc, v) => acc + montoVenta(v), 0);
}

function buildBreakdown(
  ventas: ComprobanteVenta[],
  keyOf: (venta: ComprobanteVenta) => { id: string; nombre: string },
): BreakdownItem[] {
  const map = new Map<string, BreakdownItem>();
  let granTotal = 0;

  for (const venta of ventas) {
    const { id, nombre } = keyOf(venta);
    const monto = montoVenta(venta);
    granTotal += monto;
    const prev = map.get(id);
    if (prev) {
      prev.total += monto;
      prev.transacciones += 1;
    } else {
      map.set(id, {
        id,
        nombre,
        total: monto,
        transacciones: 1,
        participacion: 0,
      });
    }
  }

  const items = Array.from(map.values());
  for (const item of items) {
    item.participacion = granTotal > 0 ? (item.total / granTotal) * 100 : 0;
  }
  return items.sort((a, b) => b.total - a.total);
}

/** Ventas agrupadas por jornada, en orden cronológico ascendente. */
export function groupVentasByJornada(ventas: ComprobanteVenta[]): JornadaStat[] {
  const map = new Map<string, { total: number; transacciones: number }>();

  for (const venta of ventas) {
    const jornadaId = venta.jornadaId;
    // Las ventas legacy sin jornadaId no son comparables entre jornadas.
    if (!jornadaId) continue;
    const prev = map.get(jornadaId) ?? { total: 0, transacciones: 0 };
    prev.total += montoVenta(venta);
    prev.transacciones += 1;
    map.set(jornadaId, prev);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => compareJornadaIds(a, b))
    .map(([jornadaId, { total, transacciones }]) => ({
      jornadaId,
      label: formatJornadaLabel(jornadaId),
      shortLabel: formatJornadaShort(jornadaId),
      total,
      transacciones,
      ticketPromedio: transacciones > 0 ? total / transacciones : 0,
    }));
}

/**
 * Dataset para la gráfica apilada: una fila por jornada y una llave por
 * concesión. Sólo se incluyen las concesiones con venta en el rango.
 */
export function groupVentasByJornadaConcesion(
  ventas: ComprobanteVenta[],
  concessions: Concession[],
  jornadaIds?: string[],
): JornadaConcesionData {
  const permitidas = jornadaIds ? new Set(jornadaIds) : null;
  const nombrePorConcesion = new Map(concessions.map((c) => [c.id, c.nombre]));

  const porJornada = new Map<string, Map<string, number>>();
  const totalPorConcesion = new Map<string, number>();

  for (const venta of ventas) {
    const jornadaId = venta.jornadaId;
    if (!jornadaId) continue;
    if (permitidas && !permitidas.has(jornadaId)) continue;

    const concesionId = venta.concesionId || "sin-concesion";
    const monto = montoVenta(venta);

    const fila = porJornada.get(jornadaId) ?? new Map<string, number>();
    fila.set(concesionId, (fila.get(concesionId) ?? 0) + monto);
    porJornada.set(jornadaId, fila);

    totalPorConcesion.set(concesionId, (totalPorConcesion.get(concesionId) ?? 0) + monto);
  }

  const series: ConcesionSerie[] = Array.from(totalPorConcesion.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([concesionId]) => ({
      key: `c_${concesionId}`,
      nombre: nombrePorConcesion.get(concesionId) ?? "Sin concesión",
    }));

  const rows = Array.from(porJornada.entries())
    .sort(([a], [b]) => compareJornadaIds(a, b))
    .map(([jornadaId, fila]) => {
      const row: Record<string, string | number> = {
        jornadaId,
        label: formatJornadaLabel(jornadaId),
        shortLabel: formatJornadaShort(jornadaId),
      };
      for (const [concesionId, monto] of fila) {
        row[`c_${concesionId}`] = monto;
      }
      // Recharts necesita la llave presente en todas las filas para apilar.
      for (const serie of series) {
        if (row[serie.key] == null) row[serie.key] = 0;
      }
      return row;
    });

  return { series, rows };
}

export function groupVentasByConcesion(
  ventas: ComprobanteVenta[],
  concessions: Concession[],
): BreakdownItem[] {
  const nombrePorConcesion = new Map(concessions.map((c) => [c.id, c.nombre]));
  return buildBreakdown(ventas, (venta) => {
    const id = venta.concesionId || "sin-concesion";
    return { id, nombre: nombrePorConcesion.get(id) ?? "Sin concesión" };
  });
}

export function groupVentasByZona(
  ventas: ComprobanteVenta[],
  sucursales: Sucursal[],
  zonas: Zona[],
): BreakdownItem[] {
  const zonaPorSucursal = new Map(sucursales.map((s) => [s.id, s.zona_id]));
  const nombrePorZona = new Map(zonas.map((z) => [z.id, z.zona]));

  return buildBreakdown(ventas, (venta) => {
    const zonaId = venta.sucursalId ? zonaPorSucursal.get(venta.sucursalId) : undefined;
    if (!zonaId) return { id: "sin-zona", nombre: "Sin zona" };
    return { id: zonaId, nombre: nombrePorZona.get(zonaId) ?? "Sin zona" };
  });
}

export function groupVentasBySucursal(
  ventas: ComprobanteVenta[],
  sucursales: Sucursal[],
): BreakdownItem[] {
  const nombrePorSucursal = new Map(
    sucursales.map((s) => [s.id, s.nombre ?? s.id]),
  );
  return buildBreakdown(ventas, (venta) => {
    const id = venta.sucursalId || "sin-sucursal";
    return { id, nombre: nombrePorSucursal.get(id) ?? "Sin sucursal" };
  });
}

export function groupVentasByCaja(ventas: ComprobanteVenta[]): BreakdownItem[] {
  return buildBreakdown(ventas, (venta) => ({
    id: venta.cajaId || "sin-caja",
    nombre: venta.cajaNombre ?? "Sin caja",
  }));
}

/**
 * Top de productos a partir del resumen que cada corte guarda. Es la única
 * fuente disponible a nivel plataforma: el listado de comprobantes no incluye
 * las líneas de detalle.
 */
export function aggregateProductosFromCortes(cortes: Corte[]): ProductoStat[] {
  const map = new Map<string, ProductoStat>();

  for (const corte of cortes) {
    for (const linea of corte.productos ?? []) {
      const productoId = linea.productoId;
      if (!productoId) continue;
      const prev = map.get(productoId);
      const cantidad = Number(linea.cantidad ?? 0) || 0;
      const subtotal = Number(linea.subtotal ?? 0) || 0;
      if (prev) {
        prev.cantidad += cantidad;
        prev.subtotal += subtotal;
        if (!prev.nombre && linea.nombre) prev.nombre = linea.nombre;
      } else {
        map.set(productoId, {
          productoId,
          nombre: linea.nombre || productoId,
          cantidad,
          subtotal,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.subtotal - a.subtotal);
}

export function computeVariacion(actual: number, anterior: number): Variacion {
  if (!anterior || anterior <= 0) {
    return { pct: null, direccion: actual > 0 ? "up" : "flat" };
  }
  const pct = ((actual - anterior) / anterior) * 100;
  if (Math.abs(pct) < 0.05) return { pct: 0, direccion: "flat" };
  return { pct, direccion: pct > 0 ? "up" : "down" };
}

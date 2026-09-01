import type { ReporteProductoRow, ReporteProductoTotales } from "@/lib/types";

/**
 * Desglose por producto para concesiones GENERAL: como su único descuento es el
 * 2x1 de abonado (una unidad al precio de lista + una unidad a $0), no tiene
 * sentido separar ventas regulares de ventas de abonado. Las unidades pagadas se
 * suman en `ventas` y las gratis se cuentan en `cortesias`, de modo que
 * `ventas x precioUnitario = ventasTotales`.
 */
export type DesgloseGeneralRow = {
  productoId: string;
  nombre: string;
  inventarioInicial: number;
  inventarioFinal: number;
  /** Unidades pagadas (regular + abonado), sin cortesías. */
  ventas: number;
  /** Precio de lista del catálogo. */
  precioUnitario: number;
  /** Precio promedio realmente cobrado; 0 cuando no hubo ventas. */
  precioEfectivo: number;
  /** Incluye las unidades gratis del 2x1 (líneas a $0). */
  cortesias: number;
  ventasTotales: number;
  /** Parte de ventasTotales originada en VIP / VIP Stripe (palcos). */
  ventaPalcos: number;
};

export type DesgloseGeneralTotales = {
  ventas: number;
  cortesias: number;
  ventasTotales: number;
  ventaPalcos: number;
  puntosCanjeadosMonto: number;
  dineroReal: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Tolerancia para decidir si el precio cobrado difiere del precio de lista. */
export const PRECIO_TOLERANCIA = 0.01;

export const toDesgloseGeneralRow = (
  row: ReporteProductoRow,
): DesgloseGeneralRow => {
  const ventas = row.cantidadRegular + row.cantidadAbonado;
  const precioUnitario = round2(Number(row.precioActual ?? 0));
  const precioEfectivo = ventas > 0 ? round2(row.ventasTotales / ventas) : 0;

  return {
    productoId: row.productoId,
    nombre: row.nombre,
    inventarioInicial: row.inventarioInicial,
    inventarioFinal: row.inventarioFinal,
    ventas,
    precioUnitario: precioUnitario > 0 ? precioUnitario : precioEfectivo,
    precioEfectivo,
    cortesias: row.cortesias,
    ventasTotales: row.ventasTotales,
    ventaPalcos: Number(row.ventaPalcos ?? 0),
  };
};

export const toDesgloseGeneralTotales = (
  totales: ReporteProductoTotales,
): DesgloseGeneralTotales => ({
  ventas: totales.cantidadRegular + totales.cantidadAbonado,
  cortesias: totales.cortesias,
  ventasTotales: totales.ventasTotales,
  ventaPalcos: Number(totales.ventaPalcos ?? 0),
  puntosCanjeadosMonto: totales.puntosCanjeados,
  dineroReal: totales.dineroReal,
});

/**
 * Precio a mostrar como pista cuando el promedio cobrado no coincide con el
 * precio de lista (por ejemplo, un cambio de precio a media jornada).
 */
export const precioEfectivoDivergente = (
  row: DesgloseGeneralRow,
): number | null => {
  if (row.ventas <= 0 || row.precioEfectivo <= 0) return null;
  if (Math.abs(row.precioEfectivo - row.precioUnitario) <= PRECIO_TOLERANCIA) {
    return null;
  }
  return row.precioEfectivo;
};

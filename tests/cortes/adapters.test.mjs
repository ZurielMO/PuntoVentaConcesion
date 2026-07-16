import assert from "node:assert/strict";
import test from "node:test";
import {
  adaptCorteDashboard,
  adaptCorteHistory,
  adaptCorteHistoryPage,
  adaptCorteReport,
  adaptCorteSummary,
} from "../../src/features/cortes/adapters.ts";

test("adapta un resumen legacy sin reemplazar ceros válidos", () => {
  const summary = adaptCorteSummary({
    success: true,
    data: {
      id: "corte-legacy",
      estatus: "CERRADO",
      totalReal: 125,
      totalEfectivo: 0,
      totalCaja: 90,
      totalTarjeta: 125,
      efectivoContado: null,
    },
  });

  assert.equal(summary.totalVendido, 125);
  assert.equal(summary.totalEfectivo, 0);
  assert.equal(summary.totalTarjeta, 125);
  assert.equal(summary.efectivoContado, null);
  assert.equal(summary.corteCerrado, true);
});

test("adapta historial con snapshot v2 y respuesta envuelta", () => {
  const history = adaptCorteHistory({
    data: [
      {
        id: "folio-1",
        concesionId: "con-1",
        fecha: "2026-07-14",
        estatus: "CERRADO",
        resumen: {
          calculationVersion: "cortes-v2",
          finanzas: {
            dineroReal: 300,
            efectivoNeto: 180,
            tarjetaNeta: 120,
            cantidadTickets: 3,
          },
        },
      },
    ],
  });

  assert.equal(history.length, 1);
  assert.equal(history[0].totalReal, 300);
  assert.equal(history[0].totalEfectivo, 180);
  assert.equal(history[0].calculationVersion, "cortes-v2");
  assert.equal(history[0].hasAuthoritativeSnapshot, true);
});

test("adapta la pagina cursor del servidor y conserva el envelope legacy", () => {
  const page = adaptCorteHistoryPage({
    data: [{ id: "c-1", concesionId: "con-1", fecha: "2026-07-14", estatus: "CERRADO", totalReal: 0 }],
    items: [{ id: "c-1" }],
    count: 1,
    meta: { nextCursor: "opaque_cursor", hasMore: true, limit: 25 },
  });
  const legacy = adaptCorteHistoryPage([{ id: "c-2", concesionId: "con-1", fecha: "2026-07-13", estatus: "CERRADO", totalReal: 0 }]);

  assert.deepEqual(page.items.map((row) => row.id), ["c-1"]);
  assert.deepEqual(page.meta, { nextCursor: "opaque_cursor", hasMore: true, limit: 25 });
  assert.equal(page.count, 1);
  assert.deepEqual(legacy.items.map((row) => row.id), ["c-2"]);
  assert.deepEqual(legacy.meta, { nextCursor: null, hasMore: false, limit: 1 });
});

test("conserva snapshots autoritativos y auditoría del cierre", () => {
  const summary = adaptCorteSummary({
    id: "folio-2",
    businessDate: "2026-07-14",
    totalesSnapshot: {
      dineroReal: 480,
      efectivoNeto: 300,
      tarjetaNeta: 180,
      cantidadTickets: 6,
    },
    comisionSnapshot: { importeComision: 24, baseComision: 480, porcentajeAplicado: 5 },
    abonadosSnapshot: { operaciones: 2, unidades: 3, importeCobrado: 100, descuentoOtorgado: 15 },
    cortesiasSnapshot: { cantidad: 1, valorTeorico: 25 },
    mermaSnapshot: { cantidad: 1, valorTeorico: 10 },
    promocionesSnapshot: { montoTotal: 80, montoDescuento: 20, unidadesGratis: 1, cantidadTransacciones: 1 },
  });

  assert.equal(summary.totalVendido, 480);
  assert.equal(summary.comision.importeComision, 24);
  assert.equal(summary.abonados.operaciones, 2);
  assert.equal(summary.cortesias.valorTeorico, 25);
  assert.equal(summary.merma.valorTeorico, 10);
  assert.equal(summary.promociones.montoDescuento, 20);
  assert.equal(summary.businessDate, "2026-07-14");
});

test("deduplica folios y genera identidad estable para filas legacy sin id", () => {
  const base = {
    concesionId: "con-1",
    sucursalId: "suc-1",
    cajaId: "caja-1",
    idUser: "seller-1",
    fecha: "2026-07-14",
    estatus: "CERRADO",
    totalReal: 100,
  };
  const history = adaptCorteHistory([
    { ...base, id: "folio-1" },
    { ...base, id: "folio-1", totalReal: 999 },
    base,
    base,
  ]);

  assert.equal(history.length, 2);
  assert.equal(history[0].totalReal, 100);
  assert.match(history[1].id, /^legacy-/);
});

test("adapta dashboard actual y reporte legacy", () => {
  const dashboard = adaptCorteDashboard({
    data: {
      ventasNetas: 450,
      dineroReal: 400,
      efectivo: 250,
      tarjeta: 150,
      tickets: 4,
      incidencias: [{ codigo: "CORTE_PENDING", bloqueante: true }],
      cortesRecientes: [],
      jornadaId: "2026-07-14__J2",
      businessDate: "2026-07-14",
    },
  });
  const report = adaptCorteReport({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "2026-07-14__J2" },
    productos: null,
    productoTotales: null,
    resumen: [],
    ingresos: null,
  });

  assert.equal(dashboard.ventasNetas, 450);
  assert.equal(dashboard.incidencias[0].bloqueante, true);
  assert.equal(dashboard.jornadaId, "2026-07-14__J2");
  assert.equal(dashboard.businessDate, "2026-07-14");
  assert.equal(report?.jornada.jornadaId, "2026-07-14__J2");
  assert.equal(report?.productos, null);
});

test("conserva el inventario snapshot explicito para detalle y PDF", () => {
  const [corte] = adaptCorteHistory({
    data: [{
      id: "folio-inv",
      concesionId: "con-1",
      fecha: "2026-07-14",
      estatus: "CERRADO",
      calculationVersion: "cortes-v2",
      inventarioSnapshot: {
        unidadesVendidas: 2,
        unidadesCortesia: 1,
        unidadesMerma: 0,
        items: [{ productoId: "p1", nombre: "Agua", vendidas: 2, cortesias: 1, merma: 0 }],
      },
    }],
  });

  assert.equal(corte.availability.inventario, true);
  assert.equal(corte.inventario.items[0].nombre, "Agua");
  assert.equal(corte.inventario.items[0].vendidas, 2);
});

test("adapta bloques extendidos del reporte sin fabricar conciliación física", () => {
  const report = adaptCorteReport({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "2026-07-14__J2" },
    productos: [{
      productoId: "p1",
      nombre: "Agua",
      inventarioInicial: 20,
      inventarioFinal: 12,
      cantidadRegular: 5,
      cantidadAbonado: 1,
      ventasRegular: 100,
      ventasAbonado: 20,
      cortesias: 1,
      puntosCanjeados: 0,
      ventasTotales: 120,
    }],
    ingresos: {
      ventasNetas: 480,
      dineroReal: 420,
      totalEfectivo: 240,
      totalTarjeta: 180,
      totalPuntosMonto: 60,
      cantidadVentas: 6,
      abonados: { operaciones: 2, unidades: 3, importeCobrado: 100, descuentoOtorgado: 15 },
      cortesias: { cantidad: 1, valorTeorico: 25 },
      promociones: { montoTotal: 80, montoDescuento: 20, unidadesGratis: 1, cantidadTransacciones: 1 },
      combos: { montoTotal: 90, cantidadVendidos: 2, items: [] },
      merma: { cantidad: 1, valorTeorico: 10 },
      cancelaciones: 1,
      reembolsos: 5,
      comision: { importeComision: 24, baseComision: 480, porcentajeAplicado: 5 },
    },
  });

  assert.equal(report?.ingresos?.abonados.operaciones, 2);
  assert.equal(report?.ingresos?.promociones.montoDescuento, 20);
  assert.equal(report?.ingresos?.combos.cantidadVendidos, 2);
  assert.equal(report?.ingresos?.comision.importeComision, 24);
  assert.equal(report?.productos?.[0].esperado, null);
  assert.equal(report?.productos?.[0].fisico, null);
  assert.equal(report?.productos?.[0].diferencia, null);
});

test("distingue ausencia legacy de ceros históricos explícitos", () => {
  const legacy = adaptCorteReport({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "2026-07-14__J2" },
    ingresos: {
      ventaNeta: 0,
      totalEfectivo: 0,
      totalTarjeta: 0,
      totalPuntosMonto: 0,
      totalPuntosCanjeados: 0,
      ventasConPuntos: 0,
      cantidadVentas: 0,
    },
  });
  const current = adaptCorteReport({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "2026-07-14__J2" },
    ingresos: {
      ventaNeta: 0,
      totalEfectivo: 0,
      totalTarjeta: 0,
      totalPuntosMonto: 0,
      totalPuntosCanjeados: 0,
      ventasConPuntos: 0,
      cantidadVentas: 0,
      abonados: { operaciones: 0, unidades: 0, importeCobrado: 0, descuentoOtorgado: 0 },
      cortesias: { cantidad: 0, valorTeorico: 0 },
      promociones: { montoTotal: 0, montoDescuento: 0, unidadesGratis: 0, cantidadTransacciones: 0, items: [] },
      combos: { montoTotal: 0, cantidadVendidos: 0, items: [] },
      merma: { cantidad: 0, valorTeorico: 0, items: [] },
      cancelaciones: 0,
      reembolsos: 0,
      comision: { importeComision: 0, baseComision: 0, porcentajeAplicado: 0 },
    },
  });

  assert.equal(legacy?.ingresos?.abonados, undefined);
  assert.equal(legacy?.ingresos?.availability.abonados, false);
  assert.equal(legacy?.ingresos?.availability.totalEfectivo, true);
  assert.equal(legacy?.ingresos?.totalEfectivo, 0);
  assert.equal(current?.ingresos?.availability.abonados, true);
  assert.equal(current?.ingresos?.abonados?.operaciones, 0);
  assert.equal(current?.ingresos?.availability.comision, true);
  assert.equal(current?.ingresos?.comision?.importeComision, 0);
});

test("adapta puntos y descuentos por concesi�n sin convertir ausencia en cero", () => {
  const report = adaptCorteReport({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "J2" },
    resumen: [
      { concesionId: "c1", nombre: "Norte", porcentajeComision: 10, totalVenta: 100, comision: 10, gananciaConcesion: 90, totalPuntosCanjeados: 25, valorPuntosCanjeados: 2.5, descuentos: 0 },
      { concesionId: "c2", nombre: "Sur", porcentajeComision: 0, totalVenta: 0, comision: 0, gananciaConcesion: 0 },
    ],
    ingresos: null,
  });

  assert.equal(report?.resumen[0].totalPuntosCanjeados, 25);
  assert.equal(report?.resumen[0].valorPuntosCanjeados, 2.5);
  assert.equal(report?.resumen[0].descuentos, 0);
  assert.equal(report?.resumen[1].totalPuntosCanjeados, undefined);
  assert.equal(report?.resumen[1].valorPuntosCanjeados, undefined);
  assert.equal(report?.resumen[1].descuentos, undefined);
});

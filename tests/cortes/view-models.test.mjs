import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClosePayload,
  buildCloseScopeIdentity,
  buildInventoryCsv,
  buildInventoryRows,
  buildUiIncidents,
  filterCorteHistory,
  popCorteHistoryCursor,
  pushCorteHistoryCursor,
  resolveHistoricalMoneyValue,
  isCloseSummaryFresh,
  queryInventoryRows,
  sanitizeCorteDeepLink,
  canSubmitReviewedClose,
  resetCloseReviewState,
  selectOperationalSummarySource,
  splitCorteFilterScopes,
  validateCloseContext,
} from "../../src/features/cortes/view-models.ts";

const summary = (overrides = {}) => ({
  totalVendido: 500,
  totalEfectivo: 300,
  totalTarjeta: 200,
  totalPuntosMonto: 0,
  totalPuntosCanjeados: 0,
  ventasConPuntos: 0,
  cantidadVentas: 5,
  productos: [],
  promociones2x1: { montoTotal: 0, montoDescuento: 0, unidadesGratis: 0, cantidadTransacciones: 0 },
  combos: { montoTotal: 0, cantidadVendidos: 0, items: [] },
  efectivoContado: null,
  diferenciaCaja: null,
  cajaNombre: "Caja 1",
  cajeroNombre: "Vendedor",
  corteCerrado: false,
  corteId: null,
  ...overrides,
});

const dashboard = {
  ventasNetas: 450,
  dineroReal: 400,
  efectivo: 250,
  tarjeta: 150,
  puntos: 0,
  puntosCanjeados: 0,
  tickets: 4,
  ticketPromedio: 100,
  unidadesVendidas: 7,
  comision: null,
  inventario: null,
  incidencias: [],
  ventasPorHora: [],
  metodosPago: [],
  cortesRecientes: [],
  warnings: [],
  abonados: { cantidad: 0, monto: 0, ahorro: 0 },
  promociones: { montoTotal: 0, montoDescuento: 0, unidadesGratis: 0, cantidadTransacciones: 0 },
  combos: { montoTotal: 0, cantidadVendidos: 0, items: [] },
  cortesias: { cantidad: 0, monto: 0 },
  merma: { cantidad: 0, monto: 0 },
  cancelaciones: { cantidad: 0, monto: 0 },
  reembolsos: { cantidad: 0, monto: 0 },
};

test("separa la autoridad operativa actual de los filtros históricos", () => {
  const scopes = splitCorteFilterScopes({
    concesionId: "con-1",
    sucursalId: "suc-1",
    cajaId: "caja-1",
    idUser: "seller-1",
    sesionCajaId: "session-1",
    jornadaId: "2026-07-14__J2",
    inventarioId: "inv-1",
    fecha: "2026-07-14",
    limit: 200,
  });

  assert.deepEqual(scopes.operational, {
    concesionId: "con-1",
    sucursalId: "suc-1",
    cajaId: "caja-1",
    idUser: "seller-1",
    sesionCajaId: "session-1",
  });
  assert.equal(scopes.historical.jornadaId, "2026-07-14__J2");
  assert.equal(scopes.historical.inventarioId, "inv-1");
  assert.equal(scopes.historical.fecha, "2026-07-14");
});

test("usa resumen exacto sólo para unidad exacta y dashboard para agregados", () => {
  const exact = selectOperationalSummarySource({
    role: "ADMIN",
    filters: { sucursalId: "suc-1", cajaId: "caja-1", idUser: "seller-1" },
    dashboard,
    summary: summary({ efectivoContado: 300, diferenciaCaja: 0 }),
  });
  const aggregate = selectOperationalSummarySource({
    role: "ADMIN",
    filters: { sucursalId: "suc-1" },
    dashboard,
    summary: summary({ efectivoContado: 300, diferenciaCaja: -50 }),
  });

  assert.equal(exact.source, "exact-unit");
  assert.equal(exact.data.diferenciaCaja, 0);
  assert.equal(aggregate.source, "aggregate-dashboard");
  assert.equal(aggregate.data.totalVendido, 400);
  assert.equal(aggregate.data.efectivoContado, null);
  assert.equal(aggregate.data.diferenciaCaja, null);
});

test("no inventa conciliación física con dimensiones incompletas", () => {
  const [withoutPhysical, withPhysical] = buildInventoryRows({
    productos: [
      { productoId: "p1", nombre: "Agua", inventarioInicial: 20, inventarioFinal: 12, cantidadRegular: 5, cantidadAbonado: 1, ventasRegular: 0, ventasAbonado: 0, cortesias: 1, puntosCanjeados: 0, ventasTotales: 0 },
      { productoId: "p2", nombre: "Refresco", inventarioInicial: 10, inventarioFinal: 9, cantidadRegular: 1, cantidadAbonado: 0, ventasRegular: 0, ventasAbonado: 0, cortesias: 0, puntosCanjeados: 0, ventasTotales: 0, esperado: 9, fisico: 6, diferencia: -3, estadoConciliacion: "critico" },
    ],
  });

  assert.deepEqual(
    { esperado: withoutPhysical.esperado, fisico: withoutPhysical.fisico, diferencia: withoutPhysical.diferencia, status: withoutPhysical.status },
    { esperado: null, fisico: null, diferencia: null, status: "sin-conciliacion" },
  );
  assert.deepEqual(
    { esperado: withPhysical.esperado, fisico: withPhysical.fisico, diferencia: withPhysical.diferencia, status: withPhysical.status },
    { esperado: 9, fisico: 6, diferencia: -3, status: "critico" },
  );
});

test("crea incidencias sólo con señales explícitas del servidor", () => {
  const rows = buildInventoryRows({
    productos: [
      { productoId: "p1", nombre: "Agua", inventarioInicial: 20, inventarioFinal: 12, cantidadRegular: 5, cantidadAbonado: 1, ventasRegular: 0, ventasAbonado: 0, cortesias: 1, puntosCanjeados: 0, ventasTotales: 0 },
      { productoId: "p2", nombre: "Refresco", inventarioInicial: 10, inventarioFinal: 9, cantidadRegular: 1, cantidadAbonado: 0, ventasRegular: 0, ventasAbonado: 0, cortesias: 0, puntosCanjeados: 0, ventasTotales: 0, esperado: 9, fisico: 6, diferencia: -3 },
    ],
  });
  const incidents = buildUiIncidents({
    incidents: [{ codigo: "CORTE_PENDING", bloqueante: true }],
    warnings: ["LEGACY_FALLBACK"],
    summaryDifference: -120,
    inventoryRows: rows,
  });

  assert.deepEqual(
    incidents.map(({ code, severity, section }) => ({ code, severity, section })),
    [
      { code: "CORTE_PENDING", severity: "critical", section: "caja-actual" },
      { code: "LEGACY_FALLBACK", severity: "warning", section: "reporte" },
      { code: "CASH_DIFFERENCE", severity: "critical", section: "caja-actual" },
      { code: "INVENTORY_DIFFERENCE", severity: "critical", section: "inventario" },
    ],
  );
  assert.equal(incidents.some((item) => item.id === "inventory-p1"), false);
});

test("filtra, ordena, pagina y exporta inventario sin alterar valores nulos", () => {
  const rows = buildInventoryRows({
    productos: [
      { productoId: "p1", nombre: "Agua, \"natural\"", inventarioInicial: 20, inventarioFinal: 12, cantidadRegular: 5, cantidadAbonado: 1, ventasRegular: 0, ventasAbonado: 0, cortesias: 1, puntosCanjeados: 0, ventasTotales: 0 },
      { productoId: "p2", nombre: "Refresco", inventarioInicial: 10, inventarioFinal: 9, cantidadRegular: 1, cantidadAbonado: 0, ventasRegular: 0, ventasAbonado: 0, cortesias: 0, puntosCanjeados: 0, ventasTotales: 0, esperado: 9, fisico: 6, diferencia: -3 },
    ],
  });
  const result = queryInventoryRows({ rows, search: "refresco", filter: "con-diferencia", sort: "diferencia", page: 1, pageSize: 1 });
  const csv = buildInventoryCsv(rows);

  assert.deepEqual(result.rows.map((row) => row.productoId), ["p2"]);
  assert.match(csv, /^Producto,Inicial,/);
  assert.match(csv, /"Agua, ""natural"""/);
  assert.match(csv, /12,,,,sin-conciliacion/);
});

test("filtra estados y fecha de la pagina entregada por el servidor", () => {
  const rows = [
    { id: "c-1", estatus: "CERRADO", fecha: "2026-07-14", businessDate: "2026-07-14" },
    { id: "c-2", estatus: "ANULADO", fecha: "2026-07-14", businessDate: "2026-07-14" },
    { id: "c-3", estatus: "LEGACY", fecha: "2026-07-13", businessDate: "2026-07-13" },
  ];
  assert.deepEqual(filterCorteHistory(rows, { status: "ANULADO", businessDate: "2026-07-14" }).map((row) => row.id), ["c-2"]);
  assert.deepEqual(filterCorteHistory(rows, { status: "OTRO" }).map((row) => row.id), ["c-3"]);
});

test("navega cursores opacos sin duplicar una pagina", () => {
  const first = pushCorteHistoryCursor([], "cursor-2");
  const duplicate = pushCorteHistoryCursor(first, "cursor-2");
  const third = pushCorteHistoryCursor(duplicate, "cursor-3");

  assert.deepEqual(first, ["cursor-2"]);
  assert.deepEqual(duplicate, ["cursor-2"]);
  assert.deepEqual(third, ["cursor-2", "cursor-3"]);
  assert.deepEqual(popCorteHistoryCursor(third), ["cursor-2"]);
});

test("preserva ausencia historica y cero explicito en tarjetas de actividad", () => {
  assert.equal(resolveHistoricalMoneyValue(false, 0), null);
  assert.equal(resolveHistoricalMoneyValue(true, 0), 0);
  assert.equal(resolveHistoricalMoneyValue(true, 125.5), 125.5);
  assert.equal(resolveHistoricalMoneyValue(undefined, 0), null);
});

test("cierre exige resumen actual cargado con exito y se recupera tras refrescar", () => {
  const fresh = { hasSummary: true, loading: false, error: null, stale: false, partial: false, lastUpdatedAt: new Date("2026-07-14T18:00:00Z") };
  assert.equal(isCloseSummaryFresh(fresh), true);
  assert.equal(isCloseSummaryFresh({ ...fresh, error: "fallo", stale: true }), false);
  assert.equal(isCloseSummaryFresh({ ...fresh, loading: true }), false);
  assert.equal(isCloseSummaryFresh({ ...fresh, partial: true }), false);
  assert.equal(isCloseSummaryFresh({ ...fresh, lastUpdatedAt: null }), false);
  assert.equal(isCloseSummaryFresh({ ...fresh, lastUpdatedAt: new Date("2026-07-14T18:05:00Z") }), true);
});

test("sanea deep links cuando las opciones cargadas ya no existen", () => {
  const state = sanitizeCorteDeepLink(
    {
      section: "historial",
      filters: { concesionId: "con-1", sucursalId: "stale", cajaId: "caja-1", idUser: "seller-1", inventarioId: "inv-1", jornadaId: "2026-07-14__J2" },
      historyPage: 2,
      historyLimit: 100,
      historyStatus: "",
      businessDate: "2026-07-13",
    },
    { concessionIds: ["con-1"], branchIds: ["suc-1"], cashboxIds: [], userIds: [], inventoryIds: [], jornadas: [{ jornadaId: "2026-07-14__J2", fecha: "2026-07-14" }] },
  );

  assert.deepEqual(state.filters, { concesionId: "con-1", jornadaId: "2026-07-14__J2" });
  assert.equal(state.businessDate, "2026-07-14");
});

test("valida businessDate sin jornada contra las fechas realmente cargadas", () => {
  const base = {
    section: "historial",
    filters: {},
    historyPage: 1,
    historyLimit: 100,
    historyStatus: "",
    businessDate: "2026-07-14",
  };
  const jornadas = [{ jornadaId: "2026-07-14__J2", fecha: "2026-07-14" }];

  assert.equal(sanitizeCorteDeepLink(base, { jornadas }).businessDate, "2026-07-14");
  assert.equal(
    sanitizeCorteDeepLink({ ...base, businessDate: "2025-01-01" }, { jornadas }).businessDate,
    "",
  );
});

test("no permite cerrar B con una revisión y conteo confirmados para A", () => {
  const scopeA = buildCloseScopeIdentity({
    concessionId: "con-1",
    branchId: "suc-1",
    filters: { cajaId: "caja-A", idUser: "seller-A", inventarioId: "inv-A" },
    operationalContext: { jornadaId: "2026-07-14__J1", businessDate: "2026-07-14" },
  });
  const scopeB = buildCloseScopeIdentity({
    concessionId: "con-1",
    branchId: "suc-1",
    filters: { cajaId: "caja-B", idUser: "seller-B", inventarioId: "inv-B" },
    operationalContext: { jornadaId: "2026-07-14__J2", businessDate: "2026-07-14" },
  });

  assert.notEqual(scopeA, scopeB);
  assert.equal(canSubmitReviewedClose({ validationValid: true, confirmationValid: true, reviewedScopeIdentity: scopeA, currentScopeIdentity: scopeB }), false);
  assert.equal(canSubmitReviewedClose({ validationValid: true, confirmationValid: true, reviewedScopeIdentity: scopeB, currentScopeIdentity: scopeB }), true);
  assert.equal(canSubmitReviewedClose({ validationValid: false, confirmationValid: true, reviewedScopeIdentity: scopeB, currentScopeIdentity: scopeB }), false);
  assert.deepEqual(resetCloseReviewState(scopeB), {
    currentScopeIdentity: scopeB,
    reviewedScopeIdentity: null,
    step: "review",
    counted: "",
    comment: "",
    result: null,
  });
});

test("exige unidad operativa actual para cerrar y limita el payload", () => {
  assert.deepEqual(
    validateCloseContext({ role: "SUPERADMIN", filters: {}, concessionId: "con-1", branchId: "suc-1", summary: summary() }),
    { valid: false, reason: "El consolidado no representa una caja individual." },
  );
  assert.equal(
    validateCloseContext({ role: "ADMIN", filters: { sucursalId: "suc-1", cajaId: "caja-1", idUser: "seller-1", jornadaId: "J2" }, concessionId: "con-1", branchId: "suc-1", summary: summary() }).valid,
    false,
  );
  assert.equal(
    validateCloseContext({ role: "VENDEDOR", filters: {}, concessionId: "con-1", branchId: "suc-1", summary: summary() }).valid,
    false,
  );
  assert.equal(
    validateCloseContext({ role: "VENDEDOR", filters: {}, concessionId: "con-1", branchId: "suc-1", summary: summary({ jornadaId: "2026-07-14__J2", businessDate: "2026-07-14" }) }).valid,
    true,
  );
  assert.deepEqual(buildClosePayload(123.456, "  Conteo verificado  ", { jornadaId: "2026-07-14__J2", businessDate: "2026-07-14" }), {
    efectivoContado: 123.46,
    comentarios: "Conteo verificado",
    expectedJornadaId: "2026-07-14__J2",
    expectedBusinessDate: "2026-07-14",
  });
});

test("la identidad revisada cambia cuando rota la jornada aun si vuelve a la misma caja", () => {
  const base = { concessionId: "con-1", branchId: "suc-1", filters: { cajaId: "caja-1", idUser: "seller-1" } };
  const a = buildCloseScopeIdentity({ ...base, operationalContext: { jornadaId: "2026-07-14__J1", businessDate: "2026-07-14" } });
  const b = buildCloseScopeIdentity({ ...base, operationalContext: { jornadaId: "2026-07-14__J2", businessDate: "2026-07-14" } });
  assert.notEqual(a, b);
});

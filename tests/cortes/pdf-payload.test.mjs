import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHistoricalCortePdfPayload,
  buildReportCortePdfPayload,
  buildCortePdfPrintModel,
  buildCortePdfPageLabels,
  buildCortePdfSmartSummary,
  getCortePdfContinuationHeader,
  getCortePdfProductPointPresentation,
  normalizeCortePdfScopeLabels,
} from "../../src/features/cortes/pdf-payload.ts";

const historyBase = {
  id: "folio-1",
  concesionId: "con-1",
  sucursalId: "suc-1",
  cajaId: "caja-1",
  cajaNombre: "Caja 1",
  idUser: "seller-1",
  cajeroNombre: "Vendedor 1",
  jornadaId: "2026-07-14__J2",
  fecha: "2026-07-14",
  businessDate: "2026-07-14",
  generatedAt: "2026-07-15T02:00:00.000Z",
  estatus: "CERRADO",
  totalReal: 0,
  totalEfectivo: 0,
  totalTarjeta: 0,
  efectivoContado: null,
  diferenciaCaja: null,
  hasAuthoritativeSnapshot: false,
};

const completeZeroHistory = {
  ...historyBase,
  hasAuthoritativeSnapshot: true,
  ventasBrutas: 0,
  descuentos: 0,
  ventasNetas: 0,
  dineroReal: 0,
  totalPuntosMonto: 0,
  fondoInicial: 0,
  efectivoEsperado: 0,
  efectivoContado: 0,
  diferenciaCaja: 0,
  cantidadVentas: 0,
  ticketPromedio: 0,
  unidadesVendidas: 0,
  comision: { porcentajeAplicado: 0, baseComision: 0, importeComision: 0 },
  inventario: {
    unidadesVendidas: 0,
    unidadesCortesia: 0,
    unidadesMerma: 0,
    items: [{
      productoId: "p0",
      nombre: "Producto sin movimiento",
      vendidas: 0,
      cortesias: 0,
      merma: 0,
      esperado: 0,
      fisico: 0,
      diferencia: 0,
      estadoConciliacion: "correcto",
    }],
  },
  incidencias: [],
  availability: {
    ventasBrutas: true,
    descuentos: true,
    ventasNetas: true,
    dineroReal: true,
    totalEfectivo: true,
    totalTarjeta: true,
    totalPuntosMonto: true,
    fondoInicial: true,
    efectivoEsperado: true,
    efectivoContado: true,
    diferenciaCaja: true,
    cantidadVentas: true,
    ticketPromedio: true,
    unidadesVendidas: true,
    comision: true,
    inventario: true,
    incidencias: true,
  },
};

test("payload histórico B13 es versionado y marca métricas faltantes como N/D", () => {
  const payload = buildHistoricalCortePdfPayload(historyBase, {}, "historical-cut");
  const model = buildCortePdfPrintModel(payload);

  assert.equal(payload.schemaVersion, "cortes-pdf/v1");
  assert.equal(payload.document.type, "historical-cut");
  assert.equal(payload.document.folio, "folio-1");
  assert.equal(payload.timing.timezone, "America/Mexico_City");
  assert.equal(payload.scope.caja, "Caja 1");
  assert.equal(payload.financial.ventasBrutas.available, false);
  assert.equal(payload.cash.efectivoContado.available, false);
  assert.equal(payload.inventory.available, false);
  assert.equal(model.sections.some((section) => section.rows.some((row) => row.value === "N/D")), true);
  assert.equal(model.pagination, "Página {page} de {total}");

  const closePayload = buildHistoricalCortePdfPayload(
    {
      ...historyBase,
      hasAuthoritativeSnapshot: true,
      efectivoContado: 0,
      diferenciaCaja: 0,
      comision: { porcentajeAplicado: 0, baseComision: 0, importeComision: 0 },
      availability: { comision: true, efectivoContado: true, diferenciaCaja: true },
    },
    {},
    "close-snapshot",
  );
  assert.equal(closePayload.schemaVersion, payload.schemaVersion);
  assert.equal(closePayload.document.type, "close-snapshot");
  assert.equal(closePayload.cash.efectivoContado.available, true);
  assert.equal(closePayload.cash.efectivoContado.value, 0);
  assert.equal(closePayload.commission.amount.available, true);
  assert.equal(closePayload.commission.amount.value, 0);
});

test("payload de reporte preserva cero explícito y conciliación física real", () => {
  const payload = buildReportCortePdfPayload({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "2026-07-14__J2" },
    productos: [{
      productoId: "p1", nombre: "Agua", inventarioInicial: 10, inventarioFinal: 8,
      cantidadRegular: 2, cantidadAbonado: 0, ventasRegular: 0, ventasAbonado: 0,
      cortesias: 0, puntosCanjeados: 0, ventasTotales: 0,
      esperado: 8, fisico: 8, diferencia: 0, estadoConciliacion: "correcto",
    }],
    productoTotales: null,
    resumen: [],
    ingresos: {
      ventaNeta: 0,
      totalEfectivo: 0,
      totalTarjeta: 0,
      totalPuntosMonto: 0,
      totalPuntosCanjeados: 0,
      ventasConPuntos: 0,
      cantidadVentas: 0,
      abonados: { operaciones: 0, unidades: 0, importeCobrado: 0, descuentoOtorgado: 0 },
      availability: { ventaNeta: true, totalEfectivo: true, totalTarjeta: true, totalPuntosMonto: true, totalPuntosCanjeados: true, ventasConPuntos: true, cantidadVentas: true, abonados: true },
    },
    incidencias: [],
    warnings: [],
  }, { concesion: "Concesión 1" });

  assert.equal(payload.financial.ventasNetas.available, true);
  assert.equal(payload.financial.ventasNetas.value, 0);
  assert.equal(payload.subscribers.available, true);
  assert.equal(payload.subscribers.operaciones.value, 0);
  assert.equal(payload.inventory.available, true);
  assert.equal(payload.inventory.rows[0].diferencia.value, 0);
});

test("genera numeración determinista para todas las páginas jsPDF", () => {
  assert.deepEqual(buildCortePdfPageLabels(3), [
    "Página 1 de 3",
    "Página 2 de 3",
    "Página 3 de 3",
  ]);
});

test("resumen inteligente prioriza caja, incidencias severas e inventario crítico", () => {
  const payload = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    diferenciaCaja: -150,
    incidencias: [{ codigo: "VENTA_INCONSISTENTE", bloqueante: true }],
    inventario: {
      ...completeZeroHistory.inventario,
      items: [{
        ...completeZeroHistory.inventario.items[0],
        fisico: 5,
        diferencia: 5,
        estadoConciliacion: "crítico",
      }],
    },
  });
  const summary = buildCortePdfSmartSummary(payload);

  assert.equal(summary.status, "critico");
  assert.deepEqual(summary.findings.slice(0, 3).map((item) => item.id), [
    "cash-difference",
    "incidents-blocking",
    "inventory-critical",
  ]);
  assert.match(summary.findings[0].detail, /-\$150\.00|\$-150\.00/);
});

test("cero explícito produce estado correcto y no se confunde con N/D", () => {
  const summary = buildCortePdfSmartSummary(buildHistoricalCortePdfPayload(completeZeroHistory));

  assert.equal(summary.status, "correcto");
  assert.equal(summary.coverage.percentage, 100);
  assert.equal(summary.findings.find((item) => item.id === "cash-difference")?.status, "correcto");
  assert.match(summary.findings.find((item) => item.id === "payment-mix")?.detail ?? "", /\$0\.00/);
});

test("datos parciales quedan incompletos sin inventar conclusiones sobre N/D", () => {
  const summary = buildCortePdfSmartSummary(buildHistoricalCortePdfPayload(historyBase));

  assert.equal(summary.status, "incompleto");
  assert.equal(summary.coverage.percentage < 100, true);
  assert.equal(summary.findings.some((item) => item.id === "cash-difference"), false);
  assert.equal(summary.findings.some((item) => item.title === "Caja conciliada"), false);
  assert.match(summary.findings.find((item) => item.id === "coverage")?.detail ?? "", /N\/D no se interpretan/);
});

test("mix monetario valida antes de afirmar que puntos están excluidos", () => {
  const payload = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    ventasBrutas: 200,
    ventasNetas: 200,
    dineroReal: 150,
    totalReal: 150,
    totalEfectivo: 100,
    totalTarjeta: 50,
    totalPuntosMonto: 50,
  });
  const paymentFinding = buildCortePdfSmartSummary(payload).findings.find((item) => item.id === "payment-mix");

  assert.equal(paymentFinding?.status, "correcto");
  assert.match(paymentFinding?.detail ?? "", /67% efectivo y 33% tarjeta/);
  assert.match(paymentFinding?.detail ?? "", /tolerancia de ±\$0\.01/);
  assert.match(paymentFinding?.detail ?? "", /exclusión queda validada/);
});

test("discrepancia entre dinero real y cobros monetarios exige revisión", () => {
  const payload = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    dineroReal: 140,
    totalReal: 140,
    totalEfectivo: 100,
    totalTarjeta: 50,
    totalPuntosMonto: 10,
  });
  const paymentFinding = buildCortePdfSmartSummary(payload).findings.find((item) => item.id === "payment-mix");

  assert.equal(paymentFinding?.status, "revisar");
  assert.equal(paymentFinding?.title, "Cobros monetarios incompatibles");
  assert.match(paymentFinding?.detail ?? "", /\$140\.00 no coincide con efectivo \+ tarjeta \$150\.00/);
  assert.doesNotMatch(paymentFinding?.detail ?? "", /exclusión queda validada/);
});

test("cobros parciales distinguen efectivo, tarjeta y puntos-only sin fabricar ceros", () => {
  const smartPayment = (overrides) => {
    const payload = buildHistoricalCortePdfPayload({
      ...completeZeroHistory,
      dineroReal: undefined,
      totalReal: undefined,
      totalEfectivo: undefined,
      totalCaja: undefined,
      totalTarjeta: undefined,
      totalPuntosMonto: undefined,
      availability: {
        ...completeZeroHistory.availability,
        dineroReal: false,
        totalEfectivo: false,
        totalTarjeta: false,
        totalPuntosMonto: false,
        ...overrides.availability,
      },
      ...overrides.values,
    });
    return buildCortePdfSmartSummary(payload).findings.find((item) => item.id === "payment-mix");
  };

  const cashOnly = smartPayment({
    availability: { totalEfectivo: true },
    values: { totalEfectivo: 100 },
  });
  const cardOnly = smartPayment({
    availability: { totalTarjeta: true },
    values: { totalTarjeta: 80 },
  });
  const pointsOnly = smartPayment({
    availability: { totalPuntosMonto: true },
    values: { totalPuntosMonto: 25 },
  });

  assert.match(cashOnly?.detail ?? "", /Efectivo disponible: \$100\.00; tarjeta N\/D/);
  assert.match(cardOnly?.detail ?? "", /Tarjeta disponible: \$80\.00; efectivo N\/D/);
  assert.match(pointsOnly?.detail ?? "", /Efectivo N\/D y tarjeta N\/D/);
  assert.doesNotMatch(pointsOnly?.detail ?? "", /Tarjeta disponible: \$0\.00/);
  assert.equal(pointsOnly?.status, "incompleto");
});

test("normaliza y deduplica métodos semánticos conservando extras reales", () => {
  const payload = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    totalEfectivo: 100,
    totalTarjeta: 50,
    metodosPago: {
      Efectivo: 999,
      "TARJETA CREDITO": 999,
      PUNTOS: 10,
      Transferencia: 20,
      transferencia: 20,
    },
  });

  assert.deepEqual(Object.keys(payload.payments.methods), ["efectivo", "tarjeta", "puntos", "Transferencia"]);
  assert.equal(payload.payments.methods.efectivo.value, 100);
  assert.equal(payload.payments.methods.tarjeta.value, 50);
  assert.equal(payload.payments.methods.puntos.value, 10);
});

test("normaliza el nombre legacy de concesión para la API pública del PDF", () => {
  assert.deepEqual(normalizeCortePdfScopeLabels("Concesión Norte"), { concesion: "Concesión Norte" });
  assert.deepEqual(
    normalizeCortePdfScopeLabels({ concesion: "Concesión Sur", caja: "Caja 2" }),
    { concesion: "Concesión Sur", caja: "Caja 2" },
  );
});

test("resumen inteligente es determinista, ordenado y limitado", () => {
  const payload = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    diferenciaCaja: 25,
    incidencias: [{ codigo: "REVISION_MANUAL" }],
  });
  const first = buildCortePdfSmartSummary(payload, { maxFindings: 5 });
  const second = buildCortePdfSmartSummary(payload, { maxFindings: 5 });

  assert.deepEqual(first, second);
  assert.equal(first.findings.length, 5);
  assert.deepEqual(
    first.findings.map((item) => item.priority),
    [...first.findings.map((item) => item.priority)].sort((left, right) => left - right),
  );
});

test("modelo imprimible incluye tipo, versiones e inventario snapshot", () => {
  const payload = buildHistoricalCortePdfPayload({
    ...historyBase,
    calculationVersion: "cortes-v2",
    hasAuthoritativeSnapshot: true,
    availability: { inventario: true },
    inventario: {
      unidadesVendidas: 2,
      unidadesCortesia: 1,
      unidadesMerma: 0,
      items: [{ productoId: "p1", nombre: "Agua", vendidas: 2, cortesias: 1, merma: 0 }],
    },
  });
  const model = buildCortePdfPrintModel(payload);
  const identity = model.sections.find((section) => section.title === "Identidad y alcance");

  assert.equal(identity.rows.find((row) => row.label === "Versión del cálculo").value, "cortes-v2");
  assert.equal(identity.rows.find((row) => row.label === "Versión del payload").value, "cortes-pdf/v1");
  assert.equal(identity.rows.find((row) => row.label === "Tipo de documento").value, "Reporte de jornada por concesión");
  assert.deepEqual(model.inventoryRows[0].slice(0, 2), ["p1", "Agua"]);
});

test("tipo visible solo declara corte de caja con alcance y arqueo completos", () => {
  const cashCut = buildHistoricalCortePdfPayload({ ...completeZeroHistory, secuencia: 42 });
  const noScope = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    cajaId: null,
    cajaNombre: null,
    idUser: null,
    cajeroNombre: null,
  });
  const intermediate = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    idUser: null,
    cajeroNombre: null,
  });

  assert.equal(cashCut.document.visibleTypeLabel, "Corte de caja");
  assert.equal(cashCut.document.readableFolio, "C-20260714-42");
  assert.equal(noScope.document.visibleTypeLabel, "Reporte de jornada por concesión");
  assert.equal(intermediate.document.visibleTypeLabel, "Reporte de jornada por concesión");
});

test("estado documental respeta fuente y cobertura sin fabricar finales", () => {
  const final = buildHistoricalCortePdfPayload(completeZeroHistory);
  const adjusted = buildHistoricalCortePdfPayload({ ...completeZeroHistory, estatus: "AJUSTADO" });
  const annulled = buildHistoricalCortePdfPayload({ ...completeZeroHistory, estatus: "ANULADO" });
  const incomplete = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    totalTarjeta: undefined,
    availability: { ...completeZeroHistory.availability, totalTarjeta: false },
  });

  assert.equal(final.document.documentStatus, "FINAL");
  assert.equal(adjusted.document.documentStatus, "AJUSTADO");
  assert.equal(annulled.document.documentStatus, "ANULADO");
  assert.equal(incomplete.document.documentStatus, "INCOMPLETO");
  assert.deepEqual(incomplete.missingData.map((item) => item.field), ["tarjeta"]);
  assert.match(incomplete.missingData[0].impact, /efectivo \+ tarjeta = dinero real/);
});

test("exportación usa fecha México y separa usuario generador de cerrado por", () => {
  const payload = buildHistoricalCortePdfPayload(
    { ...completeZeroHistory, calculationVersion: "cortes-v3", closedBy: "usuario-cierre" },
    {},
    "historical-cut",
    { generatedBy: "Usuario exportador", exportedAt: "2026-07-15T02:00:00.000Z" },
  );

  assert.match(payload.timing.exportedAtFormatted, /14\/07\/2026.*20:00:00/);
  assert.equal(payload.document.calculationVersion, "cortes-v3");
  assert.equal(payload.audit.generatedBy.value, "Usuario exportador");
  assert.equal(payload.audit.closedBy.value, "usuario-cierre");
});

test("conciliación usa valores fuente, conserva deltas y tolerancia", () => {
  const reconciled = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    ventasBrutas: 200,
    descuentos: 20,
    ventasNetas: 180,
    totalEfectivo: 100,
    totalTarjeta: 50,
    dineroReal: 150,
    totalReal: 150,
    totalPuntosMonto: 30,
  });
  const withAdjustments = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    ventasBrutas: 200,
    descuentos: 20,
    ventasNetas: 170,
    totalEfectivo: 100,
    totalTarjeta: 50,
    dineroReal: 150,
    totalReal: 150,
    totalPuntosMonto: 30,
    cancelaciones: 10,
  });

  assert.equal(reconciled.reconciliation.status, "correcto");
  assert.equal(reconciled.reconciliation.grossMinusDiscounts.value, 180);
  assert.equal(reconciled.reconciliation.cashPlusCard.value, 150);
  assert.equal(reconciled.reconciliation.reconciledTotal.value, 180);
  assert.equal(reconciled.reconciliation.finalDifference.value, 0);
  assert.equal(withAdjustments.financial.ventasNetas.value, 170);
  assert.equal(withAdjustments.reconciliation.salesDelta.value, -10);
  assert.equal(withAdjustments.reconciliation.finalDifference.value, 10);
  assert.equal(withAdjustments.reconciliation.status, "revisar");
});

test("puntos distinguen cantidad, valor MXN y regla aplicada", () => {
  const payload = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    totalPuntosCanjeados: 250,
    totalPuntosMonto: 25,
  });
  const benefits = buildCortePdfPrintModel(payload).sections.find((section) => section.title === "Beneficios (no aditivos)");

  assert.equal(payload.points.redeemed.value, 250);
  assert.equal(payload.points.value.value, 25);
  assert.equal(payload.points.rule.value, "10 puntos = $1 MXN");
  assert.equal(benefits.rows.find((row) => row.label === "Puntos canjeados").value, "250");
  assert.match(benefits.rows.find((row) => row.label === "Valor cubierto con puntos").value, /\$25\.00/);
  assert.match(benefits.rows.find((row) => row.label === "Criterio").value, /no sumar/);
});

test("inventario de reporte conserva filas parciales y ceros fuente", () => {
  const payload = buildReportCortePdfPayload({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "J2" },
    productos: [
      {
        productoId: "p1", nombre: "Agua", inventarioInicial: 10, inventarioFinal: 8,
        cantidadRegular: 2, cantidadAbonado: 0, ventasRegular: 40, ventasAbonado: 0,
        cortesias: 0, puntosCanjeados: 0, ventasTotales: 40,
        entradas: 0, esperado: 8, fisico: 8, diferencia: 0,
      },
      {
        productoId: "p2", nombre: "Refresco", inventarioInicial: 5, inventarioFinal: 4,
        cantidadRegular: 1, cantidadAbonado: 0, ventasRegular: 20, ventasAbonado: 0,
        cortesias: 0, puntosCanjeados: 0, ventasTotales: 20,
        esperado: null, fisico: null, diferencia: null,
      },
    ],
    productoTotales: null,
    resumen: [],
    ingresos: null,
    incidencias: [],
  });

  assert.equal(payload.inventory.available, true);
  assert.equal(payload.inventory.rows.length, 2);
  assert.equal(payload.inventory.rows[0].inicial.value, 10);
  assert.equal(payload.inventory.rows[0].entradas.value, 0);
  assert.equal(payload.inventory.rows[0].abonado.value, 0);
  assert.equal(payload.inventory.rows[1].fisico.available, false);
});

test("trazabilidad solo expone snapshot autoritativo y datos realmente existentes", () => {
  const authoritative = buildHistoricalCortePdfPayload(
    { ...completeZeroHistory, conteoComprobantes: 0, hasAuthoritativeSnapshot: true },
    {},
    "historical-cut",
    { generatedBy: "Auditor" },
  );
  const legacy = buildHistoricalCortePdfPayload({ ...completeZeroHistory, hasAuthoritativeSnapshot: false });

  assert.equal(authoritative.audit.snapshotId.value, "folio-1");
  assert.equal(authoritative.audit.receiptCount.value, 0);
  assert.equal(authoritative.audit.generatedBy.value, "Auditor");
  assert.equal(authoritative.audit.includedCutIds.available, false);
  assert.equal(legacy.audit.snapshotId.available, false);
});

test("consolidado sin ingresos usa rollup presentacional y conciliación N/A", () => {
  const payload = buildReportCortePdfPayload({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "J2" },
    productos: null,
    productoTotales: null,
    ingresos: null,
    resumen: [
      { concesionId: "c1", nombre: "Norte", porcentajeComision: 10, totalVenta: 100, comision: 10, gananciaConcesion: 90 },
      { concesionId: "c2", nombre: "Sur", porcentajeComision: 20, totalVenta: 200, comision: 40, gananciaConcesion: 160 },
    ],
    incidencias: [],
  }, {}, { generatedBy: "Superadmin", exportedAt: "2026-07-15T02:00:00.000Z" });

  assert.equal(payload.document.visibleTypeLabel, "Reporte de jornada por concesión");
  assert.equal(payload.document.documentStatus, "PRELIMINAR");
  assert.equal(payload.reconciliation.status, "no-aplica");
  assert.equal(payload.rollup.baseComisionable.value, 300);
  assert.equal(payload.rollup.commission.value, 50);
  assert.equal(payload.rollup.netAfterCommission.value, 250);
  assert.equal(payload.rollup.concessions.value, 2);
});

test("encabezado de continuación conserva el tipo visible del documento", () => {
  const report = buildHistoricalCortePdfPayload({
    ...completeZeroHistory,
    cajaId: null,
    cajaNombre: null,
    idUser: null,
    cajeroNombre: null,
  }, {});
  const cashCut = buildHistoricalCortePdfPayload(completeZeroHistory, {
    caja: "Caja 1",
    vendedor: "Vendedor 1",
  });

  assert.equal(getCortePdfContinuationHeader(report), "Reporte de jornada por concesión");
  assert.equal(getCortePdfContinuationHeader(cashCut), "Corte de caja");
});

test("puntos por producto distingue cantidad no expuesta de valor MXN", () => {
  const points = getCortePdfProductPointPresentation(18);
  const missing = getCortePdfProductPointPresentation(null);

  assert.deepEqual(points.redeemedPoints, { available: false, value: null });
  assert.deepEqual(points.coveredValue, { available: true, value: 18 });
  assert.deepEqual(missing.coveredValue, { available: false, value: null });
});

test("consolidado agrupa beneficios por concesi�n sin incorporarlos al dinero real", () => {
  const payload = buildReportCortePdfPayload({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "J2" },
    productos: null,
    productoTotales: null,
    ingresos: null,
    resumen: [
      { concesionId: "c1", nombre: "Norte", porcentajeComision: 10, totalVenta: 100, comision: 10, gananciaConcesion: 90, totalPuntosCanjeados: 25, valorPuntosCanjeados: 2.5, descuentos: 10 },
      { concesionId: "c2", nombre: "Sur", porcentajeComision: 20, totalVenta: 200, comision: 40, gananciaConcesion: 160, totalPuntosCanjeados: 0, valorPuntosCanjeados: 0, descuentos: 0 },
    ],
    incidencias: [],
  });
  const rollup = buildCortePdfPrintModel(payload).sections.find((section) => section.title === "Resumen por concesi�n");

  assert.equal(payload.rollup.redeemedPoints.value, 25);
  assert.equal(payload.rollup.coveredPointValue.value, 2.5);
  assert.equal(payload.rollup.discounts.value, 10);
  assert.equal(payload.payments.dineroReal.available, false);
});

test("consolidado conserva N/D cuando una concesi�n no expone beneficios", () => {
  const payload = buildReportCortePdfPayload({
    jornada: { fecha: "2026-07-14", numero: 2, jornadaId: "J2" },
    productos: null, productoTotales: null, ingresos: null, incidencias: [],
    resumen: [
      { concesionId: "c1", nombre: "Norte", porcentajeComision: 0, totalVenta: 0, comision: 0, gananciaConcesion: 0, totalPuntosCanjeados: 0, valorPuntosCanjeados: 0, descuentos: 0 },
      { concesionId: "c2", nombre: "Sur", porcentajeComision: 0, totalVenta: 0, comision: 0, gananciaConcesion: 0 },
    ],
  });

  assert.equal(payload.rollup.redeemedPoints.available, false);
  assert.equal(payload.rollup.coveredPointValue.available, false);
  assert.equal(payload.rollup.discounts.available, false);
});

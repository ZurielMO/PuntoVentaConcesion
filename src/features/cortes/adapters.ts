import type {
  CorteCommission,
  CorteDashboard,
  CorteHistoryItem,
  CorteIncident,
  CorteInventorySummary,
  CorteComboSummary,
  CorteCourtesySummary,
  CortePromotionSummary,
  CorteReport,
  CorteSubscriberSummary,
  CorteSummary,
  CorteWasteSummary,
  CorteAvailability,
  CorteCashMovements,
  CorteHistoryPage,
} from "./contracts";

type UnknownRecord = Record<string, unknown>;

const emptyPromotions = {
  montoTotal: 0,
  montoDescuento: 0,
  unidadesGratis: 0,
  cantidadTransacciones: 0,
};

const emptyCombos = {
  montoTotal: 0,
  cantidadVendidos: 0,
  items: [],
};

export function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

export function unwrapApiData(value: unknown): unknown {
  const response = asRecord(value);
  return Object.prototype.hasOwnProperty.call(response, "data")
    ? response.data
    : value;
}

const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const optionalText = (value: unknown): string | undefined => {
  const parsed = text(value).trim();
  return parsed || undefined;
};

const finite = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nullableFinite = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const optionalFinite = (value: unknown): number | undefined =>
  nullableFinite(value) ?? undefined;

const hasFinite = (value: unknown): boolean => optionalFinite(value) !== undefined;

const hasObjectData = (value: unknown): boolean =>
  Object.keys(asRecord(value)).length > 0;

const cashMovements = (value: unknown): CorteCashMovements | undefined => {
  const row = asRecord(value);
  const entradas = optionalFinite(row.entradas);
  const salidas = optionalFinite(row.salidas);
  const retiros = optionalFinite(row.retiros);
  const depositos = optionalFinite(row.depositos);
  const devoluciones = optionalFinite(row.devoluciones ?? row.devolucionesEfectivo);
  const ajustes = optionalFinite(row.ajustes);
  const neto = optionalFinite(row.neto);
  if (
    entradas === undefined && salidas === undefined && retiros === undefined &&
    depositos === undefined && devoluciones === undefined && ajustes === undefined &&
    neto === undefined
  ) return undefined;
  return {
    ...(entradas !== undefined ? { entradas } : {}),
    ...(salidas !== undefined ? { salidas } : {}),
    ...(retiros !== undefined ? { retiros } : {}),
    ...(depositos !== undefined ? { depositos } : {}),
    ...(devoluciones !== undefined ? { devoluciones } : {}),
    ...(ajustes !== undefined ? { ajustes } : {}),
    ...(neto !== undefined ? { neto } : {}),
  };
};

const firstFinite = (...values: unknown[]): number => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const incidents = (value: unknown): CorteIncident[] =>
  Array.isArray(value)
    ? value.map((entry) => {
        const row = asRecord(entry);
        return {
          codigo: text(row.codigo, "INCIDENCIA_SIN_CODIGO"),
          ...(optionalText(row.ventaId) ? { ventaId: text(row.ventaId) } : {}),
          ...(Number.isFinite(Number(row.linea))
            ? { linea: Number(row.linea) }
            : {}),
          ...(typeof row.bloqueante === "boolean"
            ? { bloqueante: row.bloqueante }
            : {}),
        };
      })
    : [];

const commission = (value: unknown): CorteCommission => {
  const row = asRecord(value);
  return {
    porcentajeAplicado: finite(row.porcentajeAplicado),
    baseComision: finite(row.baseComision),
    importeComision: finite(row.importeComision ?? row.comision),
    ...(optionalText(row.reglaRedondeo)
      ? { reglaRedondeo: text(row.reglaRedondeo) }
      : {}),
  };
};

const inventory = (value: unknown): CorteInventorySummary => {
  const row = asRecord(value);
  return {
    unidadesVendidas: finite(row.unidadesVendidas),
    unidadesCortesia: finite(row.unidadesCortesia),
    unidadesMerma: finite(row.unidadesMerma),
    items: Array.isArray(row.items)
      ? row.items.map((entry) => {
          const item = asRecord(entry);
          return {
            productoId: text(item.productoId, "sin-producto"),
            nombre: text(item.nombre, "Producto"),
            vendidas: finite(item.vendidas),
            cortesias: finite(item.cortesias),
            merma: finite(item.merma),
            esperado: nullableFinite(item.esperado),
            fisico: nullableFinite(item.fisico),
            diferencia: nullableFinite(item.diferencia),
            estadoConciliacion: optionalText(item.estadoConciliacion) ?? null,
          };
        })
      : [],
  };
};

const subscribers = (value: unknown): CorteSubscriberSummary => {
  const row = asRecord(value);
  return {
    operaciones: finite(row.operaciones),
    unidades: finite(row.unidades),
    importeCobrado: finite(row.importeCobrado),
    descuentoOtorgado: finite(row.descuentoOtorgado),
  };
};

const courtesies = (value: unknown): CorteCourtesySummary => {
  const row = asRecord(value);
  return {
    cantidad: finite(row.cantidad),
    valorTeorico: finite(row.valorTeorico),
  };
};

const waste = (value: unknown): CorteWasteSummary => {
  const row = asRecord(value);
  return {
    ...courtesies(row),
    items: Array.isArray(row.items)
      ? row.items.map((entry) => {
          const item = asRecord(entry);
          return {
            productoId: text(item.productoId, "sin-producto"),
            nombre: text(item.nombre, "Producto"),
            cantidad: finite(item.cantidad),
            valorTeorico: finite(item.valorTeorico),
          };
        })
      : [],
  };
};

const promotions = (value: unknown): CortePromotionSummary => {
  const row = asRecord(value);
  return {
    montoTotal: finite(row.montoTotal),
    montoDescuento: finite(row.montoDescuento),
    unidadesGratis: finite(row.unidadesGratis),
    cantidadTransacciones: finite(row.cantidadTransacciones),
    items: Array.isArray(row.items)
      ? row.items.map((entry) => {
          const item = asRecord(entry);
          return {
            id: text(item.id, "sin-promocion"),
            nombre: text(item.nombre, "Promoción"),
            montoTotal: finite(item.montoTotal),
            montoDescuento: finite(item.montoDescuento),
            unidadesGratis: finite(item.unidadesGratis),
            cantidadTransacciones: finite(item.cantidadTransacciones),
          };
        })
      : [],
  };
};

const combos = (value: unknown): CorteComboSummary => {
  const row = asRecord(value);
  return {
    montoTotal: finite(row.montoTotal),
    cantidadVendidos: finite(row.cantidadVendidos),
    items: Array.isArray(row.items)
      ? row.items.map((entry) => {
          const item = asRecord(entry);
          return {
            comboId: text(item.comboId, "sin-combo"),
            nombre: text(item.nombre, "Combo"),
            cantidadVendidos: finite(item.cantidadVendidos),
            montoTotal: finite(item.montoTotal),
          };
        })
      : [],
  };
};

export function adaptCorteSummary(value: unknown): CorteSummary {
  const row = asRecord(unwrapApiData(value));
  const snapshot = asRecord(row.resumen);
  const finances = asRecord(snapshot.finanzas ?? row.finanzas ?? row.totalesSnapshot);
  const caja = asRecord(snapshot.caja ?? row.caja);
  const promotionRow = asRecord(
    row.promociones2x1 ?? row.promociones ?? snapshot.promociones ?? row.promocionesSnapshot,
  );
  const comboRow = asRecord(row.combos ?? snapshot.combos ?? row.combosSnapshot);
  const subscriberSource = row.abonados ?? snapshot.abonados ?? row.abonadosSnapshot;
  const courtesySource = row.cortesias ?? snapshot.cortesias ?? row.cortesiasSnapshot;
  const wasteSource = row.merma ?? snapshot.merma ?? row.mermaSnapshot;
  const inventorySource = row.inventario ?? snapshot.inventario ?? row.inventarioSnapshot;
  const commissionSource = row.comision ?? snapshot.comision ?? row.comisionSnapshot;
  const incidentSource = row.incidencias ?? snapshot.incidencias;
  const paymentSource = row.metodosPago ?? snapshot.metodosPago ?? row.metodosPagoSnapshot;
  const movementsSource = row.movimientosCaja ?? caja.movimientosCaja ?? caja;
  const availability: CorteAvailability = {
    ventasBrutas: hasFinite(row.ventasBrutas) || hasFinite(finances.ventasBrutas),
    descuentos:
      hasFinite(row.descuentos) ||
      hasFinite(finances.descuentosPromocion) ||
      hasFinite(finances.descuentosAbonado),
    ventasNetas: hasFinite(row.ventasNetas) || hasFinite(finances.ventasNetas),
    dineroReal:
      hasFinite(row.dineroReal) ||
      hasFinite(row.totalReal) ||
      hasFinite(finances.dineroReal),
    totalEfectivo:
      hasFinite(row.totalEfectivo) ||
      hasFinite(row.totalCaja) ||
      hasFinite(finances.efectivoNeto),
    totalTarjeta: hasFinite(row.totalTarjeta) || hasFinite(finances.tarjetaNeta),
    totalPuntosMonto:
      hasFinite(row.totalPuntosMonto) || hasFinite(finances.valorPuntosCanjeados),
    totalPuntosCanjeados:
      hasFinite(row.totalPuntosCanjeados) || hasFinite(finances.cantidadPuntosCanjeados),
    ventasConPuntos:
      hasFinite(row.ventasConPuntos) || hasFinite(finances.cantidadVentasConPuntos),
    cantidadVentas: hasFinite(row.cantidadVentas) || hasFinite(finances.cantidadTickets),
    abonados: hasObjectData(subscriberSource),
    cortesias: hasObjectData(courtesySource),
    promociones: Object.keys(promotionRow).length > 0,
    combos: Object.keys(comboRow).length > 0,
    merma: hasObjectData(wasteSource),
    cancelaciones: hasFinite(row.cancelaciones) || hasFinite(finances.cancelaciones),
    reembolsos: hasFinite(row.reembolsos) || hasFinite(finances.reembolsos),
    comision: hasObjectData(commissionSource),
    ticketPromedio: hasFinite(row.ticketPromedio) || hasFinite(finances.ticketPromedio),
    unidadesVendidas: hasFinite(row.unidadesVendidas) || hasFinite(finances.cantidadUnidades),
    ajustes: hasFinite(row.ajustes) || hasFinite(caja.ajustes),
    fondoInicial: hasFinite(row.fondoInicial) || hasFinite(caja.fondoInicial),
    movimientosCaja: hasObjectData(movementsSource),
    efectivoEsperado: hasFinite(row.efectivoEsperado) || hasFinite(caja.efectivoEsperado),
    efectivoContado: hasFinite(row.efectivoContado) || hasFinite(caja.efectivoContado),
    diferenciaCaja: hasFinite(row.diferenciaCaja) || hasFinite(caja.diferenciaCaja),
    inventario: hasObjectData(inventorySource),
    incidencias: Array.isArray(incidentSource),
  };

  return {
    availability,
    totalVendido: firstFinite(
      row.totalVendido,
      row.dineroReal,
      row.totalReal,
      finances.dineroReal,
    ),
    totalEfectivo: firstFinite(
      row.totalEfectivo,
      row.totalCaja,
      finances.efectivoNeto,
    ),
    totalTarjeta: firstFinite(row.totalTarjeta, finances.tarjetaNeta),
    totalPuntosMonto: firstFinite(
      row.totalPuntosMonto,
      finances.valorPuntosCanjeados,
    ),
    totalPuntosCanjeados: firstFinite(
      row.totalPuntosCanjeados,
      finances.cantidadPuntosCanjeados,
    ),
    ventasConPuntos: firstFinite(
      row.ventasConPuntos,
      finances.cantidadVentasConPuntos,
    ),
    cantidadVentas: firstFinite(row.cantidadVentas, finances.cantidadTickets),
    productos: Array.isArray(row.productos)
      ? (row.productos as CorteSummary["productos"])
      : [],
    promociones2x1: {
      ...emptyPromotions,
      ...promotionRow,
    } as CorteSummary["promociones2x1"],
    combos: {
      ...emptyCombos,
      ...comboRow,
      items: Array.isArray(comboRow.items) ? comboRow.items : [],
    } as CorteSummary["combos"],
    efectivoContado: nullableFinite(row.efectivoContado ?? caja.efectivoContado),
    diferenciaCaja: nullableFinite(row.diferenciaCaja ?? caja.diferenciaCaja),
    cajaNombre: optionalText(row.cajaNombre) ?? null,
    cajeroNombre: optionalText(row.cajeroNombre) ?? null,
    corteCerrado: Boolean(row.corteCerrado ?? row.estatus === "CERRADO"),
    corteId: optionalText(row.corteId ?? row.id) ?? null,
    calculationVersion: optionalText(
      row.calculationVersion ?? snapshot.calculationVersion,
    ),
    ventasBrutas: firstFinite(row.ventasBrutas, finances.ventasBrutas),
    descuentos: firstFinite(
      row.descuentos,
      finite(finances.descuentosPromocion) + finite(finances.descuentosAbonado),
    ),
    ventasNetas: firstFinite(row.ventasNetas, finances.ventasNetas),
    dineroReal: firstFinite(row.dineroReal, finances.dineroReal, row.totalReal),
    ticketPromedio: firstFinite(row.ticketPromedio, finances.ticketPromedio),
    unidadesVendidas: firstFinite(
      row.unidadesVendidas,
      finances.cantidadUnidades,
    ),
    comision: commission(commissionSource),
    inventario: inventory(inventorySource),
    incidencias: incidents(incidentSource),
    ventasPorHora: Array.isArray(row.ventasPorHora)
      ? (row.ventasPorHora as NonNullable<CorteSummary["ventasPorHora"]>)
      : [],
    metodosPago: asRecord(paymentSource) as Record<
      string,
      number
    >,
    warnings: Array.isArray(row.warnings ?? snapshot.warnings)
      ? ((row.warnings ?? snapshot.warnings) as unknown[]).map(String)
      : [],
    businessDate: optionalText(row.businessDate ?? snapshot.businessDate ?? row.fecha),
    jornadaId: optionalText(row.jornadaId),
    abonados: subscribers(subscriberSource),
    cortesias: courtesies(courtesySource),
    promociones: promotions(row.promociones ?? snapshot.promociones ?? row.promocionesSnapshot ?? row.promociones2x1),
    merma: waste(wasteSource),
    cancelaciones: firstFinite(row.cancelaciones, finances.cancelaciones),
    reembolsos: firstFinite(row.reembolsos, finances.reembolsos),
    fondoInicial: firstFinite(row.fondoInicial, caja.fondoInicial),
    movimientosCaja: cashMovements(movementsSource),
    efectivoEsperado: firstFinite(row.efectivoEsperado, caja.efectivoEsperado),
  };
}

export function adaptCorteHistoryItem(value: unknown): CorteHistoryItem {
  const row = asRecord(value);
  const summary = adaptCorteSummary(row);
  return {
    ...(row as unknown as CorteHistoryItem),
    id: text(row.id, "sin-folio"),
    ventaId: optionalText(row.ventaId) ?? null,
    idUser: optionalText(row.idUser) ?? null,
    concesionId: text(row.concesionId),
    sucursalId: optionalText(row.sucursalId) ?? null,
    jornadaId: optionalText(row.jornadaId) ?? null,
    inventarioId: optionalText(row.inventarioId) ?? null,
    cajaId: optionalText(row.cajaId) ?? null,
    cajaNombre: optionalText(row.cajaNombre) ?? null,
    fecha: text(row.businessDate ?? row.fecha),
    comentarios: optionalText(row.comentarios) ?? null,
    estatus: text(row.estatus, "SIN_ESTADO"),
    totalReal: summary.totalVendido,
    totalCaja: summary.totalEfectivo,
    totalEfectivo: summary.totalEfectivo,
    totalTarjeta: summary.totalTarjeta,
    totalPuntosMonto: summary.totalPuntosMonto,
    totalPuntosCanjeados: summary.totalPuntosCanjeados,
    cantidadVentas: summary.cantidadVentas,
    efectivoContado: summary.efectivoContado,
    diferenciaCaja: summary.diferenciaCaja,
    calculationVersion: summary.calculationVersion,
    businessDate: optionalText(row.businessDate),
    resumen: asRecord(row.resumen),
    cajeroNombre: optionalText(row.cajeroNombre) ?? null,
    closedBy: optionalText(row.closedBy) ?? null,
    conteoComprobantes: nullableFinite(row.conteoComprobantes),
    comision: summary.comision,
    cancelaciones: summary.cancelaciones,
    reembolsos: summary.reembolsos,
    ajustes: nullableFinite(row.ajustes ?? asRecord(asRecord(row.resumen).caja).ajustes),
    warnings: summary.warnings,
    availability: summary.availability,
    ...(summary.availability?.ventasBrutas ? { ventasBrutas: summary.ventasBrutas } : {}),
    ...(summary.availability?.descuentos ? { descuentos: summary.descuentos } : {}),
    ...(summary.availability?.ventasNetas ? { ventasNetas: summary.ventasNetas } : {}),
    ...(summary.availability?.dineroReal ? { dineroReal: summary.dineroReal } : {}),
    ...(summary.availability?.ticketPromedio ? { ticketPromedio: summary.ticketPromedio } : {}),
    ...(summary.availability?.unidadesVendidas ? { unidadesVendidas: summary.unidadesVendidas } : {}),
    ...(Object.keys(summary.metodosPago ?? {}).length > 0 ? { metodosPago: summary.metodosPago } : {}),
    ...(summary.availability?.abonados ? { abonados: summary.abonados } : {}),
    ...(summary.availability?.cortesias ? { cortesias: summary.cortesias } : {}),
    ...(summary.availability?.promociones ? { promociones: summary.promociones } : {}),
    ...(summary.availability?.combos ? { combos: summary.combos } : {}),
    ...(summary.availability?.merma ? { merma: summary.merma } : {}),
    ...(summary.availability?.inventario ? { inventario: summary.inventario } : {}),
    ...(summary.availability?.incidencias ? { incidencias: summary.incidencias } : {}),
    ...(summary.availability?.fondoInicial ? { fondoInicial: summary.fondoInicial } : {}),
    ...(summary.availability?.movimientosCaja ? { movimientosCaja: summary.movimientosCaja } : {}),
    ...(summary.availability?.efectivoEsperado ? { efectivoEsperado: summary.efectivoEsperado } : {}),
    hasAuthoritativeSnapshot:
      Object.keys(asRecord(row.totalesSnapshot)).length > 0 ||
      (summary.calculationVersion != null && summary.calculationVersion !== "legacy-v1"),
    idempotentReplay:
      typeof row.idempotentReplay === "boolean"
        ? row.idempotentReplay
        : undefined,
  };
}

export function adaptCorteHistory(value: unknown): CorteHistoryItem[] {
  const data = unwrapApiData(value);
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  return data.flatMap((entry) => {
    const adapted = adaptCorteHistoryItem(entry);
    if (adapted.id === "sin-folio") {
      const legacyCloseIdentity = [
        adapted.jornadaId ?? adapted.businessDate ?? adapted.fecha ?? "sin-fecha",
        adapted.concesionId || "sin-concesion",
        adapted.sucursalId ?? "sin-sucursal",
        adapted.cajaId ?? "sin-caja",
        adapted.idUser ?? "sin-vendedor",
      ].map((part) => encodeURIComponent(part));
      adapted.id = `legacy-${legacyCloseIdentity.join("-")}`;
    }
    if (seen.has(adapted.id)) return [];
    seen.add(adapted.id);
    return [adapted];
  });
}

export function adaptCorteHistoryPage(value: unknown): CorteHistoryPage {
  const envelope = asRecord(value);
  const source = Array.isArray(envelope.data)
    ? envelope.data
    : Array.isArray(envelope.items)
      ? envelope.items
      : value;
  const items = adaptCorteHistory(source);
  const meta = asRecord(envelope.meta);
  const requestedLimit = optionalFinite(meta.limit);
  const limit = requestedLimit !== undefined
    ? Math.min(200, Math.max(1, Math.trunc(requestedLimit)))
    : Math.max(1, items.length);
  return {
    data: items,
    items,
    count: optionalFinite(envelope.count) ?? items.length,
    meta: {
      nextCursor: optionalText(meta.nextCursor) ?? null,
      hasMore: meta.hasMore === true,
      limit,
    },
  };
}

const stringMap = (value: unknown): Record<string, string> =>
  Object.fromEntries(
    Object.entries(asRecord(value)).flatMap(([key, entry]) => {
      const parsed = optionalText(entry);
      return parsed ? [[key, parsed]] : [];
    }),
  );

const nullableStringMap = (
  value: unknown,
): Record<string, string | null> =>
  Object.fromEntries(
    Object.entries(asRecord(value)).map(([key, entry]) => [
      key,
      optionalText(entry) ?? null,
    ]),
  );

export function adaptCorteDashboard(value: unknown): CorteDashboard {
  const row = asRecord(unwrapApiData(value));
  const legacy = adaptCorteSummary(row);
  return {
    contexto: stringMap(row.contexto),
    filtrosAplicados: nullableStringMap(row.filtrosAplicados),
    jornadaId: optionalText(row.jornadaId) ?? null,
    businessDate: optionalText(row.businessDate) ?? null,
    ventasNetas: firstFinite(row.ventasNetas, legacy.ventasNetas),
    dineroReal: firstFinite(row.dineroReal, legacy.totalVendido),
    efectivo: firstFinite(row.efectivo, legacy.totalEfectivo),
    tarjeta: firstFinite(row.tarjeta, legacy.totalTarjeta),
    puntos: firstFinite(row.puntos, legacy.totalPuntosMonto),
    puntosCanjeados: firstFinite(
      row.puntosCanjeados,
      legacy.totalPuntosCanjeados,
    ),
    tickets: firstFinite(row.tickets, legacy.cantidadVentas),
    ticketPromedio: firstFinite(row.ticketPromedio, legacy.ticketPromedio),
    unidadesVendidas: firstFinite(
      row.unidadesVendidas,
      legacy.unidadesVendidas,
    ),
    comision: commission(row.comision ?? legacy.comision),
    abonados: subscribers(row.abonados),
    promociones: promotions(row.promociones),
    combos: combos(row.combos),
    cortesias: courtesies(row.cortesias),
    merma: waste(row.merma),
    cancelaciones: finite(row.cancelaciones),
    reembolsos: finite(row.reembolsos),
    inventario: inventory(row.inventario ?? legacy.inventario),
    incidencias: incidents(row.incidencias ?? legacy.incidencias),
    ventasPorHora: Array.isArray(row.ventasPorHora)
      ? (row.ventasPorHora as CorteDashboard["ventasPorHora"])
      : [],
    metodosPago: Array.isArray(row.metodosPago)
      ? row.metodosPago.map((entry) => {
          const method = asRecord(entry);
          return {
            metodo: text(method.metodo, "sin-metodo"),
            monto: finite(method.monto),
          };
        })
      : [],
    productosPrincipales: Array.isArray(row.productosPrincipales)
      ? (row.productosPrincipales as CorteDashboard["productosPrincipales"])
      : [],
    cortesRecientes: Array.isArray(row.cortesRecientes)
      ? adaptCorteHistory(row.cortesRecientes)
      : [],
    warnings: Array.isArray(row.warnings) ? row.warnings.map(String) : [],
  };
}

export function adaptCorteReport(value: unknown): CorteReport | null {
  const data = unwrapApiData(value);
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const row = asRecord(data);
  const jornada = asRecord(row.jornada);
  const ingresos = row.ingresos == null ? null : asRecord(row.ingresos);
  const totals = row.productoTotales == null
    ? null
    : asRecord(row.productoTotales);
  const incomeAvailability: CorteAvailability = ingresos
    ? {
        ventaNeta: hasFinite(ingresos.ventaNeta) || hasFinite(ingresos.ventasNetas),
        totalEfectivo: hasFinite(ingresos.totalEfectivo),
        totalTarjeta: hasFinite(ingresos.totalTarjeta),
        totalPuntosMonto: hasFinite(ingresos.totalPuntosMonto),
        totalPuntosCanjeados: hasFinite(ingresos.totalPuntosCanjeados),
        ventasConPuntos: hasFinite(ingresos.ventasConPuntos),
        cantidadVentas: hasFinite(ingresos.cantidadVentas),
        ventasBrutas: hasFinite(ingresos.ventasBrutas),
        descuentos: hasFinite(ingresos.descuentos),
        ventasNetas: hasFinite(ingresos.ventasNetas) || hasFinite(ingresos.ventaNeta),
        dineroReal:
          hasFinite(ingresos.dineroReal) ||
          (hasFinite(ingresos.totalEfectivo) && hasFinite(ingresos.totalTarjeta)),
        abonados: hasObjectData(ingresos.abonados),
        cortesias: hasObjectData(ingresos.cortesias),
        promociones: hasObjectData(ingresos.promociones),
        combos: hasObjectData(ingresos.combos),
        merma: hasObjectData(ingresos.merma),
        cancelaciones: hasFinite(ingresos.cancelaciones),
        reembolsos: hasFinite(ingresos.reembolsos),
        comision: hasObjectData(ingresos.comision),
        ticketPromedio: hasFinite(ingresos.ticketPromedio),
        unidadesVendidas: hasFinite(ingresos.unidadesVendidas),
        ajustes: hasFinite(ingresos.ajustes),
        fondoInicial: hasFinite(ingresos.fondoInicial),
        movimientosCaja: hasObjectData(ingresos.movimientosCaja),
        efectivoEsperado: hasFinite(ingresos.efectivoEsperado),
      }
    : {};

  return {
    jornada: {
      fecha: text(jornada.fecha),
      numero: finite(jornada.numero),
      jornadaId: text(jornada.jornadaId),
    },
    productos: Array.isArray(row.productos)
      ? row.productos.map((entry) => {
          const product = asRecord(entry);
          return {
            productoId: text(product.productoId, "sin-producto"),
            nombre: text(product.nombre, "Producto"),
            inventarioInicial: finite(product.inventarioInicial),
            inventarioFinal: finite(product.inventarioFinal),
            cantidadRegular: finite(product.cantidadRegular),
            cantidadAbonado: finite(product.cantidadAbonado),
            ventasRegular: finite(product.ventasRegular),
            ventasAbonado: finite(product.ventasAbonado),
            cortesias: finite(product.cortesias),
            puntosCanjeados: finite(product.puntosCanjeados),
            ventasTotales: finite(product.ventasTotales),
            entradas: nullableFinite(product.entradas),
            traspasos: nullableFinite(product.traspasos),
            promociones: nullableFinite(product.promociones),
            merma: nullableFinite(product.merma),
            devoluciones: nullableFinite(product.devoluciones),
            esperado: nullableFinite(product.esperado),
            fisico: nullableFinite(product.fisico),
            diferencia: nullableFinite(product.diferencia),
            estadoConciliacion: optionalText(product.estadoConciliacion) ?? null,
          };
        })
      : null,
    productoTotales: totals as CorteReport["productoTotales"],
    resumen: Array.isArray(row.resumen)
      ? row.resumen.map((entry) => {
          const summary = asRecord(entry);
          return {
            concesionId: text(summary.concesionId),
            nombre: text(summary.nombre, "Concesión"),
            porcentajeComision: finite(summary.porcentajeComision),
            totalVenta: finite(summary.totalVenta),
            comision: finite(summary.comision),
            gananciaConcesion: finite(summary.gananciaConcesion),
            ...(hasFinite(summary.totalPuntosCanjeados)
              ? { totalPuntosCanjeados: finite(summary.totalPuntosCanjeados) }
              : {}),
            ...(hasFinite(summary.valorPuntosCanjeados)
              ? { valorPuntosCanjeados: finite(summary.valorPuntosCanjeados) }
              : {}),
            ...(hasFinite(summary.descuentos)
              ? { descuentos: finite(summary.descuentos) }
              : {}),
          };
        })
      : [],
    ingresos: ingresos
      ? {
          availability: incomeAvailability,
          ...(incomeAvailability.ventaNeta
            ? { ventaNeta: firstFinite(ingresos.ventaNeta, ingresos.ventasNetas) }
            : {}),
          ...(incomeAvailability.totalEfectivo
            ? { totalEfectivo: finite(ingresos.totalEfectivo) }
            : {}),
          ...(incomeAvailability.totalTarjeta
            ? { totalTarjeta: finite(ingresos.totalTarjeta) }
            : {}),
          ...(incomeAvailability.totalPuntosMonto
            ? { totalPuntosMonto: finite(ingresos.totalPuntosMonto) }
            : {}),
          ...(incomeAvailability.totalPuntosCanjeados
            ? { totalPuntosCanjeados: finite(ingresos.totalPuntosCanjeados) }
            : {}),
          ...(incomeAvailability.ventasConPuntos
            ? { ventasConPuntos: finite(ingresos.ventasConPuntos) }
            : {}),
          ...(incomeAvailability.cantidadVentas
            ? { cantidadVentas: finite(ingresos.cantidadVentas) }
            : {}),
          ...(incomeAvailability.ventasBrutas
            ? { ventasBrutas: finite(ingresos.ventasBrutas) }
            : {}),
          ...(incomeAvailability.descuentos
            ? { descuentos: finite(ingresos.descuentos) }
            : {}),
          ...(incomeAvailability.ventasNetas
            ? { ventasNetas: firstFinite(ingresos.ventasNetas, ingresos.ventaNeta) }
            : {}),
          ...(incomeAvailability.dineroReal
            ? {
                dineroReal: hasFinite(ingresos.dineroReal)
                  ? finite(ingresos.dineroReal)
                  : finite(ingresos.totalEfectivo) + finite(ingresos.totalTarjeta),
              }
            : {}),
          ...(incomeAvailability.abonados ? { abonados: subscribers(ingresos.abonados) } : {}),
          ...(incomeAvailability.cortesias ? { cortesias: courtesies(ingresos.cortesias) } : {}),
          ...(incomeAvailability.promociones ? { promociones: promotions(ingresos.promociones) } : {}),
          ...(incomeAvailability.combos ? { combos: combos(ingresos.combos) } : {}),
          ...(incomeAvailability.merma ? { merma: waste(ingresos.merma) } : {}),
          ...(incomeAvailability.cancelaciones ? { cancelaciones: finite(ingresos.cancelaciones) } : {}),
          ...(incomeAvailability.reembolsos ? { reembolsos: finite(ingresos.reembolsos) } : {}),
          ...(incomeAvailability.comision ? { comision: commission(ingresos.comision) } : {}),
          ...(incomeAvailability.ticketPromedio ? { ticketPromedio: finite(ingresos.ticketPromedio) } : {}),
          ...(incomeAvailability.unidadesVendidas ? { unidadesVendidas: finite(ingresos.unidadesVendidas) } : {}),
          ...(incomeAvailability.ajustes ? { ajustes: finite(ingresos.ajustes) } : {}),
          ...(incomeAvailability.fondoInicial ? { fondoInicial: finite(ingresos.fondoInicial) } : {}),
          ...(incomeAvailability.movimientosCaja ? { movimientosCaja: cashMovements(ingresos.movimientosCaja) } : {}),
          ...(incomeAvailability.efectivoEsperado ? { efectivoEsperado: finite(ingresos.efectivoEsperado) } : {}),
        }
      : null,
    calculationVersion: optionalText(row.calculationVersion),
    ...(Array.isArray(row.incidencias) ? { incidencias: incidents(row.incidencias) } : {}),
    warnings: Array.isArray(row.warnings) ? row.warnings.map(String) : [],
    generatedAt: row.generatedAt,
  };
}

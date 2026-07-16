import type {
  CorteHistoryItem,
  CorteIncident,
  CorteReport,
} from "./contracts";

export const CORTE_PDF_SCHEMA_VERSION = "cortes-pdf/v1" as const;
export const CORTE_TIMEZONE = "America/Mexico_City" as const;

export type CortePdfDocumentType =
  | "historical-cut"
  | "close-snapshot"
  | "concession-report"
  | "consolidated-report";

export type CortePdfMetric<T> = {
  available: boolean;
  value: T | null;
};

export type ScopeLabels = {
  concesion?: string;
  sucursal?: string;
  caja?: string;
  vendedor?: string;
};

export type CortePdfGenerationOptions = {
  generatedBy?: string;
  exportedAt?: Date | string | number;
};

export type CortePdfDocumentStatus = "PRELIMINAR" | "INCOMPLETO" | "FINAL" | "AJUSTADO" | "ANULADO";

export type CortePdfMissingData = {
  field: string;
  label: string;
  impact: string;
};

export type CortePdfReconciliationStatus = "correcto" | "revisar" | "incompleto" | "no-aplica";

export type CortePdfPayloadV1 = {
  schemaVersion: typeof CORTE_PDF_SCHEMA_VERSION;
  document: {
    type: CortePdfDocumentType;
    folio: string;
    status: string;
    calculationVersion: string | null;
    visibleType?: "cash-cut" | "concession-day-report";
    visibleTypeLabel?: string;
    readableFolio?: string;
    documentStatus?: CortePdfDocumentStatus;
  };
  timing: {
    jornadaId: CortePdfMetric<string>;
    businessDate: CortePdfMetric<string>;
    businessDateFormatted: string;
    sourceGeneratedAt: CortePdfMetric<string>;
    exportedAt: string;
    exportedAtFormatted?: string;
    sourceGeneratedAtFormatted?: string;
    timezone: typeof CORTE_TIMEZONE;
  };
  scope: {
    concesion: string;
    sucursal: string;
    caja: string;
    vendedor: string;
  };
  financial: {
    ventasBrutas: CortePdfMetric<number>;
    descuentos: CortePdfMetric<number>;
    ventasNetas: CortePdfMetric<number>;
  };
  payments: {
    available: boolean;
    methods: Record<string, CortePdfMetric<number>>;
    dineroReal: CortePdfMetric<number>;
  };
  points: {
    value: CortePdfMetric<number>;
    redeemed: CortePdfMetric<number>;
    sales: CortePdfMetric<number>;
    rule?: CortePdfMetric<string>;
  };
  subscribers: {
    available: boolean;
    operaciones: CortePdfMetric<number>;
    unidades: CortePdfMetric<number>;
    importeCobrado: CortePdfMetric<number>;
    descuentoOtorgado: CortePdfMetric<number>;
  };
  courtesies: {
    available: boolean;
    cantidad: CortePdfMetric<number>;
    valorTeorico: CortePdfMetric<number>;
  };
  promotions: {
    available: boolean;
    montoTotal: CortePdfMetric<number>;
    descuento: CortePdfMetric<number>;
    unidadesGratis: CortePdfMetric<number>;
    transacciones: CortePdfMetric<number>;
  };
  combos: {
    available: boolean;
    montoTotal: CortePdfMetric<number>;
    vendidos: CortePdfMetric<number>;
  };
  waste: {
    available: boolean;
    cantidad: CortePdfMetric<number>;
    valorTeorico: CortePdfMetric<number>;
  };
  cash: {
    fondoInicial: CortePdfMetric<number>;
    movimientosEntradas: CortePdfMetric<number>;
    movimientosSalidas: CortePdfMetric<number>;
    movimientosNeto: CortePdfMetric<number>;
    efectivoEsperado: CortePdfMetric<number>;
    efectivoContado: CortePdfMetric<number>;
    diferencia: CortePdfMetric<number>;
  };
  commission: {
    available: boolean;
    percentage: CortePdfMetric<number>;
    base: CortePdfMetric<number>;
    amount: CortePdfMetric<number>;
    roundingRule: CortePdfMetric<string>;
  };
  performance: {
    tickets: CortePdfMetric<number>;
    ticketPromedio: CortePdfMetric<number>;
    unidades: CortePdfMetric<number>;
  };
  inventory: {
    available: boolean;
    rows: Array<{
      productoId: string;
      nombre: string;
      vendidas: CortePdfMetric<number>;
      inicial?: CortePdfMetric<number>;
      entradas?: CortePdfMetric<number>;
      abonado?: CortePdfMetric<number>;
      cortesias: CortePdfMetric<number>;
      merma: CortePdfMetric<number>;
      esperado: CortePdfMetric<number>;
      fisico: CortePdfMetric<number>;
      diferencia: CortePdfMetric<number>;
      status: CortePdfMetric<string>;
    }>;
  };
  incidents: {
    available: boolean;
    rows: Array<{ code: string; detail: string; blocking?: boolean }>;
  };
  adjustments: CortePdfMetric<number>;
  reversals: {
    cancelaciones: CortePdfMetric<number>;
    reembolsos: CortePdfMetric<number>;
  };
  audit?: {
    generatedBy: CortePdfMetric<string>;
    snapshotId: CortePdfMetric<string>;
    receiptCount: CortePdfMetric<number>;
    includedCutIds: CortePdfMetric<string[]>;
    closedBy: CortePdfMetric<string>;
  };
  missingData?: CortePdfMissingData[];
  reconciliation?: {
    applicable: boolean;
    reason?: string;
    status: CortePdfReconciliationStatus;
    grossMinusDiscounts: CortePdfMetric<number>;
    salesDelta: CortePdfMetric<number>;
    cashPlusCard: CortePdfMetric<number>;
    realMoneyDelta: CortePdfMetric<number>;
    reconciledTotal: CortePdfMetric<number>;
    finalDifference: CortePdfMetric<number>;
  };
  rollup?: {
    available: boolean;
    baseComisionable: CortePdfMetric<number>;
    commission: CortePdfMetric<number>;
    netAfterCommission: CortePdfMetric<number>;
    concessions: CortePdfMetric<number>;
    /** Point metrics are informational and intentionally excluded from dinero real. */
    redeemedPoints: CortePdfMetric<number>;
    coveredPointValue: CortePdfMetric<number>;
    /** Promotion + subscriber discounts only. */
    discounts: CortePdfMetric<number>;
  };
};

export type CortePdfPrintModel = {
  title: string;
  subtitle: string;
  sections: Array<{
    title: string;
    rows: Array<{ label: string; value: string }>;
  }>;
  inventoryRows: Array<string[]>;
  incidentRows: Array<string[]>;
  reconciliationRows?: Array<{ label: string; value: string; status?: string }>;
  missingRows?: Array<{ label: string; impact: string }>;
  pagination: "Página {page} de {total}";
};

export type CortePdfSummaryStatus = "correcto" | "revisar" | "critico" | "incompleto";
export const CORTE_PDF_MONEY_TOLERANCE = 0.01;

export type CortePdfSmartFinding = {
  id: string;
  category:
    | "caja"
    | "incidencias"
    | "inventario"
    | "cobertura"
    | "cobros"
    | "beneficios"
    | "rendimiento"
    | "comision";
  status: CortePdfSummaryStatus;
  title: string;
  detail: string;
  priority: number;
};

export type CortePdfSmartSummary = {
  status: CortePdfSummaryStatus;
  headline: string;
  explanation: string;
  findings: CortePdfSmartFinding[];
  coverage: {
    available: number;
    total: number;
    percentage: number;
    label: string;
  };
};

export function buildCortePdfPageLabels(totalPages: number): string[] {
  const total = Math.max(1, Math.trunc(totalPages));
  return Array.from({ length: total }, (_, index) => `Página ${index + 1} de ${total}`);
}

const metric = <T>(value: T | null | undefined, available = value !== null && value !== undefined): CortePdfMetric<T> => ({
  available,
  value: available && value !== undefined ? value : null,
});

const hasMetricValue = (entry: CortePdfMetric<unknown>): boolean => entry.available && entry.value !== null;

const normalizedPaymentName = (name: string): string =>
  name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const paymentSemanticKey = (name: string): "efectivo" | "tarjeta" | "puntos" | null => {
  const normalized = normalizedPaymentName(name);
  if (normalized.includes("punto")) return "puntos";
  if (normalized.includes("efectivo") || normalized === "cash") return "efectivo";
  if (
    normalized.includes("tarjeta") || normalized.includes("credito") ||
    normalized.includes("debito") || normalized === "card"
  ) return "tarjeta";
  return null;
};

export function normalizeCortePdfPaymentMethods(
  methods: Record<string, CortePdfMetric<number>>,
): Record<string, CortePdfMetric<number>> {
  const result: Record<string, CortePdfMetric<number>> = {};
  for (const semantic of ["efectivo", "tarjeta", "puntos"] as const) {
    const matches = Object.entries(methods).filter(([name]) => paymentSemanticKey(name) === semantic);
    const exact = matches.find(([name, entry]) => name.trim() === semantic && entry.available && entry.value !== null);
    const available = exact ?? matches.find(([, entry]) => entry.available && entry.value !== null);
    const fallback = matches.find(([name]) => name.trim() === semantic) ?? matches[0];
    const selected = available ?? fallback;
    if (selected) result[semantic] = selected[1];
  }

  const extras = new Set<string>();
  for (const [rawName, entry] of Object.entries(methods)) {
    if (paymentSemanticKey(rawName)) continue;
    const name = rawName.trim();
    const normalized = normalizedPaymentName(name);
    if (!name || extras.has(normalized)) continue;
    extras.add(normalized);
    result[name] = entry;
  }
  return result;
}

export function normalizeCortePdfScopeLabels(labels: ScopeLabels | string): ScopeLabels {
  return typeof labels === "string" ? { concesion: labels } : labels;
}

export function getCortePdfContinuationHeader(
  payload: Pick<CortePdfPayloadV1, "document">,
): string {
  return payload.document.visibleTypeLabel ?? "Reporte de jornada por concesión";
}

export function getCortePdfProductPointPresentation(
  coveredValue: number | null | undefined,
): {
  redeemedPoints: CortePdfMetric<number>;
  coveredValue: CortePdfMetric<number>;
} {
  return {
    // The product report currently exposes only the MXN value, not point units.
    redeemedPoints: metric<number>(null, false),
    coveredValue: metric(coveredValue, coveredValue !== null && coveredValue !== undefined),
  };
}

const dateOnly = (value?: string | null): string => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value?.trim() || "N/D";
};

const timestamp = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (value && typeof value === "object") {
    const row = value as { _seconds?: number; seconds?: number };
    const seconds = Number(row._seconds ?? row.seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000).toISOString();
  }
  return null;
};

const mexicoTimestamp = (value: string | null): string => {
  if (!value) return "N/D";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: CORTE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
};

const readableFolio = (prefix: string, businessDate?: string | null, suffix?: string | number | null): string => {
  const date = businessDate?.replaceAll("-", "") || "SIN-FECHA";
  const normalizedSuffix = String(suffix ?? "").replace(/[^a-zA-Z0-9]+/g, "").toUpperCase();
  return [prefix, date, normalizedSuffix || "GENERAL"].join("-");
};

const incidentRows = (rows?: CorteIncident[]): Array<{ code: string; detail: string; blocking: boolean }> =>
  (rows ?? []).map((row) => ({
    code: row.codigo,
    detail: [
      row.ventaId ? `Venta ${row.ventaId}` : null,
      row.linea !== undefined ? `Línea ${row.linea}` : null,
      row.bloqueante ? "Bloqueante" : null,
    ].filter(Boolean).join(" · ") || "Sin detalle adicional",
    blocking: Boolean(row.bloqueante),
  }));

const basePayload = (params: {
  type: CortePdfDocumentType;
  folio: string;
  status?: string;
  calculationVersion?: string | null;
  jornadaId?: string | null;
  businessDate?: string | null;
  generatedAt?: unknown;
  labels?: ScopeLabels;
  readableFolio?: string;
  options?: CortePdfGenerationOptions;
}): Pick<CortePdfPayloadV1, "schemaVersion" | "document" | "timing" | "scope"> => {
  const generatedAt = timestamp(params.generatedAt);
  const exportedAt = timestamp(params.options?.exportedAt) ?? new Date().toISOString();
  return {
    schemaVersion: CORTE_PDF_SCHEMA_VERSION,
    document: {
      type: params.type,
      folio: params.folio,
      status: params.status ?? "SIN_ESTADO",
      calculationVersion: params.calculationVersion ?? null,
      readableFolio: params.readableFolio ?? params.folio,
    },
    timing: {
      jornadaId: metric(params.jornadaId ?? null),
      businessDate: metric(params.businessDate ?? null),
      businessDateFormatted: dateOnly(params.businessDate),
      sourceGeneratedAt: metric(generatedAt),
      exportedAt,
      exportedAtFormatted: mexicoTimestamp(exportedAt),
      sourceGeneratedAtFormatted: mexicoTimestamp(generatedAt),
      timezone: CORTE_TIMEZONE,
    },
    scope: {
      concesion: params.labels?.concesion ?? "N/D",
      sucursal: params.labels?.sucursal ?? "N/D",
      caja: params.labels?.caja ?? "N/D",
      vendedor: params.labels?.vendedor ?? "N/D",
    },
  };
};

const cents = (value: number): number => Math.round(value * 100) / 100;

const buildReconciliation = (
  payload: CortePdfPayloadV1,
  applicable: boolean,
): { reconciliation: NonNullable<CortePdfPayloadV1["reconciliation"]>; missingData: CortePdfMissingData[] } => {
  if (!applicable) {
    return {
      reconciliation: {
        applicable: false,
        reason: "El reporte no contiene desglose fuente de ventas y cobros para aplicar estas ecuaciones.",
        status: "no-aplica",
        grossMinusDiscounts: metric<number>(null, false),
        salesDelta: metric<number>(null, false),
        cashPlusCard: metric<number>(null, false),
        realMoneyDelta: metric<number>(null, false),
        reconciledTotal: metric<number>(null, false),
        finalDifference: metric<number>(null, false),
      },
      missingData: [],
    };
  }

  const cash = paymentTotal(payload, "cash");
  const card = paymentTotal(payload, "card");
  const required = [
    { field: "ventasBrutas", label: "Ventas brutas", entry: payload.financial.ventasBrutas, impact: "Impide validar ventas brutas - descuentos = ventas netas." },
    { field: "descuentos", label: "Descuentos", entry: payload.financial.descuentos, impact: "Impide validar ventas brutas - descuentos = ventas netas." },
    { field: "ventasNetas", label: "Ventas netas", entry: payload.financial.ventasNetas, impact: "Impide comparar el total conciliado contra la venta neta fuente." },
    { field: "efectivo", label: "Efectivo", entry: cash, impact: "Impide validar efectivo + tarjeta = dinero real." },
    { field: "tarjeta", label: "Tarjeta", entry: card, impact: "Impide validar efectivo + tarjeta = dinero real." },
    { field: "dineroReal", label: "Dinero real", entry: payload.payments.dineroReal, impact: "Impide validar cobros monetarios y calcular el total conciliado." },
    { field: "valorPuntos", label: "Valor cubierto con puntos", entry: payload.points.value, impact: "Impide calcular dinero real + valor con puntos." },
  ];
  const missingData = required
    .filter((item) => !hasMetricValue(item.entry))
    .map(({ field, label, impact }) => ({ field, label, impact }));
  const grossMinusDiscounts = hasMetricValue(payload.financial.ventasBrutas) && hasMetricValue(payload.financial.descuentos)
    ? metric(cents((payload.financial.ventasBrutas.value ?? 0) - (payload.financial.descuentos.value ?? 0)), true)
    : metric<number>(null, false);
  const salesDelta = hasMetricValue(grossMinusDiscounts) && hasMetricValue(payload.financial.ventasNetas)
    ? metric(cents((payload.financial.ventasNetas.value ?? 0) - (grossMinusDiscounts.value ?? 0)), true)
    : metric<number>(null, false);
  const cashPlusCard = hasMetricValue(cash) && hasMetricValue(card)
    ? metric(cents((cash.value ?? 0) + (card.value ?? 0)), true)
    : metric<number>(null, false);
  const realMoneyDelta = hasMetricValue(cashPlusCard) && hasMetricValue(payload.payments.dineroReal)
    ? metric(cents((payload.payments.dineroReal.value ?? 0) - (cashPlusCard.value ?? 0)), true)
    : metric<number>(null, false);
  const reconciledTotal = hasMetricValue(payload.payments.dineroReal) && hasMetricValue(payload.points.value)
    ? metric(cents((payload.payments.dineroReal.value ?? 0) + (payload.points.value.value ?? 0)), true)
    : metric<number>(null, false);
  const finalDifference = hasMetricValue(reconciledTotal) && hasMetricValue(payload.financial.ventasNetas)
    ? metric(cents((reconciledTotal.value ?? 0) - (payload.financial.ventasNetas.value ?? 0)), true)
    : metric<number>(null, false);
  const deltas = [salesDelta, realMoneyDelta, finalDifference].filter(hasMetricValue);
  const status: CortePdfReconciliationStatus = missingData.length
    ? "incompleto"
    : deltas.some((entry) => Math.abs(Number(entry.value)) > CORTE_PDF_MONEY_TOLERANCE)
      ? "revisar"
      : "correcto";
  return {
    reconciliation: {
      applicable: true,
      status,
      grossMinusDiscounts,
      salesDelta,
      cashPlusCard,
      realMoneyDelta,
      reconciledTotal,
      finalDifference,
    },
    missingData,
  };
};

const finalizePresentation = (
  payload: CortePdfPayloadV1,
  params: { reconciliationApplicable: boolean },
): CortePdfPayloadV1 => {
  const hasCashbox = payload.scope.caja !== "N/D";
  const hasSeller = payload.scope.vendedor !== "N/D";
  const hasCashCount = hasMetricValue(payload.cash.efectivoEsperado) &&
    hasMetricValue(payload.cash.efectivoContado) && hasMetricValue(payload.cash.diferencia);
  const isCashCut = hasCashbox && hasSeller && hasCashCount;
  const { reconciliation, missingData } = buildReconciliation(payload, params.reconciliationApplicable);
  const sourceStatus = payload.document.status.trim().toUpperCase();
  const documentStatus: CortePdfDocumentStatus = sourceStatus.includes("ANUL")
    ? "ANULADO"
    : sourceStatus.includes("AJUST")
      ? "AJUSTADO"
      : missingData.length
        ? "INCOMPLETO"
        : sourceStatus === "CERRADO" && isCashCut
          ? "FINAL"
          : "PRELIMINAR";
  return {
    ...payload,
    document: {
      ...payload.document,
      visibleType: isCashCut ? "cash-cut" : "concession-day-report",
      visibleTypeLabel: isCashCut ? "Corte de caja" : "Reporte de jornada por concesión",
      documentStatus,
    },
    reconciliation,
    missingData,
  };
};

export function buildHistoricalCortePdfPayload(
  corte: CorteHistoryItem,
  labels: ScopeLabels = {},
  type: "historical-cut" | "close-snapshot" = "historical-cut",
  options: CortePdfGenerationOptions = {},
): CortePdfPayloadV1 {
  const availability = corte.availability ?? {};
  const commissionAvailable = availability.comision ?? Boolean(corte.hasAuthoritativeSnapshot && corte.comision);
  const subscribersAvailable = availability.abonados ?? corte.abonados !== undefined;
  const courtesiesAvailable = availability.cortesias ?? corte.cortesias !== undefined;
  const promotionsAvailable = availability.promociones ?? corte.promociones !== undefined;
  const combosAvailable = availability.combos ?? corte.combos !== undefined;
  const wasteAvailable = availability.merma ?? corte.merma !== undefined;
  const movementsAvailable = availability.movimientosCaja ?? corte.movimientosCaja !== undefined;
  const incidentsAvailable = availability.incidencias ?? corte.incidencias !== undefined;
  const cashAvailable = availability.totalEfectivo ?? (
    corte.totalEfectivo !== null && corte.totalEfectivo !== undefined ||
    corte.totalCaja !== null && corte.totalCaja !== undefined
  );
  const cardAvailable = availability.totalTarjeta ?? (
    corte.totalTarjeta !== null && corte.totalTarjeta !== undefined
  );
  const base = basePayload({
    type,
    folio: corte.id,
    status: corte.estatus,
    calculationVersion: corte.calculationVersion,
    jornadaId: corte.jornadaId,
    businessDate: corte.businessDate ?? corte.fecha,
    generatedAt: corte.generatedAt ?? corte.createdAt,
    readableFolio: readableFolio(
      "C",
      corte.businessDate ?? corte.fecha,
      corte.secuencia ?? corte.id.slice(-6),
    ),
    options,
    labels: {
      concesion: (labels.concesion ?? corte.concesionId) || "N/D",
      sucursal: labels.sucursal ?? corte.sucursalId ?? "N/D",
      caja: labels.caja ?? corte.cajaNombre ?? corte.cajaId ?? "N/D",
      vendedor: labels.vendedor ?? corte.cajeroNombre ?? corte.idUser ?? "N/D",
    },
  });
  const methodCandidates = Object.fromEntries(
    Object.entries(corte.metodosPago ?? {}).map(([key, paymentValue]) => [key, metric(paymentValue, true)]),
  );
  if (cashAvailable) methodCandidates.efectivo = metric(corte.totalEfectivo ?? corte.totalCaja, true);
  if (cardAvailable) methodCandidates.tarjeta = metric(corte.totalTarjeta, true);
  const methods = normalizeCortePdfPaymentMethods(methodCandidates);
  const payload: CortePdfPayloadV1 = {
    ...base,
    financial: {
      ventasBrutas: metric(corte.ventasBrutas, availability.ventasBrutas ?? corte.ventasBrutas !== undefined),
      descuentos: metric(corte.descuentos, availability.descuentos ?? corte.descuentos !== undefined),
      ventasNetas: metric(corte.ventasNetas, availability.ventasNetas ?? corte.ventasNetas !== undefined),
    },
    payments: {
      available: Object.values(methods).some((entry) => entry.available && entry.value !== null),
      methods,
      dineroReal: metric(corte.dineroReal ?? corte.totalReal, availability.dineroReal ?? (corte.dineroReal !== undefined || corte.totalReal !== undefined)),
    },
    points: {
      value: metric(corte.totalPuntosMonto, availability.totalPuntosMonto ?? corte.totalPuntosMonto !== undefined),
      redeemed: metric(corte.totalPuntosCanjeados, availability.totalPuntosCanjeados ?? corte.totalPuntosCanjeados !== undefined),
      sales: metric(corte.ventasConPuntos, availability.ventasConPuntos ?? corte.ventasConPuntos !== undefined),
      rule: metric("10 puntos = $1 MXN", Boolean(
        (availability.totalPuntosMonto ?? corte.totalPuntosMonto !== undefined) ||
        (availability.totalPuntosCanjeados ?? corte.totalPuntosCanjeados !== undefined)
      )),
    },
    subscribers: {
      available: subscribersAvailable,
      operaciones: metric(corte.abonados?.operaciones, subscribersAvailable),
      unidades: metric(corte.abonados?.unidades, subscribersAvailable),
      importeCobrado: metric(corte.abonados?.importeCobrado, subscribersAvailable),
      descuentoOtorgado: metric(corte.abonados?.descuentoOtorgado, subscribersAvailable),
    },
    courtesies: {
      available: courtesiesAvailable,
      cantidad: metric(corte.cortesias?.cantidad, courtesiesAvailable),
      valorTeorico: metric(corte.cortesias?.valorTeorico, courtesiesAvailable),
    },
    promotions: {
      available: promotionsAvailable,
      montoTotal: metric(corte.promociones?.montoTotal, promotionsAvailable),
      descuento: metric(corte.promociones?.montoDescuento, promotionsAvailable),
      unidadesGratis: metric(corte.promociones?.unidadesGratis, promotionsAvailable),
      transacciones: metric(corte.promociones?.cantidadTransacciones, promotionsAvailable),
    },
    combos: {
      available: combosAvailable,
      montoTotal: metric(corte.combos?.montoTotal, combosAvailable),
      vendidos: metric(corte.combos?.cantidadVendidos, combosAvailable),
    },
    waste: {
      available: wasteAvailable,
      cantidad: metric(corte.merma?.cantidad, wasteAvailable),
      valorTeorico: metric(corte.merma?.valorTeorico, wasteAvailable),
    },
    cash: {
      fondoInicial: metric(corte.fondoInicial, availability.fondoInicial ?? corte.fondoInicial !== undefined),
      movimientosEntradas: metric(corte.movimientosCaja?.entradas, movementsAvailable && corte.movimientosCaja?.entradas !== undefined),
      movimientosSalidas: metric(corte.movimientosCaja?.salidas, movementsAvailable && corte.movimientosCaja?.salidas !== undefined),
      movimientosNeto: metric(corte.movimientosCaja?.neto, movementsAvailable && corte.movimientosCaja?.neto !== undefined),
      efectivoEsperado: metric(corte.efectivoEsperado, availability.efectivoEsperado ?? corte.efectivoEsperado !== undefined),
      efectivoContado: metric(corte.efectivoContado, availability.efectivoContado ?? (corte.efectivoContado !== null && corte.efectivoContado !== undefined)),
      diferencia: metric(corte.diferenciaCaja, availability.diferenciaCaja ?? (corte.diferenciaCaja !== null && corte.diferenciaCaja !== undefined)),
    },
    commission: {
      available: commissionAvailable,
      percentage: metric(corte.comision?.porcentajeAplicado, commissionAvailable),
      base: metric(corte.comision?.baseComision, commissionAvailable),
      amount: metric(corte.comision?.importeComision, commissionAvailable),
      roundingRule: metric(corte.comision?.reglaRedondeo, commissionAvailable && corte.comision?.reglaRedondeo !== undefined),
    },
    performance: {
      tickets: metric(corte.cantidadVentas, availability.cantidadVentas ?? corte.cantidadVentas !== undefined),
      ticketPromedio: metric(corte.ticketPromedio, availability.ticketPromedio ?? corte.ticketPromedio !== undefined),
      unidades: metric(corte.unidadesVendidas, availability.unidadesVendidas ?? corte.unidadesVendidas !== undefined),
    },
    inventory: {
      available: availability.inventario ?? corte.inventario !== undefined,
      rows: (corte.inventario?.items ?? []).map((row) => ({
        productoId: row.productoId,
        nombre: row.nombre,
        vendidas: metric(row.vendidas, true),
        inicial: metric<number>(null, false),
        entradas: metric<number>(null, false),
        abonado: metric<number>(null, false),
        cortesias: metric(row.cortesias, true),
        merma: metric(row.merma, true),
        esperado: metric(row.esperado, row.esperado !== null && row.esperado !== undefined),
        fisico: metric(row.fisico, row.fisico !== null && row.fisico !== undefined),
        diferencia: metric(row.diferencia, row.diferencia !== null && row.diferencia !== undefined),
        status: metric(
          row.estadoConciliacion ?? (row.fisico != null ? "Conciliado" : "Snapshot operativo"),
          true,
        ),
      })),
    },
    incidents: { available: incidentsAvailable, rows: incidentRows(corte.incidencias) },
    adjustments: metric(corte.ajustes, availability.ajustes ?? (corte.ajustes !== null && corte.ajustes !== undefined)),
    reversals: {
      cancelaciones: metric(corte.cancelaciones, availability.cancelaciones ?? corte.cancelaciones !== undefined),
      reembolsos: metric(corte.reembolsos, availability.reembolsos ?? corte.reembolsos !== undefined),
    },
    audit: {
      generatedBy: metric(options.generatedBy?.trim() || null),
      snapshotId: metric(corte.hasAuthoritativeSnapshot ? corte.id : null),
      receiptCount: metric(corte.conteoComprobantes, corte.conteoComprobantes !== null && corte.conteoComprobantes !== undefined),
      includedCutIds: metric<string[]>(null, false),
      closedBy: metric(corte.closedBy?.trim() || null),
    },
  };
  return finalizePresentation(payload, { reconciliationApplicable: true });
}

export function buildReportCortePdfPayload(
  report: CorteReport,
  labels: ScopeLabels = {},
  options: CortePdfGenerationOptions = {},
): CortePdfPayloadV1 {
  const rollupMetric = (
    field: "totalPuntosCanjeados" | "valorPuntosCanjeados" | "descuentos",
  ) => {
    const available = report.resumen.every((row) => row[field] !== undefined);
    return metric(
      available ? report.resumen.reduce((total, row) => total + (row[field] ?? 0), 0) : null,
      available,
    );
  };
  const income = report.ingresos;
  const availability = income?.availability ?? {};
  const methodCandidates: Record<string, CortePdfMetric<number>> = {};
  if (availability.totalEfectivo) methodCandidates.efectivo = metric(income?.totalEfectivo, true);
  if (availability.totalTarjeta) methodCandidates.tarjeta = metric(income?.totalTarjeta, true);
  if (availability.totalPuntosMonto) methodCandidates.puntos = metric(income?.totalPuntosMonto, true);
  const methods = normalizeCortePdfPaymentMethods(methodCandidates);
  const subscribersAvailable = Boolean(availability.abonados && income?.abonados);
  const courtesiesAvailable = Boolean(availability.cortesias && income?.cortesias);
  const promotionsAvailable = Boolean(availability.promociones && income?.promociones);
  const combosAvailable = Boolean(availability.combos && income?.combos);
  const wasteAvailable = Boolean(availability.merma && income?.merma);
  const commissionAvailable = Boolean(availability.comision && income?.comision);
  const movementsAvailable = Boolean(availability.movimientosCaja && income?.movimientosCaja);
  const base = basePayload({
    type: labels.concesion ? "concession-report" : "consolidated-report",
    folio: report.jornada.jornadaId || `J${report.jornada.numero}`,
    status: "REPORTE",
    calculationVersion: report.calculationVersion,
    jornadaId: report.jornada.jornadaId,
    businessDate: report.jornada.fecha,
    generatedAt: report.generatedAt,
    readableFolio: readableFolio(
      labels.concesion ? "R" : "RG",
      report.jornada.fecha,
      `J${report.jornada.numero}`,
    ),
    labels,
    options,
  });
  const payload: CortePdfPayloadV1 = {
    ...base,
    financial: {
      ventasBrutas: metric(income?.ventasBrutas, Boolean(availability.ventasBrutas)),
      descuentos: metric(income?.descuentos, Boolean(availability.descuentos)),
      ventasNetas: metric(income?.ventasNetas ?? income?.ventaNeta, Boolean(availability.ventasNetas ?? availability.ventaNeta)),
    },
    payments: {
      available: Object.keys(methods).length > 0,
      methods,
      dineroReal: metric(income?.dineroReal, Boolean(availability.dineroReal)),
    },
    points: {
      value: metric(income?.totalPuntosMonto, Boolean(availability.totalPuntosMonto)),
      redeemed: metric(income?.totalPuntosCanjeados, Boolean(availability.totalPuntosCanjeados)),
      sales: metric(income?.ventasConPuntos, Boolean(availability.ventasConPuntos)),
      rule: metric("10 puntos = $1 MXN", Boolean(availability.totalPuntosMonto || availability.totalPuntosCanjeados)),
    },
    subscribers: {
      available: subscribersAvailable,
      operaciones: metric(income?.abonados?.operaciones, subscribersAvailable),
      unidades: metric(income?.abonados?.unidades, subscribersAvailable),
      importeCobrado: metric(income?.abonados?.importeCobrado, subscribersAvailable),
      descuentoOtorgado: metric(income?.abonados?.descuentoOtorgado, subscribersAvailable),
    },
    courtesies: {
      available: courtesiesAvailable,
      cantidad: metric(income?.cortesias?.cantidad, courtesiesAvailable),
      valorTeorico: metric(income?.cortesias?.valorTeorico, courtesiesAvailable),
    },
    promotions: {
      available: promotionsAvailable,
      montoTotal: metric(income?.promociones?.montoTotal, promotionsAvailable),
      descuento: metric(income?.promociones?.montoDescuento, promotionsAvailable),
      unidadesGratis: metric(income?.promociones?.unidadesGratis, promotionsAvailable),
      transacciones: metric(income?.promociones?.cantidadTransacciones, promotionsAvailable),
    },
    combos: {
      available: combosAvailable,
      montoTotal: metric(income?.combos?.montoTotal, combosAvailable),
      vendidos: metric(income?.combos?.cantidadVendidos, combosAvailable),
    },
    waste: {
      available: wasteAvailable,
      cantidad: metric(income?.merma?.cantidad, wasteAvailable),
      valorTeorico: metric(income?.merma?.valorTeorico, wasteAvailable),
    },
    cash: {
      fondoInicial: metric(income?.fondoInicial, Boolean(availability.fondoInicial)),
      movimientosEntradas: metric(income?.movimientosCaja?.entradas, movementsAvailable && income?.movimientosCaja?.entradas !== undefined),
      movimientosSalidas: metric(income?.movimientosCaja?.salidas, movementsAvailable && income?.movimientosCaja?.salidas !== undefined),
      movimientosNeto: metric(income?.movimientosCaja?.neto, movementsAvailable && income?.movimientosCaja?.neto !== undefined),
      efectivoEsperado: metric(income?.efectivoEsperado, Boolean(availability.efectivoEsperado)),
      efectivoContado: metric<number>(null, false),
      diferencia: metric<number>(null, false),
    },
    commission: {
      available: commissionAvailable,
      percentage: metric(income?.comision?.porcentajeAplicado, commissionAvailable),
      base: metric(income?.comision?.baseComision, commissionAvailable),
      amount: metric(income?.comision?.importeComision, commissionAvailable),
      roundingRule: metric(income?.comision?.reglaRedondeo, commissionAvailable && income?.comision?.reglaRedondeo !== undefined),
    },
    performance: {
      tickets: metric(income?.cantidadVentas, Boolean(availability.cantidadVentas)),
      ticketPromedio: metric(income?.ticketPromedio, Boolean(availability.ticketPromedio)),
      unidades: metric(income?.unidadesVendidas, Boolean(availability.unidadesVendidas)),
    },
    inventory: {
      available: report.productos !== null,
      rows: (report.productos ?? []).map((row) => ({
        productoId: row.productoId,
        nombre: row.nombre,
        inicial: metric(row.inventarioInicial, true),
        entradas: metric(row.entradas, row.entradas !== null && row.entradas !== undefined),
        vendidas: metric(row.cantidadRegular, true),
        abonado: metric(row.cantidadAbonado, true),
        cortesias: metric(row.cortesias, true),
        merma: metric(row.merma, row.merma !== null && row.merma !== undefined),
        esperado: metric(row.esperado, row.esperado !== null && row.esperado !== undefined),
        fisico: metric(row.fisico, row.fisico !== null && row.fisico !== undefined),
        diferencia: metric(row.diferencia, row.diferencia !== null && row.diferencia !== undefined),
        status: metric(row.estadoConciliacion, row.estadoConciliacion !== null && row.estadoConciliacion !== undefined),
      })),
    },
    incidents: {
      available: report.incidencias !== undefined,
      rows: incidentRows(report.incidencias),
    },
    adjustments: metric(income?.ajustes, Boolean(availability.ajustes)),
    reversals: {
      cancelaciones: metric(income?.cancelaciones, Boolean(availability.cancelaciones)),
      reembolsos: metric(income?.reembolsos, Boolean(availability.reembolsos)),
    },
    audit: {
      generatedBy: metric(options.generatedBy?.trim() || null),
      snapshotId: metric<string>(null, false),
      receiptCount: metric<number>(null, false),
      includedCutIds: metric<string[]>(null, false),
      closedBy: metric<string>(null, false),
    },
    rollup: {
      available: true,
      baseComisionable: metric(report.resumen.reduce((total, row) => total + row.totalVenta, 0), true),
      commission: metric(report.resumen.reduce((total, row) => total + row.comision, 0), true),
      netAfterCommission: metric(report.resumen.reduce((total, row) => total + row.gananciaConcesion, 0), true),
      concessions: metric(report.resumen.length, true),
      redeemedPoints: rollupMetric("totalPuntosCanjeados"),
      coveredPointValue: rollupMetric("valorPuntosCanjeados"),
      discounts: rollupMetric("descuentos"),
    },
  };
  return finalizePresentation(payload, { reconciliationApplicable: income !== null });
}

const summaryMoney = (value: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const paymentTotal = (
  payload: CortePdfPayloadV1,
  category: "cash" | "card" | "points",
): CortePdfMetric<number> => {
  const methods = normalizeCortePdfPaymentMethods(payload.payments.methods);
  const key = category === "cash" ? "efectivo" : category === "card" ? "tarjeta" : "puntos";
  const entry = methods[key];
  return entry?.available && entry.value !== null ? entry : metric<number>(null, false);
};

const metricAvailable = (entry: CortePdfMetric<unknown>): boolean =>
  entry.available && entry.value !== null;

const finding = (
  id: string,
  category: CortePdfSmartFinding["category"],
  status: CortePdfSummaryStatus,
  title: string,
  detail: string,
  priority: number,
): CortePdfSmartFinding => ({ id, category, status, title, detail, priority });

/**
 * Builds an explainable operational reading from the snapshot only. It never
 * imputes unavailable values and never treats loyalty points as real money.
 */
export function buildCortePdfSmartSummary(
  payload: CortePdfPayloadV1,
  options: { maxFindings?: number } = {},
): CortePdfSmartSummary {
  const findings: CortePdfSmartFinding[] = [];
  const cash = paymentTotal(payload, "cash");
  const card = paymentTotal(payload, "card");
  const pointMethod = paymentTotal(payload, "points");

  if (metricAvailable(payload.cash.diferencia)) {
    const difference = payload.cash.diferencia.value ?? 0;
    const absoluteDifference = Math.abs(difference);
    if (difference === 0) {
      findings.push(finding(
        "cash-difference",
        "caja",
        "correcto",
        "Caja conciliada",
        "El efectivo contado coincide con el efectivo esperado: diferencia de $0.00.",
        10,
      ));
    } else {
      findings.push(finding(
        "cash-difference",
        "caja",
        absoluteDifference >= 100 ? "critico" : "revisar",
        difference < 0 ? "Faltante de caja" : "Sobrante de caja",
        `La diferencia autoritativa es ${summaryMoney(difference)}. Revisa el conteo y su evidencia.`,
        10,
      ));
    }
  }

  if (payload.incidents.available) {
    const blocking = payload.incidents.rows.filter((row) => row.blocking || /bloqueante/i.test(row.detail));
    const nonBlocking = payload.incidents.rows.length - blocking.length;
    if (blocking.length) {
      findings.push(finding(
        "incidents-blocking",
        "incidencias",
        "critico",
        `${blocking.length} incidencia${blocking.length === 1 ? " severa" : "s severas"}`,
        `Códigos: ${blocking.slice(0, 3).map((row) => row.code).join(", ")}${blocking.length > 3 ? " y más" : ""}.`,
        20,
      ));
    } else if (nonBlocking > 0) {
      findings.push(finding(
        "incidents-review",
        "incidencias",
        "revisar",
        `${nonBlocking} incidencia${nonBlocking === 1 ? " por revisar" : "s por revisar"}`,
        "No son bloqueantes, pero forman parte de la evidencia operativa del corte.",
        21,
      ));
    } else {
      findings.push(finding(
        "incidents-clear",
        "incidencias",
        "correcto",
        "Sin incidencias registradas",
        "La fuente autoritativa no reportó incidencias para este alcance.",
        22,
      ));
    }
  }

  if (payload.inventory.available) {
    const reconciled = payload.inventory.rows.filter((row) => metricAvailable(row.diferencia));
    const critical = reconciled.filter((row) => {
      const status = String(row.status.value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return status.includes("critic") || Math.abs(row.diferencia.value ?? 0) > 2;
    });
    const mismatches = reconciled.filter((row) => (row.diferencia.value ?? 0) !== 0);
    const incomplete = Math.max(0, payload.inventory.rows.length - reconciled.length);
    if (critical.length) {
      findings.push(finding(
        "inventory-critical",
        "inventario",
        "critico",
        "Diferencias críticas de inventario",
        `${critical.length} producto(s) superan el umbral operativo o están marcados como críticos.`,
        30,
      ));
    } else if (mismatches.length) {
      findings.push(finding(
        "inventory-review",
        "inventario",
        "revisar",
        "Inventario con diferencias",
        `${mismatches.length} de ${reconciled.length} producto(s) conciliados tienen diferencia física.`,
        31,
      ));
    } else if (incomplete || payload.inventory.rows.length === 0) {
      findings.push(finding(
        "inventory-incomplete",
        "inventario",
        "incompleto",
        "Conciliación de inventario incompleta",
        payload.inventory.rows.length
          ? `${incomplete} producto(s) no tienen conteo físico o diferencia autoritativa.`
          : "La fuente marca inventario disponible, pero no entregó filas conciliables.",
        32,
      ));
    } else {
      findings.push(finding(
        "inventory-clear",
        "inventario",
        "correcto",
        "Inventario conciliado",
        `${reconciled.length} producto(s) sin diferencias físicas.`,
        33,
      ));
    }
  }

  const coverageSignals = [
    payload.financial.ventasBrutas,
    payload.financial.descuentos,
    payload.financial.ventasNetas,
    cash,
    card,
    payload.payments.dineroReal,
    payload.points.value,
    payload.cash.fondoInicial,
    payload.cash.efectivoEsperado,
    payload.cash.efectivoContado,
    payload.cash.diferencia,
    payload.performance.tickets,
    payload.performance.ticketPromedio,
    payload.performance.unidades,
    payload.commission.base,
    payload.commission.amount,
  ];
  const coverageTotal = coverageSignals.length + 2;
  const coverageAvailable = coverageSignals.filter(metricAvailable).length +
    Number(payload.inventory.available) + Number(payload.incidents.available);
  const coveragePercentage = Math.round((coverageAvailable / coverageTotal) * 100);
  const coverageLabel = `${coverageAvailable} de ${coverageTotal} indicadores disponibles (${coveragePercentage}%).`;
  findings.push(finding(
    "coverage",
    "cobertura",
    coverageAvailable === coverageTotal ? "correcto" : "incompleto",
    coverageAvailable === coverageTotal ? "Cobertura completa" : "Cobertura parcial",
    coverageAvailable === coverageTotal
      ? `${coverageLabel} El resumen no requirió completar datos.`
      : `${coverageLabel} Los valores N/D no se interpretan ni se sustituyen.`,
    40,
  ));

  if (
    metricAvailable(cash) || metricAvailable(card) || metricAvailable(payload.payments.dineroReal) ||
    metricAvailable(payload.points.value) || metricAvailable(pointMethod)
  ) {
    const hasCash = metricAvailable(cash);
    const hasCard = metricAvailable(card);
    const cashValue = cash.value ?? 0;
    const cardValue = card.value ?? 0;
    const monetaryTotal = cashValue + cardValue;
    const cashPercentage = monetaryTotal === 0 ? 0 : Math.round((cashValue / monetaryTotal) * 100);
    const mix = hasCash && hasCard
      ? monetaryTotal === 0
        ? "Efectivo y tarjeta registran $0.00."
        : `Mix monetario: ${cashPercentage}% efectivo y ${100 - cashPercentage}% tarjeta.`
      : hasCash
        ? `Efectivo disponible: ${summaryMoney(cashValue)}; tarjeta N/D.`
        : hasCard
          ? `Tarjeta disponible: ${summaryMoney(cardValue)}; efectivo N/D.`
          : "Efectivo N/D y tarjeta N/D.";
    const points = metricAvailable(payload.points.value) ? payload.points.value : pointMethod;
    const hasPoints = metricAvailable(points);
    const pointsText = hasPoints
      ? `Valor con puntos: ${summaryMoney(points.value ?? 0)}.`
      : "Valor con puntos N/D.";
    const hasRealMoney = metricAvailable(payload.payments.dineroReal);
    const realMoney = payload.payments.dineroReal.value ?? 0;
    const canValidate = hasCash && hasCard && hasRealMoney;
    const moneyDifference = canValidate ? realMoney - monetaryTotal : null;
    const incompatible = moneyDifference !== null && Math.abs(moneyDifference) > CORTE_PDF_MONEY_TOLERANCE;
    const validation = incompatible
      ? `Dinero real ${summaryMoney(realMoney)} no coincide con efectivo + tarjeta ${summaryMoney(monetaryTotal)}; diferencia ${summaryMoney(moneyDifference ?? 0)}. No es posible confirmar la exclusión del valor con puntos.`
      : canValidate
        ? `Dinero real coincide con efectivo + tarjeta dentro de una tolerancia de ±${summaryMoney(CORTE_PDF_MONEY_TOLERANCE)}.${hasPoints ? " El valor con puntos se muestra aparte y su exclusión queda validada." : ""}`
        : `No es posible validar la exclusión del valor con puntos porque falta ${[
          !hasCash ? "efectivo" : null,
          !hasCard ? "tarjeta" : null,
          !hasRealMoney ? "dinero real" : null,
        ].filter(Boolean).join(", ")}.`;
    findings.push(finding(
      "payment-mix",
      "cobros",
      incompatible ? "revisar" : canValidate ? "correcto" : "incompleto",
      incompatible ? "Cobros monetarios incompatibles" : canValidate ? "Distribución de cobro" : "Distribución de cobro parcial",
      `${mix} ${pointsText} ${validation}`,
      50,
    ));
  }

  if (metricAvailable(payload.financial.descuentos) || metricAvailable(payload.points.redeemed) || metricAvailable(payload.points.sales)) {
    const parts: string[] = [];
    if (metricAvailable(payload.financial.descuentos)) {
      parts.push(`descuentos ${summaryMoney(payload.financial.descuentos.value ?? 0)}`);
    }
    if (metricAvailable(payload.points.redeemed)) {
      parts.push(`${(payload.points.redeemed.value ?? 0).toLocaleString("es-MX")} puntos canjeados`);
    }
    if (metricAvailable(payload.points.sales)) {
      parts.push(`${(payload.points.sales.value ?? 0).toLocaleString("es-MX")} venta(s) con puntos`);
    }
    findings.push(finding(
      "discounts-points",
      "beneficios",
      "correcto",
      "Descuentos y puntos",
      `${parts.join("; ")}. Se reportan separados para conservar la trazabilidad del corte.`,
      60,
    ));
  }

  if (metricAvailable(payload.performance.tickets) || metricAvailable(payload.performance.ticketPromedio) || metricAvailable(payload.performance.unidades)) {
    const tickets = payload.performance.tickets.value ?? 0;
    const inconsistent = metricAvailable(payload.performance.tickets) && tickets === 0 &&
      metricAvailable(payload.financial.ventasNetas) && (payload.financial.ventasNetas.value ?? 0) !== 0;
    const parts: string[] = [];
    if (metricAvailable(payload.performance.tickets)) parts.push(`${tickets.toLocaleString("es-MX")} ticket(s)`);
    if (metricAvailable(payload.performance.ticketPromedio)) parts.push(`ticket promedio ${summaryMoney(payload.performance.ticketPromedio.value ?? 0)}`);
    if (metricAvailable(payload.performance.unidades)) parts.push(`${(payload.performance.unidades.value ?? 0).toLocaleString("es-MX")} unidad(es)`);
    findings.push(finding(
      "performance",
      "rendimiento",
      inconsistent ? "revisar" : "correcto",
      inconsistent ? "Rendimiento inconsistente" : "Rendimiento de la jornada",
      inconsistent
        ? "Hay venta neta distinta de cero, pero el conteo de tickets es cero. Revisa la fuente."
        : `${parts.join("; ")}.`,
      70,
    ));
  }

  if (payload.commission.available && (metricAvailable(payload.commission.amount) || metricAvailable(payload.commission.base))) {
    const parts: string[] = [];
    if (metricAvailable(payload.commission.amount)) parts.push(`importe ${summaryMoney(payload.commission.amount.value ?? 0)}`);
    if (metricAvailable(payload.commission.base)) parts.push(`base ${summaryMoney(payload.commission.base.value ?? 0)}`);
    if (metricAvailable(payload.commission.percentage)) parts.push(`${payload.commission.percentage.value ?? 0}% aplicado`);
    findings.push(finding(
      "commission",
      "comision",
      "correcto",
      "Comisión calculada",
      `${parts.join("; ")}.`,
      80,
    ));
  }

  const orderedFindings = [...findings].sort((left, right) =>
    left.priority - right.priority || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
  );
  const status: CortePdfSummaryStatus = orderedFindings.some((item) => item.status === "critico")
    ? "critico"
    : orderedFindings.some((item) => item.status === "revisar")
      ? "revisar"
      : coverageAvailable < coverageTotal || orderedFindings.some((item) => item.status === "incompleto")
        ? "incompleto"
        : "correcto";
  const copy: Record<CortePdfSummaryStatus, { headline: string; explanation: string }> = {
    critico: {
      headline: "Requiere atención inmediata",
      explanation: "Hay desviaciones autoritativas que deben revisarse antes de considerar conciliado el corte.",
    },
    revisar: {
      headline: "Revisión operativa recomendada",
      explanation: "El corte contiene diferencias o inconsistencias no críticas que requieren validación.",
    },
    incompleto: {
      headline: "Lectura parcial del corte",
      explanation: "La fuente no expone todos los datos; el resumen evita inferencias sobre valores N/D.",
    },
    correcto: {
      headline: "Sin desviaciones detectadas",
      explanation: "Los indicadores disponibles son consistentes y no presentan diferencias autoritativas.",
    },
  };
  const maxFindings = Math.min(12, Math.max(1, Math.trunc(options.maxFindings ?? 8)));
  return {
    status,
    ...copy[status],
    findings: orderedFindings.slice(0, maxFindings),
    coverage: {
      available: coverageAvailable,
      total: coverageTotal,
      percentage: coveragePercentage,
      label: coverageLabel,
    },
  };
}

const money = (entry: CortePdfMetric<number>): string =>
  entry.available && entry.value !== null
    ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(entry.value)
    : "N/D";

const quantity = (entry: CortePdfMetric<number>): string =>
  entry.available && entry.value !== null ? entry.value.toLocaleString("es-MX") : "N/D";

const value = (entry: CortePdfMetric<string>): string =>
  entry.available && entry.value !== null ? entry.value : "N/D";

export function buildCortePdfPrintModel(payload: CortePdfPayloadV1): CortePdfPrintModel {
  const paymentRows = Object.entries(normalizeCortePdfPaymentMethods(payload.payments.methods))
    .filter(([method]) => !normalizedPaymentName(method).includes("punto"))
    .map(([method, entry]) => ({
      label: `Método: ${method}`,
      value: money(entry),
    }));
  const documentTypeLabel: Record<CortePdfDocumentType, string> = {
    "historical-cut": "Corte histórico",
    "close-snapshot": "Snapshot de cierre",
    "concession-report": "Reporte de concesión",
    "consolidated-report": "Reporte consolidado",
  };
  const visibleDocumentTypeLabel = payload.document.visibleTypeLabel ?? documentTypeLabel[payload.document.type];
  const audit = payload.audit;
  const sections: CortePdfPrintModel["sections"] = [
    { title: "Identidad y alcance", rows: [
      { label: "Folio legible", value: payload.document.readableFolio ?? payload.document.folio },
      { label: "ID interno", value: payload.document.folio },
      { label: "Tipo de documento", value: visibleDocumentTypeLabel },
      { label: "Estado del documento", value: payload.document.documentStatus ?? "PRELIMINAR" },
      { label: "Versión del payload", value: payload.schemaVersion },
      { label: "Versión del cálculo", value: payload.document.calculationVersion ?? "N/D" },
      { label: "Jornada", value: value(payload.timing.jornadaId) },
      { label: "Fecha operativa", value: payload.timing.businessDateFormatted },
      { label: "Fecha de generación fuente", value: payload.timing.sourceGeneratedAtFormatted ?? value(payload.timing.sourceGeneratedAt) },
      { label: "Fecha real de exportación", value: payload.timing.exportedAtFormatted ?? payload.timing.exportedAt },
      { label: "Usuario generador", value: audit ? value(audit.generatedBy) : "N/D" },
      { label: "Snapshot ID", value: audit ? value(audit.snapshotId) : "N/D" },
      { label: "Cantidad de comprobantes", value: audit ? quantity(audit.receiptCount) : "N/D" },
      { label: "Cerrado por", value: audit ? value(audit.closedBy) : "N/D" },
      { label: "Zona horaria", value: payload.timing.timezone },
      { label: "Concesión", value: payload.scope.concesion },
      { label: "Sucursal", value: payload.scope.sucursal },
      { label: "Caja", value: payload.scope.caja },
      { label: "Vendedor", value: payload.scope.vendedor },
    ] },
    { title: "Ventas y pagos", rows: [
      { label: "Ventas brutas", value: money(payload.financial.ventasBrutas) },
      { label: "Descuentos", value: money(payload.financial.descuentos) },
      { label: "Ventas netas", value: money(payload.financial.ventasNetas) },
      ...paymentRows,
      { label: "Dinero real", value: money(payload.payments.dineroReal) },
    ] },
    { title: "Beneficios (no aditivos)", rows: [
      { label: "Puntos canjeados", value: quantity(payload.points.redeemed) },
      { label: "Valor cubierto con puntos", value: money(payload.points.value) },
      { label: "Regla aplicada", value: payload.points.rule ? value(payload.points.rule) : "N/D" },
      { label: "Ventas con puntos", value: quantity(payload.points.sales) },
      { label: "Criterio", value: "Abonado puede incluir promoción; no sumar los bloques entre sí." },
      { label: "Operaciones abonado", value: quantity(payload.subscribers.operaciones) },
      { label: "Unidades abonado", value: quantity(payload.subscribers.unidades) },
      { label: "Importe abonado", value: money(payload.subscribers.importeCobrado) },
      { label: "Descuento abonado", value: money(payload.subscribers.descuentoOtorgado) },
      { label: "Cortesías", value: quantity(payload.courtesies.cantidad) },
      { label: "Valor cortesías", value: money(payload.courtesies.valorTeorico) },
      { label: "Importe promociones", value: money(payload.promotions.montoTotal) },
      { label: "Descuento promociones", value: money(payload.promotions.descuento) },
      { label: "Unidades gratis", value: quantity(payload.promotions.unidadesGratis) },
      { label: "Transacciones promoción", value: quantity(payload.promotions.transacciones) },
      { label: "Importe combos", value: money(payload.combos.montoTotal) },
      { label: "Combos vendidos", value: quantity(payload.combos.vendidos) },
      { label: "Merma", value: quantity(payload.waste.cantidad) },
      { label: "Valor merma", value: money(payload.waste.valorTeorico) },
    ] },
    { title: "Caja", rows: [
      { label: "Fondo inicial", value: money(payload.cash.fondoInicial) },
      { label: "Movimientos de entrada", value: money(payload.cash.movimientosEntradas) },
      { label: "Movimientos de salida", value: money(payload.cash.movimientosSalidas) },
      { label: "Movimientos netos", value: money(payload.cash.movimientosNeto) },
      { label: "Efectivo esperado", value: money(payload.cash.efectivoEsperado) },
      { label: "Efectivo contado", value: money(payload.cash.efectivoContado) },
      { label: "Diferencia", value: money(payload.cash.diferencia) },
    ] },
    { title: "Comisión y rendimiento", rows: [
      { label: "Porcentaje comisión", value: quantity(payload.commission.percentage) },
      { label: "Base comisionable", value: money(payload.commission.base) },
      { label: "Comisión calculada", value: money(payload.commission.amount) },
      { label: "Regla de redondeo", value: value(payload.commission.roundingRule) },
      { label: "Tickets", value: quantity(payload.performance.tickets) },
      { label: "Ticket promedio", value: money(payload.performance.ticketPromedio) },
      { label: "Unidades", value: quantity(payload.performance.unidades) },
      { label: "Cancelaciones", value: money(payload.reversals.cancelaciones) },
      { label: "Reembolsos", value: money(payload.reversals.reembolsos) },
      { label: "Ajustes", value: money(payload.adjustments) },
    ] },
    ...(payload.rollup?.available ? [{ title: "Resumen por concesión", rows: [
      { label: "Base comisionable", value: money(payload.rollup.baseComisionable) },
      { label: "Comisión", value: money(payload.rollup.commission) },
      { label: "Neto posterior a comisión", value: money(payload.rollup.netAfterCommission) },
      { label: "Concesiones", value: quantity(payload.rollup.concessions) },
      { label: "Puntos canjeados (no son dinero real)", value: quantity(payload.rollup.redeemedPoints) },
      { label: "Valor cubierto con puntos", value: money(payload.rollup.coveredPointValue) },
      { label: "Descuentos aplicados", value: money(payload.rollup.discounts) },
    ] }] : []),
  ];
  return {
    title: `${visibleDocumentTypeLabel} ${payload.document.readableFolio ?? payload.document.folio}`,
    subtitle: `${payload.timing.businessDateFormatted} · ${payload.document.documentStatus ?? "PRELIMINAR"} · ${payload.timing.timezone}`,
    sections: sections.filter((section, index) =>
      index === 0 || section.rows.some((row) => row.value !== "N/D"),
    ),
    inventoryRows: payload.inventory.rows.map((row) => [
      row.productoId,
      row.nombre,
      quantity(row.inicial ?? metric<number>(null, false)),
      quantity(row.entradas ?? metric<number>(null, false)),
      quantity(row.vendidas),
      quantity(row.abonado ?? metric<number>(null, false)),
      quantity(row.cortesias),
      quantity(row.merma),
      quantity(row.esperado),
      quantity(row.fisico),
      quantity(row.diferencia),
      value(row.status),
    ]),
    incidentRows: payload.incidents.rows.map((row) => [row.code, row.detail]),
    reconciliationRows: !payload.reconciliation?.applicable
      ? [{ label: "Conciliación monetaria", value: "N/A", status: "no-aplica" }]
      : [
          { label: "Ventas brutas - descuentos", value: money(payload.reconciliation.grossMinusDiscounts), status: payload.reconciliation.status },
          { label: "Delta contra ventas netas", value: money(payload.reconciliation.salesDelta), status: payload.reconciliation.status },
          { label: "Efectivo + tarjeta", value: money(payload.reconciliation.cashPlusCard), status: payload.reconciliation.status },
          { label: "Delta contra dinero real", value: money(payload.reconciliation.realMoneyDelta), status: payload.reconciliation.status },
          { label: "Dinero real + valor con puntos", value: money(payload.reconciliation.reconciledTotal), status: payload.reconciliation.status },
          { label: "Diferencia final contra ventas netas", value: money(payload.reconciliation.finalDifference), status: payload.reconciliation.status },
        ],
    missingRows: (payload.missingData ?? []).map((item) => ({ label: item.label, impact: item.impact })),
    pagination: "Página {page} de {total}",
  };
}

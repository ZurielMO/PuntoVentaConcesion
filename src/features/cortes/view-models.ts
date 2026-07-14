import type {
  CorteDashboard,
  CorteFilters,
  CorteHistoryItem,
  CorteIncident,
  CorteInventoryRow,
  CorteReport,
  CorteRole,
  CorteSummary,
  CorteUiIncident,
  CorteUrlState,
  CloseCortePayload,
} from "./contracts";

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const optionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function splitCorteFilterScopes(filters: CorteFilters): {
  operational: CorteFilters;
  historical: CorteFilters;
} {
  const operational: CorteFilters = {
    ...(filters.concesionId ? { concesionId: filters.concesionId } : {}),
    ...(filters.sucursalId ? { sucursalId: filters.sucursalId } : {}),
    ...(filters.cajaId ? { cajaId: filters.cajaId } : {}),
    ...(filters.idUser ? { idUser: filters.idUser } : {}),
    ...(filters.sesionCajaId ? { sesionCajaId: filters.sesionCajaId } : {}),
  };
  return {
    operational,
    historical: {
      ...operational,
      ...(filters.inventarioId ? { inventarioId: filters.inventarioId } : {}),
      ...(filters.jornadaId ? { jornadaId: filters.jornadaId } : {}),
      ...(filters.fecha ? { fecha: filters.fecha } : {}),
      ...(filters.limit ? { limit: filters.limit } : {}),
    },
  };
}

const dashboardSummary = (dashboard: CorteDashboard): CorteSummary => ({
  availability: {
    ventasNetas: true,
    dineroReal: true,
    totalEfectivo: true,
    totalTarjeta: true,
    totalPuntosMonto: true,
    cantidadVentas: true,
    abonados: true,
    cortesias: true,
    promociones: true,
    combos: true,
    merma: true,
    cancelaciones: true,
    reembolsos: true,
    comision: true,
    ticketPromedio: true,
    unidadesVendidas: true,
    inventario: true,
    incidencias: true,
  },
  totalVendido: dashboard.dineroReal,
  totalEfectivo: dashboard.efectivo,
  totalTarjeta: dashboard.tarjeta,
  totalPuntosMonto: dashboard.puntos,
  totalPuntosCanjeados: dashboard.puntosCanjeados,
  ventasConPuntos: 0,
  cantidadVentas: dashboard.tickets,
  productos: [],
  promociones2x1: dashboard.promociones,
  combos: dashboard.combos,
  efectivoContado: null,
  diferenciaCaja: null,
  cajaNombre: null,
  cajeroNombre: null,
  corteCerrado: false,
  corteId: null,
  ventasNetas: dashboard.ventasNetas,
  dineroReal: dashboard.dineroReal,
  ticketPromedio: dashboard.ticketPromedio,
  unidadesVendidas: dashboard.unidadesVendidas,
  comision: dashboard.comision,
  inventario: dashboard.inventario,
  incidencias: dashboard.incidencias,
  ventasPorHora: dashboard.ventasPorHora,
  metodosPago: Object.fromEntries(
    dashboard.metodosPago.map((method) => [method.metodo, method.monto]),
  ),
  warnings: dashboard.warnings,
  abonados: dashboard.abonados,
  promociones: dashboard.promociones,
  cortesias: dashboard.cortesias,
  merma: dashboard.merma,
  cancelaciones: dashboard.cancelaciones,
  reembolsos: dashboard.reembolsos,
  jornadaId: dashboard.jornadaId ?? undefined,
  businessDate: dashboard.businessDate ?? undefined,
});

export function selectOperationalSummarySource(params: {
  role: CorteRole;
  filters: CorteFilters;
  dashboard: CorteDashboard | null;
  summary: CorteSummary | null;
}): { data: CorteSummary | null; source: "exact-unit" | "aggregate-dashboard" | "none" } {
  const exactUnit = params.role === "VENDEDOR" || (
    params.role === "ADMIN" &&
    Boolean(params.filters.sucursalId && params.filters.cajaId && params.filters.idUser)
  );
  if (exactUnit && params.summary) {
    return { data: params.summary, source: "exact-unit" };
  }
  if (params.dashboard) {
    return { data: dashboardSummary(params.dashboard), source: "aggregate-dashboard" };
  }
  return { data: null, source: "none" };
}

export function buildInventoryRows(report: CorteReport | null): CorteInventoryRow[] {
  return (report?.productos ?? []).map((product) => {
    const difference = optionalNumber(product.diferencia);
    const explicitStatus = product.estadoConciliacion?.trim().toLowerCase();
    const status: CorteInventoryRow["status"] = difference == null
      ? "sin-conciliacion"
      : explicitStatus === "critico" || explicitStatus === "crítico"
        ? "critico"
        : explicitStatus === "revision" || explicitStatus === "revisión"
          ? "revision"
          : explicitStatus === "correcto"
            ? "correcto"
            : difference === 0
              ? "correcto"
              : Math.abs(difference) <= 2
                ? "revision"
                : "critico";
    return {
      productoId: product.productoId,
      nombre: product.nombre,
      inicial: product.inventarioInicial,
      entradas: optionalNumber(product.entradas),
      traspasos: optionalNumber(product.traspasos),
      vendidoRegular: product.cantidadRegular,
      abonado: product.cantidadAbonado,
      promociones: optionalNumber(product.promociones),
      cortesias: product.cortesias,
      merma: optionalNumber(product.merma),
      devoluciones: optionalNumber(product.devoluciones),
      finalRegistrado: product.inventarioFinal,
      esperado: optionalNumber(product.esperado),
      fisico: optionalNumber(product.fisico),
      diferencia: difference,
      status,
    };
  });
}

const INCIDENT_COPY: Record<string, { title: string; section: CorteUiIncident["section"] }> = {
  PARTIAL_REFUND_SPLIT_REQUIRED: {
    title: "Reembolso parcial incompleto",
    section: "reporte",
  },
  UNCLASSIFIED_ZERO_PRICE: {
    title: "Venta con precio cero sin clasificación",
    section: "reporte",
  },
  CORTE_PENDING: { title: "Corte pendiente", section: "caja-actual" },
};

export function buildUiIncidents(params: {
  incidents?: CorteIncident[];
  warnings?: string[];
  summaryDifference?: number | null;
  inventoryRows?: CorteInventoryRow[];
}): CorteUiIncident[] {
  const result: CorteUiIncident[] = [];
  for (const [index, incident] of (params.incidents ?? []).entries()) {
    const copy = INCIDENT_COPY[incident.codigo];
    result.push({
      id: `${incident.codigo}-${incident.ventaId ?? index}`,
      code: incident.codigo,
      severity: incident.bloqueante ? "critical" : "warning",
      title: copy?.title ?? incident.codigo.replaceAll("_", " ").toLocaleLowerCase("es-MX"),
      description: incident.ventaId
        ? `Comprobante relacionado: ${incident.ventaId}`
        : "Revisa el detalle operativo antes de continuar.",
      source: incident.ventaId ? "Comprobante de venta" : "Cálculo de corte",
      section: copy?.section ?? "reporte",
    });
  }

  for (const [index, warning] of (params.warnings ?? []).entries()) {
    result.push({
      id: `warning-${warning}-${index}`,
      code: warning,
      severity: "warning",
      title: warning.replaceAll("_", " ").toLocaleLowerCase("es-MX"),
      description: "El servidor reportó datos parciales o una compatibilidad que conviene revisar.",
      source: "Advertencia del servidor",
      section: "reporte",
    });
  }

  if (params.summaryDifference != null && params.summaryDifference !== 0) {
    result.push({
      id: "cash-difference",
      code: "CASH_DIFFERENCE",
      severity: Math.abs(params.summaryDifference) >= 100 ? "critical" : "warning",
      title: params.summaryDifference < 0 ? "Faltante de caja" : "Sobrante de caja",
      description: "El efectivo contado no coincide con el valor calculado por el servidor.",
      source: "Conciliación de caja autoritativa",
      amount: params.summaryDifference,
      section: "caja-actual",
    });
  }

  for (const row of (params.inventoryRows ?? []).filter((item) => item.diferencia != null && item.diferencia !== 0)) {
    result.push({
      id: `inventory-${row.productoId}`,
      code: "INVENTORY_DIFFERENCE",
      severity: row.status === "critico" ? "critical" : "warning",
      title: `Diferencia de inventario: ${row.nombre}`,
      description: `El servidor reportó una diferencia física de ${row.diferencia}.`,
      source: "Conciliación física autoritativa",
      amount: row.diferencia ?? undefined,
      section: "inventario",
    });
  }

  return Array.from(new Map(result.map((incident) => [incident.id, incident])).values());
}

export function filterCorteHistory(
  rows: CorteHistoryItem[],
  filters: { status?: string; businessDate?: string },
): CorteHistoryItem[] {
  const status = filters.status?.trim().toUpperCase() ?? "";
  const businessDate = filters.businessDate?.trim() ?? "";
  return rows.filter((row) => {
    const rowStatus = row.estatus.trim().toUpperCase();
    const statusMatches = !status || (
      status === "OTRO"
        ? !["CERRADO", "AJUSTADO", "ANULADO", "REABIERTO"].includes(rowStatus)
        : rowStatus === status
    );
    const dateMatches = !businessDate || (row.businessDate ?? row.fecha) === businessDate;
    return statusMatches && dateMatches;
  });
}

export function resolveHistoricalMoneyValue(
  availability: boolean | undefined,
  value: number | null | undefined,
): number | null {
  return availability === true && typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

export function isCloseSummaryFresh(state: {
  hasSummary: boolean;
  loading: boolean;
  error: string | null;
  stale: boolean;
  partial: boolean;
  lastUpdatedAt: Date | null;
}): boolean {
  return state.hasSummary && !state.loading && !state.error && !state.stale &&
    !state.partial && state.lastUpdatedAt instanceof Date &&
    !Number.isNaN(state.lastUpdatedAt.getTime());
}

export function pushCorteHistoryCursor(
  stack: readonly string[],
  cursor?: string | null,
): string[] {
  const next = cursor?.trim();
  if (!next || stack.at(-1) === next) return [...stack];
  return [...stack, next];
}

export function popCorteHistoryCursor(stack: readonly string[]): string[] {
  return stack.slice(0, -1);
}

export type InventorySort = "nombre" | "inicial" | "vendido" | "final" | "diferencia";
export type InventoryFilter = "todos" | "con-diferencia" | "sin-conciliacion" | "conciliados";

export function queryInventoryRows(params: {
  rows: CorteInventoryRow[];
  search?: string;
  sort?: InventorySort;
  filter?: InventoryFilter;
  page?: number;
  pageSize?: number;
}) {
  const search = params.search?.trim().toLocaleLowerCase("es-MX") ?? "";
  const filter = params.filter ?? "todos";
  const sort = params.sort ?? "nombre";
  const filtered = params.rows.filter((row) => {
    if (search && !`${row.nombre} ${row.productoId}`.toLocaleLowerCase("es-MX").includes(search)) return false;
    if (filter === "con-diferencia") return row.diferencia != null && row.diferencia !== 0;
    if (filter === "sin-conciliacion") return row.diferencia == null;
    if (filter === "conciliados") return row.diferencia === 0;
    return true;
  });
  const sorted = [...filtered].sort((left, right) => {
    if (sort === "nombre") return left.nombre.localeCompare(right.nombre, "es");
    if (sort === "inicial") return right.inicial - left.inicial;
    if (sort === "vendido") return (right.vendidoRegular + right.abonado) - (left.vendidoRegular + left.abonado);
    if (sort === "final") return right.finalRegistrado - left.finalRegistrado;
    return (right.diferencia ?? Number.NEGATIVE_INFINITY) - (left.diferencia ?? Number.NEGATIVE_INFINITY);
  });
  const pageSize = Math.max(1, Math.trunc(params.pageSize ?? 10));
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(totalPages, Math.max(1, Math.trunc(params.page ?? 1)));
  return {
    rows: sorted.slice((page - 1) * pageSize, page * pageSize),
    allRows: sorted,
    page,
    pageSize,
    totalRows: sorted.length,
    totalPages,
  };
}

const csvCell = (value: string | number | null): string => {
  if (value == null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function buildInventoryCsv(rows: CorteInventoryRow[]): string {
  const header = [
    "Producto", "Inicial", "Entradas", "Traspasos", "Vendido regular",
    "Abonado", "Promociones", "Cortesías", "Merma", "Devoluciones",
    "Final registrado", "Esperado", "Físico", "Diferencia", "Estado",
  ];
  const body = rows.map((row) => [
    row.nombre, row.inicial, row.entradas, row.traspasos, row.vendidoRegular,
    row.abonado, row.promociones, row.cortesias, row.merma, row.devoluciones,
    row.finalRegistrado, row.esperado, row.fisico, row.diferencia, row.status,
  ]);
  return [header, ...body].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export type CorteDeepLinkAvailability = {
  concessionIds?: readonly string[];
  branchIds?: readonly string[];
  cashboxIds?: readonly string[];
  userIds?: readonly string[];
  inventoryIds?: readonly string[];
  jornadas?: ReadonlyArray<{ jornadaId: string; fecha: string }>;
};

export function sanitizeCorteDeepLink(
  state: CorteUrlState,
  available: CorteDeepLinkAvailability,
): CorteUrlState {
  const filters = { ...state.filters };
  const contains = (values: readonly string[] | undefined, value?: string) =>
    values === undefined || !value || values.includes(value);

  if (!contains(available.concessionIds, filters.concesionId)) {
    delete filters.concesionId;
    delete filters.sucursalId;
    delete filters.cajaId;
    delete filters.idUser;
    delete filters.inventarioId;
  }
  if (!contains(available.branchIds, filters.sucursalId)) {
    delete filters.sucursalId;
    delete filters.cajaId;
    delete filters.idUser;
    delete filters.inventarioId;
  }
  if (!contains(available.cashboxIds, filters.cajaId)) delete filters.cajaId;
  if (!contains(available.userIds, filters.idUser)) delete filters.idUser;
  if (!contains(available.inventoryIds, filters.inventarioId)) delete filters.inventarioId;

  let businessDate = state.businessDate;
  if (available.jornadas !== undefined) {
    if (filters.jornadaId) {
      const jornada = available.jornadas.find((item) => item.jornadaId === filters.jornadaId);
      if (!jornada) {
        delete filters.jornadaId;
        businessDate = "";
      } else {
        businessDate = jornada.fecha;
      }
    } else if (
      businessDate &&
      !available.jornadas.some((item) => item.fecha === businessDate)
    ) {
      businessDate = "";
    }
  }
  return { ...state, filters, businessDate };
}

export type CloseContextValidation = {
  valid: boolean;
  reason?: string;
};

const closeScopePart = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized || null;
};

export function buildCloseScopeIdentity(params: {
  concessionId?: string | null;
  branchId?: string | null;
  filters: CorteFilters;
  operationalContext?: {
    jornadaId?: string | null;
    businessDate?: string | null;
  } | null;
}): string {
  return JSON.stringify({
    version: "corte-close-scope/v2",
    concesionId: closeScopePart(params.concessionId ?? params.filters.concesionId),
    sucursalId: closeScopePart(params.branchId ?? params.filters.sucursalId),
    cajaId: closeScopePart(params.filters.cajaId),
    idUser: closeScopePart(params.filters.idUser),
    inventarioId: closeScopePart(params.filters.inventarioId),
    sesionCajaId: closeScopePart(params.filters.sesionCajaId),
    expectedJornadaId: closeScopePart(params.operationalContext?.jornadaId),
    expectedBusinessDate: closeScopePart(params.operationalContext?.businessDate),
  });
}

export function canSubmitReviewedClose(params: {
  validationValid: boolean;
  confirmationValid: boolean;
  reviewedScopeIdentity: string | null;
  currentScopeIdentity: string;
}): boolean {
  return params.validationValid &&
    params.confirmationValid &&
    params.reviewedScopeIdentity === params.currentScopeIdentity;
}

export function resetCloseReviewState(currentScopeIdentity: string) {
  return {
    currentScopeIdentity,
    reviewedScopeIdentity: null,
    step: "review" as const,
    counted: "",
    comment: "",
    result: null,
  };
}

export function validateCloseContext(params: {
  role: CorteRole;
  filters: CorteFilters;
  concessionId?: string | null;
  branchId?: string | null;
  summary: CorteSummary | null;
}): CloseContextValidation {
  if (params.filters.jornadaId || params.filters.fecha || params.filters.inventarioId) {
    return { valid: false, reason: "El cierre sólo admite el contexto operativo actual del servidor." };
  }
  if (params.role === "SUPERADMIN") {
    return { valid: false, reason: "El consolidado no representa una caja individual." };
  }
  if (!params.concessionId || !params.branchId) {
    return { valid: false, reason: "Falta la concesión o sucursal autorizada." };
  }
  if (params.summary?.corteCerrado) {
    return { valid: false, reason: "Esta unidad ya tiene un corte cerrado." };
  }
  if (params.role === "ADMIN") {
    if (!params.filters.sucursalId || !params.filters.cajaId || !params.filters.idUser) {
      return {
        valid: false,
        reason: "Selecciona sucursal, caja y vendedor para cerrar una unidad concreta.",
      };
    }
  }
  if (!params.summary) {
    return { valid: false, reason: "El resumen de caja todavía no está disponible." };
  }
  if (!params.summary.jornadaId || !params.summary.businessDate) {
    return {
      valid: false,
      reason: "El contexto operativo actual no está disponible. Actualiza la caja antes de cerrar.",
    };
  }
  return { valid: true };
}

export function buildClosePayload(
  efectivoContado: number,
  comentarios: string,
  operationalContext: { jornadaId: string; businessDate: string },
): CloseCortePayload {
  return {
    efectivoContado: roundMoney(efectivoContado),
    ...(comentarios.trim() ? { comentarios: comentarios.trim() } : {}),
    expectedJornadaId: operationalContext.jornadaId,
    expectedBusinessDate: operationalContext.businessDate,
  };
}

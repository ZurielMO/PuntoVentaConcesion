import type {
  Corte,
  CorteResumen,
  ReporteCortes,
} from "@/lib/types";

export const CORTE_SECTIONS = [
  "resumen",
  "caja-actual",
  "reporte",
  "inventario",
  "historial",
  "incidencias",
] as const;

export type CorteSection = (typeof CORTE_SECTIONS)[number];
export type CorteRole = "VENDEDOR" | "ADMIN" | "SUPERADMIN";

export type CorteFilterKey =
  | "jornadaId"
  | "concesionId"
  | "sucursalId"
  | "cajaId"
  | "idUser"
  | "inventarioId";

export type CorteFilters = Partial<Record<CorteFilterKey, string>> & {
  sesionCajaId?: string;
  fecha?: string;
  cursor?: string;
  limit?: number;
};

export type CorteUrlState = {
  section: CorteSection;
  filters: Partial<Record<CorteFilterKey, string>>;
  historyPage: number;
  historyLimit: 25 | 50 | 100 | 200;
  historyStatus: string;
  businessDate: string;
};

export type CorteIncident = {
  codigo: string;
  ventaId?: string;
  linea?: number;
  bloqueante?: boolean;
};

export type CorteCommission = {
  porcentajeAplicado: number;
  baseComision: number;
  importeComision: number;
  reglaRedondeo?: string;
};

export type CorteInventorySummary = {
  unidadesVendidas: number;
  unidadesCortesia: number;
  unidadesMerma: number;
  items: Array<{
    productoId: string;
    nombre: string;
    vendidas: number;
    cortesias: number;
    merma: number;
    esperado?: number | null;
    fisico?: number | null;
    diferencia?: number | null;
    estadoConciliacion?: string | null;
  }>;
};

export type CorteSubscriberSummary = {
  operaciones: number;
  unidades: number;
  importeCobrado: number;
  descuentoOtorgado: number;
};

export type CorteCourtesySummary = {
  cantidad: number;
  valorTeorico: number;
};

export type CorteWasteSummary = CorteCourtesySummary & {
  items: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    valorTeorico: number;
  }>;
};

export type CortePromotionSummary = {
  montoTotal: number;
  montoDescuento: number;
  unidadesGratis: number;
  cantidadTransacciones: number;
  items: Array<{
    id: string;
    nombre: string;
    montoTotal: number;
    montoDescuento: number;
    unidadesGratis: number;
    cantidadTransacciones: number;
  }>;
};

export type CorteComboSummary = {
  montoTotal: number;
  cantidadVendidos: number;
  items: Array<{
    comboId: string;
    nombre: string;
    cantidadVendidos: number;
    montoTotal: number;
  }>;
};

export type CorteMetricKey =
  | "ventaNeta"
  | "ventasBrutas"
  | "descuentos"
  | "ventasNetas"
  | "dineroReal"
  | "totalEfectivo"
  | "totalTarjeta"
  | "totalPuntosMonto"
  | "totalPuntosCanjeados"
  | "ventasConPuntos"
  | "cantidadVentas"
  | "abonados"
  | "cortesias"
  | "promociones"
  | "combos"
  | "merma"
  | "cancelaciones"
  | "reembolsos"
  | "comision"
  | "ticketPromedio"
  | "unidadesVendidas"
  | "ajustes"
  | "fondoInicial"
  | "movimientosCaja"
  | "efectivoEsperado"
  | "efectivoContado"
  | "diferenciaCaja"
  | "inventario"
  | "incidencias";

export type CorteAvailability = Partial<Record<CorteMetricKey, boolean>>;

export type CorteCashMovements = {
  entradas?: number;
  salidas?: number;
  retiros?: number;
  depositos?: number;
  devoluciones?: number;
  ajustes?: number;
  neto?: number;
};

export type CorteSummary = CorteResumen & {
  availability?: CorteAvailability;
  calculationVersion?: string;
  ventasBrutas?: number;
  descuentos?: number;
  ventasNetas?: number;
  dineroReal?: number;
  ticketPromedio?: number;
  unidadesVendidas?: number;
  comision?: CorteCommission;
  inventario?: CorteInventorySummary;
  incidencias?: CorteIncident[];
  ventasPorHora?: Array<{
    hora: string;
    ventasNetas: number;
    dineroReal: number;
    tickets: number;
  }>;
  metodosPago?: Record<string, number>;
  warnings?: string[];
  businessDate?: string;
  jornadaId?: string;
  abonados?: CorteSubscriberSummary;
  cortesias?: CorteCourtesySummary;
  promociones?: CortePromotionSummary;
  merma?: CorteWasteSummary;
  cancelaciones?: number;
  reembolsos?: number;
  fondoInicial?: number;
  movimientosCaja?: CorteCashMovements;
  efectivoEsperado?: number;
};

export type CorteDashboard = {
  contexto: Partial<Record<CorteFilterKey | "role" | "sesionCajaId", string>>;
  filtrosAplicados: Partial<Record<CorteFilterKey | "sesionCajaId", string | null>>;
  jornadaId?: string | null;
  businessDate?: string | null;
  ventasNetas: number;
  dineroReal: number;
  efectivo: number;
  tarjeta: number;
  puntos: number;
  puntosCanjeados: number;
  tickets: number;
  ticketPromedio: number;
  unidadesVendidas: number;
  comision: CorteCommission;
  abonados: CorteSubscriberSummary;
  promociones: CortePromotionSummary;
  combos: CorteComboSummary;
  cortesias: CorteCourtesySummary;
  merma: CorteWasteSummary;
  cancelaciones: number;
  reembolsos: number;
  inventario: CorteInventorySummary;
  incidencias: CorteIncident[];
  ventasPorHora: CorteSummary["ventasPorHora"];
  metodosPago: Array<{ metodo: string; monto: number }>;
  productosPrincipales: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    subtotal: number;
    precioUnitario: number;
  }>;
  cortesRecientes: CorteHistoryItem[];
  warnings?: string[];
};

export type CorteHistoryItem = Corte & {
  resumen?: Record<string, unknown>;
  calculationVersion?: string;
  businessDate?: string;
  generatedAt?: unknown;
  idempotentReplay?: boolean;
  cajeroNombre?: string | null;
  closedBy?: string | null;
  conteoComprobantes?: number | null;
  comision?: CorteCommission;
  cancelaciones?: number;
  reembolsos?: number;
  ajustes?: number | null;
  warnings?: string[];
  hasAuthoritativeSnapshot?: boolean;
  availability?: CorteAvailability;
  ventasBrutas?: number;
  descuentos?: number;
  ventasNetas?: number;
  dineroReal?: number;
  ticketPromedio?: number;
  unidadesVendidas?: number;
  metodosPago?: Record<string, number>;
  abonados?: CorteSubscriberSummary;
  cortesias?: CorteCourtesySummary;
  promociones?: CortePromotionSummary;
  combos?: CorteComboSummary;
  merma?: CorteWasteSummary;
  inventario?: CorteInventorySummary;
  incidencias?: CorteIncident[];
  fondoInicial?: number;
  movimientosCaja?: CorteCashMovements;
  efectivoEsperado?: number;
};

export type CorteHistoryPage = {
  data: CorteHistoryItem[];
  items: CorteHistoryItem[];
  count: number;
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
};

export type CorteReportIncome = {
  availability: CorteAvailability;
  ventaNeta?: number;
  totalEfectivo?: number;
  totalTarjeta?: number;
  totalPuntosMonto?: number;
  totalPuntosCanjeados?: number;
  ventasConPuntos?: number;
  cantidadVentas?: number;
  ventasBrutas?: number;
  descuentos?: number;
  ventasNetas?: number;
  dineroReal?: number;
  abonados?: CorteSubscriberSummary;
  cortesias?: CorteCourtesySummary;
  promociones?: CortePromotionSummary;
  combos?: CorteComboSummary;
  merma?: CorteWasteSummary;
  cancelaciones?: number;
  reembolsos?: number;
  comision?: CorteCommission;
  ticketPromedio?: number;
  unidadesVendidas?: number;
  ajustes?: number;
  fondoInicial?: number;
  movimientosCaja?: CorteCashMovements;
  efectivoEsperado?: number;
};

export type CorteReportProduct = NonNullable<ReporteCortes["productos"]>[number] & {
  entradas?: number | null;
  traspasos?: number | null;
  promociones?: number | null;
  merma?: number | null;
  devoluciones?: number | null;
  esperado?: number | null;
  fisico?: number | null;
  diferencia?: number | null;
  estadoConciliacion?: string | null;
};

export type CorteReport = Omit<ReporteCortes, "productos" | "ingresos"> & {
  productos: CorteReportProduct[] | null;
  ingresos: CorteReportIncome | null;
  calculationVersion?: string;
  incidencias?: CorteIncident[];
  warnings?: string[];
  generatedAt?: unknown;
};

export type CloseCortePayload = {
  comentarios?: string;
  efectivoContado?: number;
  sesionCajaId?: string;
  expectedJornadaId?: string;
  expectedBusinessDate?: string;
};

export type CloseCorteResult = CorteHistoryItem & {
  idempotentReplay?: boolean;
};

export type CloseCorteSubmission = {
  attemptId: string;
  result: CloseCorteResult;
};

export type CorteInventoryRow = {
  productoId: string;
  nombre: string;
  inicial: number;
  entradas: number | null;
  traspasos: number | null;
  vendidoRegular: number;
  abonado: number;
  promociones: number | null;
  cortesias: number;
  merma: number | null;
  devoluciones: number | null;
  finalRegistrado: number;
  esperado: number | null;
  fisico: number | null;
  diferencia: number | null;
  status: "correcto" | "revision" | "critico" | "sin-conciliacion";
};

export type CorteUiIncident = {
  id: string;
  code: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  source: string;
  amount?: number;
  section: CorteSection;
};

export type CorteHistoryStatusFilter = "" | "CERRADO" | "AJUSTADO" | "ANULADO" | "REABIERTO" | "OTRO";

export type CorteResourceMetadata = {
  requestId?: string;
  stale: boolean;
  partial: boolean;
};

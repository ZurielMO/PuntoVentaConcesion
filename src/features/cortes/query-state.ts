import type {
  CorteFilterKey,
  CorteSection,
  CorteUrlState,
} from "./contracts";
import type { CorteAccessModel } from "./role-access";

const SECTION_PARAM = "seccion";
const HISTORY_LIMIT_PARAM = "limite";
const HISTORY_STATUS_PARAM = "estado";
const BUSINESS_DATE_PARAM = "fecha";
const HISTORY_LIMITS = [25, 50, 100, 200] as const;

const FILTER_PARAMS: Record<CorteFilterKey, string> = {
  jornadaId: "jornada",
  concesionId: "concesion",
  sucursalId: "sucursal",
  cajaId: "caja",
  idUser: "vendedor",
  inventarioId: "inventario",
};

const cleanValue = (value: string | null): string | undefined => {
  const cleaned = value?.trim();
  return cleaned && cleaned.length <= 128 ? cleaned : undefined;
};

const cleanBusinessDate = (value: string | null): string => {
  const parsed = value?.trim() ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(parsed) ? parsed : "";
};

const cleanHistoryStatus = (value: string | null): string => {
  const parsed = value?.trim().toUpperCase() ?? "";
  return ["CERRADO", "AJUSTADO", "ANULADO", "REABIERTO", "OTRO"].includes(parsed)
    ? parsed
    : "";
};

export function parseCortesUrlState(
  search: URLSearchParams,
  access: CorteAccessModel,
): CorteUrlState {
  const requestedSection = cleanValue(search.get(SECTION_PARAM));
  const section = access.sections.includes(requestedSection as CorteSection)
    ? (requestedSection as CorteSection)
    : access.defaultSection;
  const filters: CorteUrlState["filters"] = {};

  for (const filter of access.editableFilters) {
    const value = cleanValue(search.get(FILTER_PARAMS[filter]));
    if (value) filters[filter] = value;
  }

  const requestedLimit = Number(search.get(HISTORY_LIMIT_PARAM));
  const historyPage = 1;
  const historyLimit = HISTORY_LIMITS.includes(
    requestedLimit as (typeof HISTORY_LIMITS)[number],
  )
    ? (requestedLimit as (typeof HISTORY_LIMITS)[number])
    : 100;
  const historyStatus = cleanHistoryStatus(search.get(HISTORY_STATUS_PARAM));
  const businessDate = cleanBusinessDate(search.get(BUSINESS_DATE_PARAM));

  return {
    section,
    filters,
    historyPage,
    historyLimit,
    historyStatus,
    businessDate,
  };
}

export function serializeCortesUrlState(
  current: URLSearchParams,
  state: CorteUrlState,
  access: CorteAccessModel,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  next.set(
    SECTION_PARAM,
    access.sections.includes(state.section)
      ? state.section
      : access.defaultSection,
  );

  for (const [filter, param] of Object.entries(FILTER_PARAMS) as Array<
    [CorteFilterKey, string]
  >) {
    const value = access.editableFilters.includes(filter)
      ? cleanValue(state.filters[filter] ?? null)
      : undefined;
    if (value) next.set(param, value);
    else next.delete(param);
  }

  next.delete("pagina");
  next.set(
    HISTORY_LIMIT_PARAM,
    String(HISTORY_LIMITS.includes(state.historyLimit) ? state.historyLimit : 100),
  );
  if (state.historyStatus) next.set(HISTORY_STATUS_PARAM, cleanHistoryStatus(state.historyStatus));
  else next.delete(HISTORY_STATUS_PARAM);
  if (state.businessDate) next.set(BUSINESS_DATE_PARAM, cleanBusinessDate(state.businessDate));
  else next.delete(BUSINESS_DATE_PARAM);

  return next;
}

export function updateCorteFilter(
  state: CorteUrlState,
  filter: CorteFilterKey,
  value: string,
): CorteUrlState {
  const filters = { ...state.filters, [filter]: value || undefined };

  if (filter === "concesionId") {
    delete filters.sucursalId;
    delete filters.cajaId;
    delete filters.idUser;
    delete filters.inventarioId;
  }
  if (filter === "sucursalId") {
    delete filters.cajaId;
    delete filters.idUser;
    delete filters.inventarioId;
  }
  if (filter === "jornadaId") {
    delete filters.inventarioId;
  }

  return { ...state, filters, historyPage: 1 };
}

export function clearCorteFilters(state: CorteUrlState): CorteUrlState {
  return {
    ...state,
    filters: {},
    historyPage: 1,
    historyStatus: "",
    businessDate: "",
  };
}

export function updateCorteHistoryView(
  state: CorteUrlState,
  update: {
    limit?: number;
    status?: string;
    businessDate?: string;
  },
): CorteUrlState {
  const limit = HISTORY_LIMITS.includes(
    update.limit as (typeof HISTORY_LIMITS)[number],
  )
    ? (update.limit as (typeof HISTORY_LIMITS)[number])
    : state.historyLimit;
  return {
    ...state,
    historyPage: 1,
    historyLimit: limit,
    historyStatus:
      update.status === undefined
        ? state.historyStatus
        : cleanHistoryStatus(update.status),
    businessDate:
      update.businessDate === undefined
        ? state.businessDate
        : cleanBusinessDate(update.businessDate),
  };
}

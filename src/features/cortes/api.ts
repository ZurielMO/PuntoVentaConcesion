"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api, apiPaths, ApiError as HttpApiError } from "@/lib/api/client";
import {
  adaptCorteDashboard,
  adaptCorteHistoryPage,
  adaptCorteHistoryItem,
  adaptCorteReport,
  adaptCorteSummary,
} from "./adapters";
import {
  CORTE_IDEMPOTENCY_HEADER,
  getOrCreateCloseAttempt,
  type CorteCloseAttempt,
} from "./idempotency";
import type {
  CloseCortePayload,
  CloseCorteSubmission,
  CorteDashboard,
  CorteFilters,
  CorteHistoryPage,
  CorteReport,
  CorteSummary,
} from "./contracts";
import { createRequestIdentityGuard } from "./request-identity";
import {
  createMutationAttemptGuard,
  StaleCorteAttemptError,
} from "./mutation-attempt";

type ResourceOptions = {
  enabled?: boolean;
};

const value = (input?: string): string | undefined => {
  const cleaned = input?.trim();
  return cleaned || undefined;
};

export function buildCorteQuery(filters: CorteFilters = {}): string {
  const search = new URLSearchParams();
  const stringFilters: Array<
    [keyof Omit<CorteFilters, "limit">, string | undefined]
  > = [
    ["concesionId", filters.concesionId],
    ["sucursalId", filters.sucursalId],
    ["cajaId", filters.cajaId],
    ["idUser", filters.idUser],
    ["inventarioId", filters.inventarioId],
    ["sesionCajaId", filters.sesionCajaId],
    ["jornadaId", filters.jornadaId],
    ["fecha", filters.fecha],
    ["cursor", filters.cursor],
  ];

  for (const [key, raw] of stringFilters) {
    const parsed = value(raw);
    if (parsed) search.set(key, parsed);
  }

  if (Number.isFinite(filters.limit)) {
    search.set("limit", String(Math.min(200, Math.max(1, filters.limit!))));
  }
  return search.toString();
}

const withQuery = (path: string, filters: CorteFilters): string => {
  const query = buildCorteQuery(filters);
  return query ? `${path}?${query}` : path;
};

function useCorteResource<T>(
  path: string,
  initialValue: T,
  adapt: (response: unknown) => T,
  options: ResourceOptions = {},
) {
  const { token } = useAuth();
  const enabled = options.enabled !== false;
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const activePath = useRef(path);
  const requestGuard = useRef(createRequestIdentityGuard());
  const activeController = useRef<AbortController | null>(null);

  const fetchResource = useCallback(async () => {
    const identity = requestGuard.current.begin(path);
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;

    if (!token) {
      requestGuard.current.commit(identity, () => {
        setData(initialValue);
        setLoading(false);
        if (activeController.current === controller) activeController.current = null;
      });
      return initialValue;
    }
    if (!enabled) {
      requestGuard.current.commit(identity, () => {
        setLoading(false);
        if (activeController.current === controller) activeController.current = null;
      });
      return initialValue;
    }

    requestGuard.current.commit(identity, () => {
      setLoading(true);
      setError(null);
      setErrorCode(null);
    });
    try {
      const response = await api.getWithOptions<unknown>(path, {
        token,
        signal: controller.signal,
      });
      const next = adapt(response);
      const responseRequestId = response && typeof response === "object"
        ? (response as { _requestId?: string })._requestId
        : undefined;
      requestGuard.current.commit(identity, () => {
        setData(next);
        setRequestId(responseRequestId ?? null);
        setLastUpdatedAt(new Date());
      });
      return next;
    } catch (cause) {
      if (controller.signal.aborted || !requestGuard.current.isCurrent(identity)) {
        return initialValue;
      }
      requestGuard.current.commit(identity, () => {
        setError(
          cause instanceof Error
            ? cause.message
            : "No fue posible cargar la información de cortes",
        );
        setErrorCode(cause instanceof HttpApiError ? cause.code ?? null : null);
        setRequestId(cause instanceof HttpApiError ? cause.requestId ?? null : null);
      });
      throw cause;
    } finally {
      requestGuard.current.commit(identity, () => {
        setLoading(false);
        if (activeController.current === controller) {
          activeController.current = null;
        }
      });
    }
  }, [adapt, enabled, initialValue, path, token]);

  useEffect(() => {
    const guard = requestGuard.current;
    if (activePath.current !== path) {
      activeController.current?.abort();
      activeController.current = null;
      guard.invalidate(path);
      activePath.current = path;
      setData(initialValue);
      setError(null);
      setErrorCode(null);
      setRequestId(null);
      setLastUpdatedAt(null);
    }
    if (!enabled) {
      setLoading(false);
      return;
    }
    void fetchResource().catch(() => undefined);
    return () => {
      activeController.current?.abort();
      activeController.current = null;
      guard.invalidate(path);
    };
  }, [enabled, fetchResource, initialValue, path]);

  const pathMatchesData = activePath.current === path;
  const exposedData = pathMatchesData ? data : initialValue;
  const exposedLastUpdatedAt = pathMatchesData ? lastUpdatedAt : null;
  const exposedError = pathMatchesData ? error : null;
  const exposedErrorCode = pathMatchesData ? errorCode : null;
  const exposedRequestId = pathMatchesData ? requestId : null;
  const exposedLoading = pathMatchesData ? loading : enabled;

  return {
    data: exposedData,
    loading: exposedLoading,
    error: exposedError,
    errorCode: exposedErrorCode,
    requestId: exposedRequestId,
    stale: Boolean(exposedError && exposedLastUpdatedAt),
    partial: (Array.isArray(exposedData)
      ? exposedData
      : exposedData && typeof exposedData === "object" && "items" in exposedData && Array.isArray((exposedData as { items?: unknown[] }).items)
        ? (exposedData as { items: unknown[] }).items
        : null)
      ?.some((row) => Boolean(
          row &&
          typeof row === "object" &&
          "warnings" in row &&
          Array.isArray((row as { warnings?: unknown[] }).warnings) &&
          (row as { warnings: unknown[] }).warnings.length > 0
        )) ?? Boolean(
          exposedData &&
          typeof exposedData === "object" &&
          "warnings" in exposedData &&
          Array.isArray((exposedData as { warnings?: unknown[] }).warnings) &&
          (exposedData as { warnings: unknown[] }).warnings.length > 0
        ),
    lastUpdatedAt: exposedLastUpdatedAt,
    refetch: fetchResource,
  };
}

const EMPTY_HISTORY_PAGE: CorteHistoryPage = {
  data: [],
  items: [],
  count: 0,
  meta: { nextCursor: null, hasMore: false, limit: 100 },
};
const adaptDashboardResource = (response: unknown): CorteDashboard | null =>
  adaptCorteDashboard(response);
const adaptSummaryResource = (response: unknown): CorteSummary | null =>
  adaptCorteSummary(response);

export function useCorteDashboard(
  filters: CorteFilters,
  options?: ResourceOptions,
) {
  const path = useMemo(
    () => withQuery(`${apiPaths.cortes}/dashboard`, filters),
    [filters],
  );
  return useCorteResource<CorteDashboard | null>(
    path,
    null,
    adaptDashboardResource,
    options,
  );
}

export function useCorteSummary(
  filters: CorteFilters,
  options?: ResourceOptions,
) {
  const path = useMemo(
    () => withQuery(`${apiPaths.cortes}/resumen`, filters),
    [filters],
  );
  return useCorteResource<CorteSummary | null>(
    path,
    null,
    adaptSummaryResource,
    options,
  );
}

export function useCorteReport(
  filters: CorteFilters,
  options?: ResourceOptions,
) {
  const path = useMemo(
    () => withQuery(`${apiPaths.cortes}/reporte`, filters),
    [filters],
  );
  return useCorteResource<CorteReport | null>(
    path,
    null,
    adaptCorteReport,
    options,
  );
}

export function useCorteHistory(
  filters: CorteFilters,
  options?: ResourceOptions,
) {
  const path = useMemo(
    () => withQuery(`${apiPaths.cortes}/historial`, filters),
    [filters],
  );
  return useCorteResource<CorteHistoryPage>(
    path,
    EMPTY_HISTORY_PAGE,
    adaptCorteHistoryPage,
    options,
  );
}

export function useCloseCorte(filters: CorteFilters) {
  const { token } = useAuth();
  const attempt = useRef<CorteCloseAttempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const mutationGuard = useRef(createMutationAttemptGuard());
  const activeController = useRef<AbortController | null>(null);

  const closeCorte = useCallback(
    async (payload: CloseCortePayload): Promise<CloseCorteSubmission> => {
      if (!token) throw new Error("Sin sesi?n");
      const mutation = mutationGuard.current.begin(buildCorteQuery(filters));
      activeController.current?.abort();
      const controller = new AbortController();
      activeController.current = controller;
      const isCurrent = () => mutationGuard.current.isCurrent(mutation);
      attempt.current = getOrCreateCloseAttempt(attempt.current, payload, filters);
      const idempotencyKey = attempt.current.key;
      setLoading(true);
      setError(null);
      setErrorCode(null);
      setRequestId(null);

      try {
        const response = await api.postWithOptions<unknown>(
          withQuery(`${apiPaths.cortes}/cerrar`, filters),
          payload,
          {
            token,
            headers: { [CORTE_IDEMPOTENCY_HEADER]: idempotencyKey },
            signal: controller.signal,
          },
        );
        if (controller.signal.aborted || !isCurrent()) {
          throw new StaleCorteAttemptError();
        }
        const result = adaptCorteHistoryItem(
          response && typeof response === "object" && "data" in response
            ? (response as { data: unknown }).data
            : response,
        );
        const accepted = mutationGuard.current.accept(mutation, result);
        if (!accepted) throw new StaleCorteAttemptError();
        attempt.current = null;
        return { attemptId: mutation.attemptId, result: accepted };
      } catch (cause) {
        if (controller.signal.aborted || cause instanceof StaleCorteAttemptError || !isCurrent()) {
          throw cause instanceof StaleCorteAttemptError ? cause : new StaleCorteAttemptError();
        }
        setError(cause instanceof Error ? cause.message : "No fue posible cerrar la caja");
        setErrorCode(cause instanceof HttpApiError ? cause.code ?? null : null);
        setRequestId(cause instanceof HttpApiError ? cause.requestId ?? null : null);
        throw cause;
      } finally {
        if (isCurrent()) {
          setLoading(false);
          if (activeController.current === controller) activeController.current = null;
        }
      }
    },
    [filters, token],
  );

  const resetAttempt = useCallback(() => {
    activeController.current?.abort();
    activeController.current = null;
    mutationGuard.current.invalidate();
    attempt.current = null;
    setLoading(false);
    setError(null);
    setErrorCode(null);
    setRequestId(null);
  }, []);

  const isCurrentAttempt = useCallback(
    (attemptId: string) => mutationGuard.current.isCurrent(attemptId),
    [],
  );

  return {
    closeCorte,
    loading,
    error,
    errorCode,
    requestId,
    resetAttempt,
    isCurrentAttempt,
  };
}

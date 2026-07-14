"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Banknote,
  BarChart3,
  Boxes,
  CircleAlert,
  Eye,
  FileDown,
  History,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { CorteDetalleDialog } from "@/components/dashboard/corte-detalle-dialog";
import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useConcessions } from "@/hooks/use-concessions";
import { useAuth } from "@/hooks/use-auth";
import { useInventarios, useJornadasDisponibles } from "@/hooks/use-inventarios";
import { usePermissions } from "@/hooks/use-permissions";
import { useSucursales } from "@/hooks/use-sucursales";
import { useUsers } from "@/hooks/use-users";
import { formatPrice } from "@/lib/format";
import { normalizeRole } from "@/lib/permissions";
import { UserRole } from "@/lib/types";
import {
  useCorteDashboard,
  useCorteHistory,
  useCorteReport,
  useCorteSummary,
} from "../api";
import type {
  CorteFilterKey,
  CorteFilters,
  CorteHistoryItem,
  CorteSection,
  CorteUrlState,
} from "../contracts";
import {
  clearCorteFilters,
  parseCortesUrlState,
  serializeCortesUrlState,
  updateCorteFilter,
  updateCorteHistoryView,
} from "../query-state";
import {
  canEditCorteFilter,
  getCorteAccessModel,
} from "../role-access";
import {
  buildInventoryRows,
  buildUiIncidents,
  filterCorteHistory,
  popCorteHistoryCursor,
  pushCorteHistoryCursor,
  isCloseSummaryFresh,
  sanitizeCorteDeepLink,
  selectOperationalSummarySource,
  splitCorteFilterScopes,
} from "../view-models";
import {
  corteLifecycleLabel,
  formatBusinessDate,
} from "../formatters";
import { CloseFlow } from "./close-flow";
import { useCortePdfExport } from "./use-pdf-export";
import { CortesFilterBar } from "./cortes-filter-bar";
import { CortesKpiGrid, MetodosCobroCollapse } from "./cortes-kpi-grid";
import {
  CortesReconciliationCard,
  reconciliationFromSummary,
} from "./cortes-reconciliation-card";
import { CortesActivityList } from "./cortes-activity-list";
import { CortesReportSection } from "./cortes-report-section";
import { CortesInventorySection } from "./cortes-inventory-section";
import { CortesIncidentsSection } from "./cortes-incidents-section";
import { FadeInSection } from "./cortes-motion";
import { roleDisplayLabel, secondaryLabelClass, StatusBadge } from "./cortes-status";

const SalesByHourChart = dynamic(
  () => import("./corte-visualizations").then((module) => module.SalesByHourChart),
  { ssr: false },
);

const SECTION_META: Record<
  CorteSection,
  { label: string; icon: typeof BarChart3 }
> = {
  resumen: { label: "Resumen", icon: BarChart3 },
  "caja-actual": { label: "Caja actual", icon: Banknote },
  reporte: { label: "Reporte de jornada", icon: ReceiptText },
  inventario: { label: "Inventario", icon: Boxes },
  historial: { label: "Historial", icon: History },
  incidencias: { label: "Incidencias", icon: TriangleAlert },
};

const FALLBACK_ACCESS = getCorteAccessModel("VENDEDOR")!;

function ResourceError({
  message,
  requestId,
  onRetry,
}: {
  message: string;
  requestId?: string | null;
  onRetry: () => void;
}) {
  return (
    <Card role="alert" className="border border-destructive/20 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[1.7rem] text-destructive">
          <CircleAlert aria-hidden="true" />
          No fue posible cargar esta sección
        </CardTitle>
        <CardDescription>{message}</CardDescription>
        {requestId ? (
          <p className={secondaryLabelClass()}>Referencia: {requestId}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" aria-hidden="true" />
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}

function ResourceStateNotice({
  stale,
  partial,
  requestId,
  onRetry,
}: {
  stale?: boolean;
  partial?: boolean;
  requestId?: string | null;
  onRetry?: () => void;
}) {
  if (!stale && !partial) return null;
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-md border border-border bg-muted p-3 text-[1.3rem] sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <strong>{stale ? "Datos desactualizados" : "Datos parciales"}</strong>
        <p className={secondaryLabelClass()}>
          {stale
            ? "Se conserva la última respuesta disponible."
            : "Revisa incidencias antes de cerrar."}
          {requestId ? ` Ref: ${requestId}.` : ""}
        </p>
      </div>
      {onRetry ? (
        <Button className="min-h-11" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" aria-hidden="true" />
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export function CortesModule() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { posUser } = useAuth();
  const pdfGeneratedBy = posUser?.nombre ?? posUser?.email ?? posUser?.uid;
  const permissions = usePermissions();
  const roleName = permissions.isSuperAdmin
    ? "SUPERADMIN"
    : permissions.isAdmin
      ? "ADMIN"
      : permissions.isVendedor
        ? "VENDEDOR"
        : permissions.role;
  const resolvedAccess = useMemo(() => getCorteAccessModel(roleName), [roleName]);
  const access = resolvedAccess ?? FALLBACK_ACCESS;
  const urlState = useMemo(
    () => parseCortesUrlState(new URLSearchParams(searchParams.toString()), access),
    [access, searchParams],
  );

  const replaceUrlState = useCallback(
    (nextState: CorteUrlState) => {
      const next = serializeCortesUrlState(
        new URLSearchParams(searchParams.toString()),
        nextState,
        access,
      );
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [access, pathname, router, searchParams],
  );

  const { concessions, loading: concessionsLoading } = useConcessions();
  const { sucursales, loading: sucursalesLoading } = useSucursales();
  const { inventarios, loading: inventariosLoading } = useInventarios(false);

  const effectiveConcesionId = permissions.isSuperAdmin
    ? urlState.filters.concesionId ?? ""
    : permissions.concesionId ?? "";
  const effectiveSucursalId = permissions.isVendedor
    ? permissions.sucursalId ?? ""
    : urlState.filters.sucursalId ?? "";

  const { jornadas, loading: jornadasLoading, refetch: refetchJornadas } =
    useJornadasDisponibles({
      concesionId: effectiveConcesionId || undefined,
      sucursalId: effectiveSucursalId || undefined,
    });
  const canFilterUser = canEditCorteFilter(access, "idUser");
  const { users, loading: usersLoading } = useUsers(effectiveConcesionId || undefined, {
    enabled: canFilterUser,
  });

  useEffect(() => {
    if (urlState.filters.jornadaId || urlState.businessDate || jornadas.length === 0) return;
    replaceUrlState(updateCorteFilter(urlState, "jornadaId", jornadas[0].jornadaId));
  }, [jornadas, replaceUrlState, urlState]);

  const requestedFilters = useMemo<CorteFilters>(
    () => ({
      ...(permissions.isSuperAdmin && urlState.filters.concesionId
        ? { concesionId: urlState.filters.concesionId }
        : {}),
      ...(urlState.filters.sucursalId ? { sucursalId: urlState.filters.sucursalId } : {}),
      ...(urlState.filters.cajaId ? { cajaId: urlState.filters.cajaId } : {}),
      ...(urlState.filters.idUser ? { idUser: urlState.filters.idUser } : {}),
      ...(urlState.filters.inventarioId
        ? { inventarioId: urlState.filters.inventarioId }
        : {}),
      ...(urlState.filters.jornadaId ? { jornadaId: urlState.filters.jornadaId } : {}),
      ...(urlState.businessDate ? { fecha: urlState.businessDate } : {}),
    }),
    [permissions.isSuperAdmin, urlState.businessDate, urlState.filters],
  );

  const { operational: operationalFilters, historical: historicalFilters } = useMemo(
    () => splitCorteFilterScopes(requestedFilters),
    [requestedFilters],
  );
  const [historyCursorStack, setHistoryCursorStack] = useState<string[]>([]);
  const [refreshFlash, setRefreshFlash] = useState(false);
  const historyCursor = historyCursorStack.at(-1);
  const historyScopeKey = JSON.stringify({
    concesionId: historicalFilters.concesionId ?? null,
    sucursalId: historicalFilters.sucursalId ?? null,
    cajaId: historicalFilters.cajaId ?? null,
    idUser: historicalFilters.idUser ?? null,
    inventarioId: historicalFilters.inventarioId ?? null,
    jornadaId: historicalFilters.jornadaId ?? null,
  });
  useEffect(() => {
    setHistoryCursorStack([]);
  }, [historyScopeKey]);

  const operationalCloseFilters = useMemo<CorteFilters>(
    () => ({
      ...operationalFilters,
      ...(permissions.isVendedor && permissions.cajaId
        ? { cajaId: permissions.cajaId }
        : {}),
      ...(permissions.isVendedor && posUser?.uid ? { idUser: posUser.uid } : {}),
    }),
    [operationalFilters, permissions.cajaId, permissions.isVendedor, posUser?.uid],
  );

  const dashboardResource = useCorteDashboard(operationalFilters, {
    enabled: Boolean(resolvedAccess) && ["resumen", "caja-actual"].includes(urlState.section),
  });
  const summaryResource = useCorteSummary(operationalFilters, {
    enabled:
      Boolean(resolvedAccess) && ["resumen", "caja-actual"].includes(urlState.section),
  });
  const reportResource = useCorteReport(historicalFilters, {
    enabled:
      Boolean(resolvedAccess) &&
      ["reporte", "inventario", "incidencias"].includes(urlState.section),
  });
  const historyResource = useCorteHistory(
    {
      ...historicalFilters,
      fecha: undefined,
      limit: urlState.historyLimit,
      ...(historyCursor ? { cursor: historyCursor } : {}),
    },
    { enabled: Boolean(resolvedAccess) && ["historial", "reporte"].includes(urlState.section) },
  );

  const inventoryRows = useMemo(
    () => buildInventoryRows(reportResource.data),
    [reportResource.data],
  );
  const operationalSummary = useMemo(
    () =>
      selectOperationalSummarySource({
        role: access.role,
        filters: operationalFilters,
        dashboard: dashboardResource.data,
        summary: summaryResource.data,
      }),
    [access.role, dashboardResource.data, operationalFilters, summaryResource.data],
  );
  const operationalIncidents = useMemo(
    () =>
      buildUiIncidents({
        incidents: dashboardResource.data?.incidencias,
        warnings: dashboardResource.data?.warnings,
        summaryDifference:
          operationalSummary.source === "exact-unit"
            ? operationalSummary.data?.diferenciaCaja
            : null,
      }),
    [dashboardResource.data?.incidencias, dashboardResource.data?.warnings, operationalSummary],
  );
  const historicalIncidents = useMemo(
    () =>
      buildUiIncidents({
        incidents: reportResource.data?.incidencias,
        warnings: reportResource.data?.warnings,
        inventoryRows,
      }),
    [inventoryRows, reportResource.data?.incidencias, reportResource.data?.warnings],
  );

  const lastUpdatedAt = [
    dashboardResource.lastUpdatedAt,
    summaryResource.lastUpdatedAt,
    reportResource.lastUpdatedAt,
    historyResource.lastUpdatedAt,
  ]
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  const updateFilter = (filter: CorteFilterKey, nextValue: string) => {
    replaceUrlState(updateCorteFilter(urlState, filter, nextValue));
  };

  const refreshCurrentSection = () => {
    void refetchJornadas();
    const requests =
      urlState.section === "historial"
        ? [historyResource.refetch()]
        : urlState.section === "caja-actual"
          ? [dashboardResource.refetch(), summaryResource.refetch()]
          : urlState.section === "resumen"
            ? [dashboardResource.refetch(), summaryResource.refetch()]
            : urlState.section === "reporte"
              ? [reportResource.refetch(), historyResource.refetch()]
              : [reportResource.refetch()];
    void Promise.allSettled(requests).then(() => {
      setRefreshFlash(true);
      window.setTimeout(() => setRefreshFlash(false), 700);
    });
  };

  const refreshAfterClose = async () => {
    await Promise.allSettled([
      dashboardResource.refetch(),
      summaryResource.refetch(),
      reportResource.refetch(),
    ]);
  };

  const navigateTo = (section: CorteSection) => {
    replaceUrlState({ ...urlState, section });
  };

  const openConcessionDetail = (concessionId: string) => {
    replaceUrlState({
      ...updateCorteFilter(urlState, "concesionId", concessionId),
      section: "reporte",
    });
  };

  const activeSucursales = useMemo(
    () =>
      sucursales.filter(
        (branch) =>
          branch.activo !== false &&
          (!effectiveConcesionId || branch.concesion_id === effectiveConcesionId),
      ),
    [effectiveConcesionId, sucursales],
  );
  const selectedSucursal = activeSucursales.find(
    (branch) => branch.id === urlState.filters.sucursalId,
  );
  const activeCajas = (selectedSucursal?.cajas ?? []).filter(
    (cashbox) => cashbox.activo !== false,
  );
  const visibleUsers = users.filter(
    (user) =>
      user.activo !== false &&
      normalizeRole(String(user.rol)) === UserRole.VENDEDOR &&
      (!urlState.filters.sucursalId || user.sucursalId === urlState.filters.sucursalId),
  );
  const visibleInventarios = inventarios.filter(
    (inventory) =>
      (!effectiveConcesionId || inventory.concesion_id === effectiveConcesionId) &&
      (!effectiveSucursalId ||
        !inventory.sucursal_id ||
        inventory.sucursal_id === effectiveSucursalId) &&
      (!urlState.filters.jornadaId ||
        `${inventory.jornada_fecha}__J${inventory.jornada_numero}` ===
          urlState.filters.jornadaId),
  );

  const selectedConcession = concessions.find(
    (concession) => concession.id === effectiveConcesionId,
  );
  const selectedJornada = jornadas.find(
    (jornada) => jornada.jornadaId === urlState.filters.jornadaId,
  );
  const sellerName = users.find(
    (user) => user.id === urlState.filters.idUser || user.uid === urlState.filters.idUser,
  )?.nombre;
  const scopeLabel = permissions.isSuperAdmin
    ? selectedConcession?.nombre ?? "Todas las concesiones"
    : selectedConcession?.nombre ?? "Alcance de concesión asignado";

  useEffect(() => {
    const sanitized = sanitizeCorteDeepLink(urlState, {
      concessionIds:
        permissions.isSuperAdmin && !concessionsLoading
          ? concessions.filter((item) => item.activo !== false).map((item) => item.id)
          : undefined,
      branchIds: !sucursalesLoading ? activeSucursales.map((item) => item.id) : undefined,
      cashboxIds:
        !sucursalesLoading && urlState.filters.sucursalId
          ? activeCajas.map((item) => item.id)
          : undefined,
      userIds:
        canFilterUser && !usersLoading
          ? visibleUsers.flatMap((item) =>
              [item.id, item.uid].filter((id): id is string => Boolean(id)),
            )
          : undefined,
      inventoryIds: !inventariosLoading
        ? visibleInventarios.map((item) => item.id)
        : undefined,
      jornadas: !jornadasLoading ? jornadas : undefined,
    });
    if (JSON.stringify(sanitized) !== JSON.stringify(urlState)) {
      replaceUrlState(sanitized);
    }
  }, [
    activeCajas,
    activeSucursales,
    canFilterUser,
    concessions,
    concessionsLoading,
    inventariosLoading,
    jornadas,
    jornadasLoading,
    permissions.isSuperAdmin,
    replaceUrlState,
    sucursalesLoading,
    urlState,
    usersLoading,
    visibleInventarios,
    visibleUsers,
  ]);

  if (permissions.loading) {
    return <Skeleton className="h-[48rem] w-full rounded-md" />;
  }

  if (!resolvedAccess) {
    return (
      <RequireRole authenticated>
        <ResourceError
          message="Tu rol no tiene acceso al módulo de cortes."
          onRetry={() => router.refresh()}
        />
      </RequireRole>
    );
  }

  const headerDescription =
    access.role === "VENDEDOR"
      ? "Consulta tu caja y completa el cierre."
      : access.role === "ADMIN"
        ? "Supervisa la conciliación de tu concesión."
        : "Compara el desempeño entre concesiones.";

  return (
    <RequireRole authenticated>
      <TooltipProvider>
        <PageHeader
          title="Cortes y reportes"
          description={headerDescription}
          actions={
            <Button variant="outline" size="sm" onClick={refreshCurrentSection}>
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
              Actualizar
            </Button>
          }
        />

        <CortesFilterBar
          access={access}
          section={urlState.section}
          urlState={urlState}
          scopeLabel={scopeLabel}
          branchLabel={selectedSucursal?.nombre ?? undefined}
          sellerFilterName={sellerName}
          userDisplayName={posUser?.nombre ?? undefined}
          userRoleLabel={roleDisplayLabel(access.role)}
          lastUpdatedAt={lastUpdatedAt}
          jornadas={jornadas}
          jornadasLoading={jornadasLoading}
          concessions={concessions
            .filter((c) => c.activo !== false)
            .map((c) => ({ id: c.id, label: c.nombre }))}
          sucursales={activeSucursales.map((b) => ({
            id: b.id,
            label: b.nombre ?? b.id,
          }))}
          cajas={activeCajas.map((c) => ({ id: c.id, label: c.nombre }))}
          users={visibleUsers.map((u) => ({
            id: u.uid ?? u.id,
            label: u.nombre,
          }))}
          inventarios={visibleInventarios.map((inv) => ({
            id: inv.id,
            label: `J${inv.jornada_numero} · ${inv.jornada_fecha}`,
          }))}
          onUpdateFilter={updateFilter}
          onHistoryViewChange={({ jornadaId, businessDate }) => {
            let next = urlState;
            if (jornadaId !== undefined) {
              const fecha =
                jornadas.find((item) => item.jornadaId === jornadaId)?.fecha ?? "";
              next = updateCorteHistoryView(updateCorteFilter(next, "jornadaId", jornadaId), {
                businessDate: fecha,
              });
            }
            if (businessDate !== undefined && jornadaId === undefined) {
              const base =
                selectedJornada && selectedJornada.fecha !== businessDate
                  ? updateCorteFilter(urlState, "jornadaId", "")
                  : urlState;
              next = updateCorteHistoryView(base, { businessDate });
            }
            replaceUrlState(next);
          }}
          onRefresh={refreshCurrentSection}
          onClear={() => replaceUrlState(clearCorteFilters(urlState))}
        />

        <Tabs
          value={urlState.section}
          onValueChange={(section) =>
            replaceUrlState({ ...urlState, section: section as CorteSection })
          }
          className="gap-5"
        >
          <div className="overflow-x-auto pb-1">
            <TabsList aria-label="Secciones de cortes" className="min-w-max">
              {access.sections.map((section) => {
                const meta = SECTION_META[section];
                const Icon = meta.icon;
                return (
                  <TabsTrigger key={section} value={section}>
                    <Icon aria-hidden="true" />
                    {meta.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value={urlState.section}>
            {urlState.section === "resumen" ? (
              <SummarySection
                dashboard={dashboardResource}
                summary={summaryResource}
                operationalData={operationalSummary.data}
                source={operationalSummary.source}
                role={access.role}
                scopeLabel={scopeLabel}
                branchLabel={selectedSucursal?.nombre ?? undefined}
                cashboxLabel={
                  activeCajas.find((cashbox) => cashbox.id === urlState.filters.cajaId)
                    ?.nombre
                }
                incidents={operationalIncidents}
                lastUpdatedAt={lastUpdatedAt}
                flash={refreshFlash}
                concessionNames={Object.fromEntries(
                  concessions.map((item) => [item.id, item.nombre]),
                )}
                branchNames={Object.fromEntries(
                  sucursales.map((item) => [item.id, item.nombre ?? item.id]),
                )}
                sellerNames={Object.fromEntries(
                  users.flatMap((item) => [
                    [item.id, item.nombre],
                    ...(item.uid ? [[item.uid, item.nombre] as [string, string]] : []),
                  ]),
                )}
                canAudit={access.role !== "VENDEDOR"}
                generatedBy={pdfGeneratedBy}
                onNavigate={navigateTo}
              />
            ) : null}
            {urlState.section === "caja-actual" ? (
              <CurrentCashboxSection
                resource={summaryResource}
                filters={operationalCloseFilters}
                role={access.role}
                concessionId={effectiveConcesionId}
                branchId={effectiveSucursalId}
                generatedBy={pdfGeneratedBy}
                onClosed={refreshAfterClose}
                onRefresh={() => summaryResource.refetch()}
                onHistory={() => navigateTo("historial")}
                onDashboard={() =>
                  navigateTo(
                    access.sections.includes("resumen") ? "resumen" : "caja-actual",
                  )
                }
              />
            ) : null}
            {urlState.section === "reporte" ? (
              <CortesReportSection
                report={reportResource.data}
                loading={reportResource.loading}
                error={reportResource.error}
                stale={reportResource.stale}
                partial={reportResource.partial}
                requestId={reportResource.requestId}
                concessionId={effectiveConcesionId}
                concessionName={selectedConcession?.nombre}
                branchName={selectedSucursal?.nombre ?? undefined}
                cashboxName={
                  activeCajas.find((cashbox) => cashbox.id === urlState.filters.cajaId)
                    ?.nombre
                }
                sellerName={sellerName}
                generatedBy={pdfGeneratedBy}
                canDownloadConsolidated={
                  permissions.isSuperAdmin && !effectiveConcesionId
                }
                inventoryRows={inventoryRows}
                incidents={historicalIncidents}
                relatedCuts={historyResource.data.items}
                onNavigate={navigateTo}
                onSelectConcession={openConcessionDetail}
                onRetry={() => void reportResource.refetch().catch(() => undefined)}
              />
            ) : null}
            {urlState.section === "inventario" ? (
              <CortesInventorySection
                rows={inventoryRows}
                loading={reportResource.loading}
                error={reportResource.error}
                stale={reportResource.stale}
                requestId={reportResource.requestId}
                jornadaFecha={reportResource.data?.jornada.fecha}
                onRetry={() => void reportResource.refetch().catch(() => undefined)}
              />
            ) : null}
            {urlState.section === "historial" ? (
              <HistorySection
                resource={historyResource}
                page={historyCursorStack.length + 1}
                limit={urlState.historyLimit}
                status={urlState.historyStatus}
                businessDate={urlState.businessDate}
                concessionNames={Object.fromEntries(
                  concessions.map((item) => [item.id, item.nombre]),
                )}
                branchNames={Object.fromEntries(
                  sucursales.map((item) => [item.id, item.nombre ?? item.id]),
                )}
                sellerNames={Object.fromEntries(
                  users.flatMap((item) => [
                    [item.id, item.nombre],
                    ...(item.uid ? [[item.uid, item.nombre] as [string, string]] : []),
                  ]),
                )}
                canAudit={access.role !== "VENDEDOR"}
                generatedBy={pdfGeneratedBy}
                onPrevious={() => setHistoryCursorStack(popCorteHistoryCursor)}
                onNext={() => {
                  const cursor = historyResource.data.meta.nextCursor;
                  if (!cursor || !historyResource.data.meta.hasMore) return;
                  setHistoryCursorStack((stack) =>
                    pushCorteHistoryCursor(stack, cursor),
                  );
                }}
                onLimitChange={(limit) => {
                  setHistoryCursorStack([]);
                  replaceUrlState(updateCorteHistoryView(urlState, { limit }));
                }}
                onStatusChange={(status) => {
                  setHistoryCursorStack([]);
                  replaceUrlState(updateCorteHistoryView(urlState, { status }));
                }}
                onBusinessDateChange={(businessDate) => {
                  setHistoryCursorStack([]);
                  replaceUrlState(updateCorteHistoryView(urlState, { businessDate }));
                }
                }
              />
            ) : null}
            {urlState.section === "incidencias" ? (
              <CortesIncidentsSection
                incidents={historicalIncidents}
                loading={reportResource.loading}
                error={reportResource.error}
                stale={reportResource.stale}
                requestId={reportResource.requestId}
                onRetry={() => void reportResource.refetch().catch(() => undefined)}
                onNavigate={navigateTo}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </TooltipProvider>
    </RequireRole>
  );
}

function SummarySection({
  dashboard,
  summary,
  operationalData,
  source,
  role,
  scopeLabel,
  branchLabel,
  cashboxLabel,
  incidents,
  lastUpdatedAt,
  flash,
  concessionNames,
  branchNames,
  sellerNames,
  canAudit,
  generatedBy,
  onNavigate,
}: {
  dashboard: ReturnType<typeof useCorteDashboard>;
  summary: ReturnType<typeof useCorteSummary>;
  operationalData: ReturnType<typeof selectOperationalSummarySource>["data"];
  source: ReturnType<typeof selectOperationalSummarySource>["source"];
  role: "VENDEDOR" | "ADMIN" | "SUPERADMIN";
  scopeLabel: string;
  branchLabel?: string;
  cashboxLabel?: string;
  incidents: ReturnType<typeof buildUiIncidents>;
  lastUpdatedAt?: Date;
  flash?: boolean;
  concessionNames: Record<string, string>;
  branchNames: Record<string, string>;
  sellerNames: Record<string, string>;
  canAudit?: boolean;
  generatedBy?: string;
  onNavigate: (section: CorteSection) => void;
}) {
  if (dashboard.error && !dashboard.stale) {
    return (
      <ResourceError
        message={dashboard.error}
        requestId={dashboard.requestId}
        onRetry={() => void dashboard.refetch().catch(() => undefined)}
      />
    );
  }
  const data = dashboard.data;
  const description =
    role === "SUPERADMIN"
      ? "Consolidado entre concesiones."
      : role === "ADMIN"
        ? "Estado financiero de la concesión."
        : "Estado de la caja asignada.";

  return (
    <FadeInSection className="flex flex-col gap-6">
      <div>
        <h2 className="text-[1.9rem] font-semibold text-green-dark">Resumen</h2>
        <p className={secondaryLabelClass("mt-1")}>{description}</p>
      </div>
      <ResourceStateNotice
        stale={dashboard.stale || summary.stale}
        partial={dashboard.partial || summary.partial}
        requestId={dashboard.requestId ?? summary.requestId}
        onRetry={() =>
          void Promise.allSettled([dashboard.refetch(), summary.refetch()])
        }
      />

      <section
        className="rounded-md border border-border bg-card p-4"
        aria-labelledby="estado-operativo-title"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3
            id="estado-operativo-title"
            className="text-[1.5rem] font-semibold text-green-dark"
          >
            Estado operativo
          </h3>
          <StatusBadge tone={operationalData?.corteCerrado ? "neutral" : "ok"}>
            {operationalData?.corteCerrado ? "Jornada cerrada" : "En operación"}
          </StatusBadge>
          <Badge variant="outline">
            {source === "exact-unit" ? "Unidad exacta" : "Agregado"}
          </Badge>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className={secondaryLabelClass()}>Alcance</dt>
            <dd className="font-medium">{scopeLabel}</dd>
          </div>
          <div>
            <dt className={secondaryLabelClass()}>Unidad</dt>
            <dd className="font-medium">
              {cashboxLabel ?? branchLabel ?? "Consolidado"}
            </dd>
          </div>
          <div>
            <dt className={secondaryLabelClass()}>Fecha</dt>
            <dd className="font-medium tabular-nums">
              {formatBusinessDate(operationalData?.businessDate)}
            </dd>
          </div>
          <div>
            <dt className={secondaryLabelClass()}>Incidencias</dt>
            <dd className="font-medium">{incidents.length}</dd>
          </div>
        </dl>
        {lastUpdatedAt ? (
          <p className={secondaryLabelClass("mt-2")}>
            Actualizado{" "}
            {lastUpdatedAt.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : null}
      </section>

      {dashboard.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-md" />
          ))}
        </div>
      ) : data ? (
        <>
          <CortesKpiGrid
            ventasNetas={data.ventasNetas}
            dineroReal={data.dineroReal}
            tickets={data.tickets}
            ticketPromedio={data.ticketPromedio}
            comision={data.comision.importeComision}
            flash={flash}
            onNavigateVentas={() => onNavigate("reporte")}
            onNavigateDinero={() => onNavigate("reporte")}
            onNavigateTickets={() => onNavigate("historial")}
            onNavigateComision={() => onNavigate("reporte")}
          />

          <MetodosCobroCollapse data={data.metodosPago} />

          <CortesReconciliationCard
            model={reconciliationFromSummary(operationalData)}
            inventoryRows={[]}
            onInventory={() => onNavigate("inventario")}
          />

          <SalesByHourChart data={data.ventasPorHora ?? []} />

          <CortesActivityList
            cuts={data.cortesRecientes ?? []}
            concessionNames={concessionNames}
            branchNames={branchNames}
            sellerNames={sellerNames}
            canAudit={canAudit}
            generatedBy={generatedBy}
            onOpenHistory={() => onNavigate("historial")}
          />
        </>
      ) : (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Sin datos para este alcance</CardTitle>
            <CardDescription>Verifica el alcance y vuelve a intentar.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </FadeInSection>
  );
}

function CurrentCashboxSection({
  resource,
  filters,
  role,
  concessionId,
  branchId,
  generatedBy,
  onClosed,
  onRefresh,
  onHistory,
  onDashboard,
}: {
  resource: ReturnType<typeof useCorteSummary>;
  filters: CorteFilters;
  role: "VENDEDOR" | "ADMIN" | "SUPERADMIN";
  concessionId?: string | null;
  branchId?: string | null;
  generatedBy?: string;
  onClosed: () => Promise<void> | void;
  onRefresh: () => Promise<unknown> | void;
  onHistory: () => void;
  onDashboard: () => void;
}) {
  const closeFresh = isCloseSummaryFresh({
    hasSummary: Boolean(resource.data),
    loading: resource.loading,
    error: resource.error,
    stale: resource.stale,
    partial: resource.partial,
    lastUpdatedAt: resource.lastUpdatedAt,
  });
  if (resource.error && !resource.stale) {
    return (
      <ResourceError
        message={resource.error}
        requestId={resource.requestId}
        onRetry={() => void resource.refetch().catch(() => undefined)}
      />
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[1.9rem] font-semibold text-green-dark">Caja actual</h2>
        <p className={secondaryLabelClass("mt-1")}>
          Revisa la unidad vigente antes de cerrar. La consulta histórica no interviene.
        </p>
      </div>
      <ResourceStateNotice
        stale={resource.stale}
        partial={resource.partial}
        requestId={resource.requestId}
        onRetry={() => void resource.refetch().catch(() => undefined)}
      />
      {resource.data && !closeFresh ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-[1.3rem]"
        >
          <CircleAlert aria-hidden="true" />
          <div>
            <strong>Cierre bloqueado.</strong>
            <p>Actualiza correctamente la caja antes de continuar.</p>
          </div>
        </div>
      ) : null}
      {resource.loading ? (
        <Skeleton className="h-52 w-full rounded-md" />
      ) : resource.data ? (
        <CloseFlow
          summary={resource.data}
          freshnessEligible={closeFresh}
          filters={filters}
          role={role}
          concessionId={concessionId}
          branchId={branchId}
          generatedBy={generatedBy}
          onClosed={onClosed}
          onRefresh={onRefresh}
          onHistory={onHistory}
          onDashboard={onDashboard}
        />
      ) : (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>No hay una caja disponible</CardTitle>
            <CardDescription>
              Verifica que exista una asignación activa.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function HistorySection({
  resource,
  page,
  limit,
  status,
  businessDate,
  concessionNames,
  branchNames,
  sellerNames,
  canAudit,
  generatedBy,
  onPrevious,
  onNext,
  onLimitChange,
  onStatusChange,
  onBusinessDateChange,
}: {
  resource: ReturnType<typeof useCorteHistory>;
  page: number;
  limit: 25 | 50 | 100 | 200;
  status: string;
  businessDate: string;
  concessionNames: Record<string, string>;
  branchNames: Record<string, string>;
  sellerNames: Record<string, string>;
  canAudit: boolean;
  generatedBy?: string;
  onPrevious: () => void;
  onNext: () => void;
  onLimitChange: (limit: 25 | 50 | 100 | 200) => void;
  onStatusChange: (status: string) => void;
  onBusinessDateChange: (businessDate: string) => void;
}) {
  const [selected, setSelected] = useState<CorteHistoryItem | null>(null);
  const pdfExport = useCortePdfExport();
  const filtered = filterCorteHistory(resource.data.items, { status, businessDate });
  const downloadPdf = async (corte: CorteHistoryItem) => {
    await pdfExport.run(`history-${corte.id}`, async () => {
      const { downloadCorteHistoricoPdf } = await import("@/lib/cortes-pdf");
      downloadCorteHistoricoPdf(
        corte,
        {
          concesion: concessionNames[corte.concesionId],
          sucursal: corte.sucursalId ? branchNames[corte.sucursalId] : undefined,
          caja: corte.cajaNombre ?? corte.cajaId ?? undefined,
          vendedor: corte.idUser ? sellerNames[corte.idUser] : undefined,
        },
        "historical-cut",
        { generatedBy },
      );
    });
  };
  if (resource.error && !resource.stale) {
    return (
      <ResourceError
        message={resource.error}
        requestId={resource.requestId}
        onRetry={() => void resource.refetch().catch(() => undefined)}
      />
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[1.9rem] font-semibold text-green-dark">Historial</h2>
        <p className={secondaryLabelClass("mt-1")}>
          Cortes ordenados por fecha con paginación del servidor.
        </p>
      </div>
      {pdfExport.error ? (
        <p
          id="corte-history-pdf-error"
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-[1.3rem] text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {pdfExport.error}
        </p>
      ) : null}
      <ResourceStateNotice
        stale={resource.stale}
        partial={resource.partial}
        requestId={resource.requestId}
        onRetry={() => void resource.refetch().catch(() => undefined)}
      />
      <div className="grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-3">
        <Field label="Estado" htmlFor="corte-history-status">
          <NativeSelect
            id="corte-history-status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="CERRADO">Cerrado</option>
            <option value="AJUSTADO">Ajustado</option>
            <option value="ANULADO">Anulado</option>
            <option value="REABIERTO">Reabierto</option>
            <option value="OTRO">Otro</option>
          </NativeSelect>
        </Field>
        <Field label="Fecha operativa" htmlFor="corte-history-date">
          <Input
            id="corte-history-date"
            name="historyBusinessDate"
            type="date"
            value={businessDate}
            onChange={(event) => onBusinessDateChange(event.target.value)}
          />
        </Field>
        <Field label="Ventana cargada" htmlFor="corte-history-limit">
          <NativeSelect
            id="corte-history-limit"
            value={String(limit)}
            onChange={(event) =>
              onLimitChange(Number(event.target.value) as 25 | 50 | 100 | 200)
            }
          >
            <option value="25">25 registros</option>
            <option value="50">50 registros</option>
            <option value="100">100 registros</option>
            <option value="200">200 registros</option>
          </NativeSelect>
        </Field>
      </div>
      <DataTable<CorteHistoryItem>
        loading={resource.loading}
        data={filtered}
        getRowKey={(corte) => corte.id}
        emptyMessage="No hay cortes para los filtros seleccionados."
        columns={[
          {
            key: "folio",
            header: "Folio",
            cell: (corte) => <span className="font-medium">{corte.id}</span>,
          },
          {
            key: "fecha",
            header: "Fecha",
            cell: (corte) => formatBusinessDate(corte.businessDate ?? corte.fecha),
          },
          {
            key: "caja",
            header: "Caja",
            cell: (corte) => corte.cajaNombre ?? corte.cajaId ?? "N/D",
          },
          {
            key: "vendedor",
            header: "Vendedor",
            cell: (corte) =>
              corte.cajeroNombre ??
              (corte.idUser ? sellerNames[corte.idUser] ?? corte.idUser : "N/D"),
          },
          {
            key: "estado",
            header: "Estado",
            cell: (corte) => (
              <Badge variant={corte.estatus === "CERRADO" ? "secondary" : "outline"}>
                {corteLifecycleLabel(corte.estatus)}
              </Badge>
            ),
          },
          {
            key: "venta",
            header: "Ventas netas",
            cell: (corte) => (
              <span className="font-medium tabular-nums">
                {corte.availability?.ventasNetas && corte.ventasNetas !== undefined
                  ? formatPrice(corte.ventasNetas)
                  : "N/D"}
              </span>
            ),
          },
          {
            key: "acciones",
            header: "Acciones",
            cell: (corte) => {
              const exportId = `history-${corte.id}`;
              const isExporting = pdfExport.activeId === exportId;
              return (
                <div className="flex gap-2">
                  <Button
                    className="min-h-11"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelected(corte)}
                  >
                    <Eye data-icon="inline-start" aria-hidden="true" />
                    Detalle
                  </Button>
                  <Button
                    className="min-h-11"
                    size="sm"
                    variant="outline"
                    disabled={pdfExport.exporting}
                    aria-busy={isExporting}
                    onClick={() => void downloadPdf(corte)}
                  >
                    {isExporting ? (
                      <LoaderCircle
                        data-icon="inline-start"
                        className="animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    ) : (
                      <FileDown data-icon="inline-start" aria-hidden="true" />
                    )}
                    PDF
                  </Button>
                </div>
              );
            },
          },
        ]}
      />
      {!resource.loading && (resource.data.count > 0 || page > 1) ? (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={secondaryLabelClass()} aria-live="polite">
            Página {page} · {resource.data.count} de hasta {limit} registros
          </p>
          <div className="flex gap-2">
            <Button
              className="min-h-11"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={onPrevious}
            >
              Anterior
            </Button>
            <Button
              className="min-h-11"
              variant="outline"
              size="sm"
              disabled={!resource.data.meta.hasMore || !resource.data.meta.nextCursor}
              onClick={onNext}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
      <CorteDetalleDialog
        corte={selected}
        open={Boolean(selected)}
        canAudit={canAudit}
        generatedBy={generatedBy}
        labels={
          selected
            ? {
                concesion: concessionNames[selected.concesionId],
                sucursal: selected.sucursalId
                  ? branchNames[selected.sucursalId]
                  : undefined,
                vendedor: selected.idUser ? sellerNames[selected.idUser] : undefined,
              }
            : undefined
        }
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

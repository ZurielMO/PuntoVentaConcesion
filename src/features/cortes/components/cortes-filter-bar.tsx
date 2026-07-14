"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Info, RefreshCw, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { canEditCorteFilter, type CorteAccessModel } from "../role-access";
import type { CorteFilterKey, CorteSection, CorteUrlState } from "../contracts";
import { formatBusinessDate } from "../formatters";
import { secondaryLabelClass } from "./cortes-status";

export type FilterMode = "operacion" | "historico";

type Option = { id: string; label: string };

type CortesFilterBarProps = {
  access: CorteAccessModel;
  section: CorteSection;
  urlState: CorteUrlState;
  scopeLabel: string;
  branchLabel?: string;
  sellerFilterName?: string;
  userDisplayName?: string;
  userRoleLabel: string;
  lastUpdatedAt?: Date;
  jornadas: Array<{ jornadaId: string; etiqueta: string; fecha: string }>;
  jornadasLoading: boolean;
  concessions: Option[];
  sucursales: Option[];
  cajas: Option[];
  users: Option[];
  inventarios: Option[];
  onUpdateFilter: (filter: CorteFilterKey, value: string) => void;
  onHistoryViewChange: (patch: { jornadaId?: string; businessDate?: string }) => void;
  onRefresh: () => void;
  onClear: () => void;
};

function HelpTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex text-foreground/50 hover:text-foreground"
          aria-label="Más información"
        >
          <Info className="size-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-[1.2rem]">{text}</TooltipContent>
    </Tooltip>
  );
}

function OperationalFields(props: {
  access: CorteAccessModel;
  urlState: CorteUrlState;
  concessions: Option[];
  sucursales: Option[];
  cajas: Option[];
  users: Option[];
  onUpdateFilter: (filter: CorteFilterKey, value: string) => void;
}) {
  const { access, urlState, concessions, sucursales, cajas, users, onUpdateFilter } = props;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {canEditCorteFilter(access, "concesionId") ? (
        <Field label="Concesión" htmlFor="corte-concesion">
          <NativeSelect
            id="corte-concesion"
            value={urlState.filters.concesionId ?? ""}
            onChange={(e) => onUpdateFilter("concesionId", e.target.value)}
          >
            <option value="">Todas las concesiones</option>
            {concessions.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      {canEditCorteFilter(access, "sucursalId") ? (
        <Field label="Sucursal" htmlFor="corte-sucursal">
          <NativeSelect
            id="corte-sucursal"
            value={urlState.filters.sucursalId ?? ""}
            onChange={(e) => onUpdateFilter("sucursalId", e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      {canEditCorteFilter(access, "cajaId") ? (
        <Field label="Caja" htmlFor="corte-caja">
          <NativeSelect
            id="corte-caja"
            value={urlState.filters.cajaId ?? ""}
            disabled={!urlState.filters.sucursalId}
            onChange={(e) => onUpdateFilter("cajaId", e.target.value)}
          >
            <option value="">Todas las cajas</option>
            {cajas.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      {canEditCorteFilter(access, "idUser") ? (
        <Field label="Vendedor" htmlFor="corte-vendedor">
          <NativeSelect
            id="corte-vendedor"
            value={urlState.filters.idUser ?? ""}
            onChange={(e) => onUpdateFilter("idUser", e.target.value)}
          >
            <option value="">Todos los vendedores</option>
            {users.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
    </div>
  );
}

function HistoricalFields(props: {
  access: CorteAccessModel;
  urlState: CorteUrlState;
  jornadas: Array<{ jornadaId: string; etiqueta: string; fecha: string }>;
  jornadasLoading: boolean;
  inventarios: Option[];
  onHistoryViewChange: (patch: { jornadaId?: string; businessDate?: string }) => void;
  onUpdateFilter: (filter: CorteFilterKey, value: string) => void;
}) {
  const { access, urlState, jornadas, jornadasLoading, inventarios, onHistoryViewChange, onUpdateFilter } = props;
  const fechas = useMemo(
    () => Array.from(new Set(jornadas.map((item) => item.fecha))),
    [jornadas],
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Field label="Jornada" htmlFor="corte-jornada">
        <NativeSelect
          id="corte-jornada"
          value={urlState.filters.jornadaId ?? ""}
          disabled={jornadasLoading}
          onChange={(e) => {
            const jornadaId = e.target.value;
            const fecha = jornadas.find((item) => item.jornadaId === jornadaId)?.fecha ?? "";
            onHistoryViewChange({ jornadaId, businessDate: fecha });
          }}
        >
          <option value="">
            {jornadasLoading ? "Cargando jornadas…" : "Selecciona jornada"}
          </option>
          {jornadas.map((jornada) => (
            <option key={jornada.jornadaId} value={jornada.jornadaId}>
              {jornada.etiqueta}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Fecha operativa" htmlFor="corte-fecha-operativa">
        <NativeSelect
          id="corte-fecha-operativa"
          value={urlState.businessDate}
          onChange={(e) => onHistoryViewChange({ businessDate: e.target.value })}
        >
          <option value="">Todas en la ventana</option>
          {fechas.map((fecha) => (
            <option key={fecha} value={fecha}>{formatBusinessDate(fecha)}</option>
          ))}
        </NativeSelect>
      </Field>
      {canEditCorteFilter(access, "inventarioId") ? (
        <Field label="Inventario" htmlFor="corte-inventario">
          <NativeSelect
            id="corte-inventario"
            value={urlState.filters.inventarioId ?? ""}
            onChange={(e) => onUpdateFilter("inventarioId", e.target.value)}
          >
            <option value="">Todos los inventarios</option>
            {inventarios.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
    </div>
  );
}

export function CortesFilterBar(props: CortesFilterBarProps) {
  const {
    access,
    section,
    urlState,
    scopeLabel,
    branchLabel,
    sellerFilterName,
    userDisplayName,
    userRoleLabel,
    lastUpdatedAt,
    jornadas,
    jornadasLoading,
    concessions,
    sucursales,
    cajas,
    users,
    inventarios,
    onUpdateFilter,
    onHistoryViewChange,
    onRefresh,
    onClear,
  } = props;

  const defaultMode: FilterMode =
    section === "resumen" || section === "caja-actual" ? "operacion" : "historico";
  const [mode, setMode] = useState<FilterMode>(defaultMode);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setCompact(!entry.isIntersecting),
      { rootMargin: "-8px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const selectedJornada = jornadas.find((j) => j.jornadaId === urlState.filters.jornadaId);
  const compactSummary = [
    scopeLabel,
    selectedJornada
      ? `Jornada ${selectedJornada.etiqueta.replace(/^Jornada\s*/i, "") || selectedJornada.jornadaId}`
      : urlState.filters.jornadaId
        ? "Jornada seleccionada"
        : null,
    urlState.businessDate
      ? formatBusinessDate(urlState.businessDate)
      : selectedJornada?.fecha
        ? formatBusinessDate(selectedJornada.fecha)
        : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const fields = mode === "operacion" ? (
    <OperationalFields
      access={access}
      urlState={urlState}
      concessions={concessions}
      sucursales={sucursales}
      cajas={cajas}
      users={users}
      onUpdateFilter={onUpdateFilter}
    />
  ) : (
    <HistoricalFields
      access={access}
      urlState={urlState}
      jornadas={jornadas}
      jornadasLoading={jornadasLoading}
      inventarios={inventarios}
      onHistoryViewChange={onHistoryViewChange}
      onUpdateFilter={onUpdateFilter}
    />
  );

  const modeToggle = (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Modo de filtros">
      <Button
        type="button"
        size="sm"
        variant={mode === "operacion" ? "default" : "outline"}
        className="min-h-11"
        onClick={() => setMode("operacion")}
      >
        Operación actual
      </Button>
      <HelpTip text="Filtros de resumen y cierre. El servidor resuelve la jornada vigente." />
      <Button
        type="button"
        size="sm"
        variant={mode === "historico" ? "default" : "outline"}
        className="min-h-11"
        onClick={() => setMode("historico")}
      >
        Consulta histórica
      </Button>
      <HelpTip text="Filtros de reporte, inventario e historial. No cambian la caja actual." />
    </div>
  );

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={onRefresh}>
        <RefreshCw data-icon="inline-start" aria-hidden="true" />
        Actualizar
      </Button>
      <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={onClear}>
        <RotateCcw data-icon="inline-start" aria-hidden="true" />
        Limpiar
      </Button>
    </div>
  );

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
      {compact ? (
        <div className="sticky top-0 z-20 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 shadow-[var(--nav-shadow)]">
          <p className="min-w-0 truncate text-[1.35rem] font-medium text-green-dark">
            {compactSummary || scopeLabel}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setSheetOpen(true)}
            >
              <Filter data-icon="inline-start" aria-hidden="true" />
              Filtros
            </Button>
            {actions}
          </div>
        </div>
      ) : (
        <div className="mb-5 flex flex-col gap-4 rounded-[var(--card-radius)] border border-border bg-card p-4 shadow-[var(--nav-shadow)] md:sticky md:top-0 md:z-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{scopeLabel}</Badge>
              {branchLabel ? <Badge variant="outline">{branchLabel}</Badge> : null}
              {sellerFilterName ? (
                <Badge variant="outline">Filtro: {sellerFilterName}</Badge>
              ) : null}
              {userDisplayName ? (
                <Badge variant="outline">
                  {userDisplayName} · {userRoleLabel}
                </Badge>
              ) : (
                <Badge variant="outline">{userRoleLabel}</Badge>
              )}
            </div>
            <div className={secondaryLabelClass("flex flex-wrap items-center gap-3")}>
              <span aria-live="polite">
                {lastUpdatedAt
                  ? `Actualizado ${lastUpdatedAt.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Sin actualización"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 md:hidden"
                onClick={() => setSheetOpen(true)}
              >
                <Filter data-icon="inline-start" aria-hidden="true" />
                Filtros
              </Button>
              <div className="hidden md:flex">{actions}</div>
            </div>
          </div>

          <div className="hidden flex-col gap-3 md:flex">
            {modeToggle}
            {fields}
          </div>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-4 px-1 pb-6">
            {modeToggle}
            {fields}
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {actions}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

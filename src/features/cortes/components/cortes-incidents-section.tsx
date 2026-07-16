"use client";

import { useMemo, useState } from "react";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import AnimatedList from "@/components/animated-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import type { CorteSection, CorteUiIncident } from "../contracts";
import { secondaryLabelClass } from "./cortes-status";

const ACTIONABLE_CODES = new Set([
  "CASH_DIFFERENCE",
  "INVENTORY_DIFFERENCE",
  "UNCLASSIFIED_ZERO_PRICE",
  "PARTIAL_REFUND_SPLIT_REQUIRED",
  "CORTE_PENDING",
  "CONCILIATION_ERROR",
  "RECONCILIATION_ERROR",
]);

function isActionable(incident: CorteUiIncident) {
  if (ACTIONABLE_CODES.has(incident.code)) return true;
  const code = incident.code.toUpperCase();
  return (
    code.includes("DIFFERENCE") ||
    code.includes("PENDING") ||
    code.includes("ZERO_PRICE") ||
    code.includes("REFUND") ||
    code.includes("CONCILI") ||
    code.includes("RECONCIL")
  );
}

export function CortesIncidentsSection({
  incidents,
  loading,
  error,
  stale,
  requestId,
  onRetry,
  onNavigate,
}: {
  incidents: CorteUiIncident[];
  loading?: boolean;
  error?: string | null;
  stale?: boolean;
  requestId?: string | null;
  onRetry?: () => void;
  onNavigate: (section: CorteSection) => void;
}) {
  const [selected, setSelected] = useState<CorteUiIncident | null>(null);
  const actionable = useMemo(
    () => incidents.filter(isActionable),
    [incidents],
  );

  const items = useMemo(
    () =>
      actionable.map((incident) => {
        const Icon =
          incident.severity === "critical"
            ? CircleAlert
            : incident.severity === "warning"
              ? TriangleAlert
              : Info;
        const severityLabel =
          incident.severity === "critical"
            ? "Crítica"
            : incident.severity === "warning"
              ? "Advertencia"
              : "Informativa";
        const amountLabel =
          incident.amount == null
            ? null
            : incident.code === "CASH_DIFFERENCE"
              ? formatPrice(incident.amount)
              : incident.amount.toLocaleString("es-MX", { signDisplay: "always" });

        return {
          id: incident.id,
          content: (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <span
                  className={
                    incident.severity === "critical"
                      ? "text-destructive"
                      : "text-amber-700 dark:text-amber-400"
                  }
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{incident.title}</p>
                    <Badge
                      variant={
                        incident.severity === "critical" ? "destructive" : "outline"
                      }
                    >
                      {severityLabel}
                    </Badge>
                  </div>
                  {amountLabel ? (
                    <p className={secondaryLabelClass("mt-1")}>Diferencia: {amountLabel}</p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                className="shrink-0 min-h-11"
                variant="outline"
                size="sm"
                onClick={() => setSelected(incident)}
              >
                Ver
              </Button>
            </div>
          ),
        };
      }),
    [actionable],
  );

  if (error && !stale) {
    return (
      <Card role="alert" className="border-destructive/20 shadow-none">
        <CardHeader>
          <CardTitle className="text-destructive">No fue posible cargar incidencias</CardTitle>
          <CardDescription>{error}</CardDescription>
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          ) : null}
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[1.9rem] font-semibold text-green-dark">Incidencias</h2>
        <p className={secondaryLabelClass("mt-1")}>
          Solo problemas accionables de la jornada seleccionada.
        </p>
        {requestId && stale ? (
          <p className={secondaryLabelClass("mt-1")}>Referencia: {requestId}</p>
        ) : null}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : items.length ? (
        <AnimatedList
          items={items}
          height="auto"
          autoAddDelay={0}
          maxItems={items.length}
          startFrom="top"
          animationType="fade"
          enterFrom="bottom"
          duration={0.2}
          fadeEdges={false}
          itemGap={10}
          ariaLabel="Incidencias accionables"
        />
      ) : (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-[1.6rem]">No hay incidencias pendientes.</CardTitle>
          </CardHeader>
        </Card>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected?.title ?? "Incidencia"}</SheetTitle>
          </SheetHeader>
          {selected ? (
            <div className="mt-4 flex flex-col gap-4 px-1 pb-6">
              <p className="text-[1.35rem]">{selected.description}</p>
              <p className={secondaryLabelClass()}>Origen: {selected.source}</p>
              {selected.amount != null ? (
                <p className="font-medium tabular-nums">
                  {selected.code === "CASH_DIFFERENCE"
                    ? formatPrice(selected.amount)
                    : selected.amount.toLocaleString("es-MX", { signDisplay: "always" })}
                </p>
              ) : null}
              <Button
                type="button"
                className="min-h-11"
                variant="outline"
                onClick={() => {
                  onNavigate(selected.section);
                  setSelected(null);
                }}
              >
                Ir a {selected.section}
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function filterActionableIncidents(incidents: CorteUiIncident[]) {
  return incidents.filter(isActionable);
}

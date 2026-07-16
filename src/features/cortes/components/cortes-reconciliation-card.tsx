"use client";

import { useState } from "react";
import { Boxes, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import type { CorteInventoryRow, CorteSummary } from "../contracts";
import { StatusBadge, secondaryLabelClass, type CorteStatusTone } from "./cortes-status";

export type ReconciliationViewModel = {
  ventasEfectivo?: number | null;
  efectivoContado?: number | null;
  diferenciaCaja?: number | null;
  hasCashSale?: boolean;
  hasCashCount?: boolean;
  unidadesVendidas?: number | null;
  hasInventoryMetric?: boolean;
  comisionImporte?: number | null;
  comisionBase?: number | null;
  hasCommission?: boolean;
};

export function reconciliationFromSummary(
  summary: CorteSummary | null,
): ReconciliationViewModel | null {
  if (!summary) return null;
  return {
    ventasEfectivo:
      summary.availability?.totalEfectivo === false ? null : summary.totalEfectivo,
    efectivoContado:
      summary.availability?.efectivoContado === false
        ? null
        : summary.efectivoContado,
    diferenciaCaja:
      summary.availability?.diferenciaCaja === false
        ? null
        : summary.diferenciaCaja,
    hasCashSale: summary.availability?.totalEfectivo !== false,
    hasCashCount:
      summary.availability?.efectivoContado !== false &&
      summary.efectivoContado != null,
    unidadesVendidas:
      summary.availability?.inventario === false || !summary.inventario
        ? null
        : summary.inventario.unidadesVendidas,
    hasInventoryMetric: summary.availability?.inventario !== false && Boolean(summary.inventario),
    comisionImporte:
      summary.availability?.comision === false || !summary.comision
        ? null
        : summary.comision.importeComision,
    comisionBase:
      summary.availability?.comision === false || !summary.comision
        ? null
        : summary.comision.baseComision,
    hasCommission: summary.availability?.comision !== false && Boolean(summary.comision),
  };
}

function cashState(model: ReconciliationViewModel): {
  tone: CorteStatusTone;
  label: string;
  detail: string;
} {
  if (!model.hasCashCount) {
    return { tone: "pending", label: "Conteo pendiente", detail: "Aún no hay efectivo contado." };
  }
  if (model.diferenciaCaja == null) {
    return { tone: "pending", label: "Pendiente", detail: "Sin diferencia calculada." };
  }
  if (model.diferenciaCaja === 0) {
    return { tone: "ok", label: "Correcto", detail: "Sin diferencia de caja." };
  }
  return {
    tone: "issue",
    label: "Requiere revisión",
    detail: `Diferencia ${formatPrice(model.diferenciaCaja)}`,
  };
}

function inventoryState(
  model: ReconciliationViewModel,
  inventoryRows: CorteInventoryRow[],
): { tone: CorteStatusTone; label: string; detail: string } {
  const diffs = inventoryRows.filter((row) => row.diferencia != null && row.diferencia !== 0);
  if (diffs.length > 0) {
    return {
      tone: "issue",
      label: "Requiere revisión",
      detail: `${diffs.length} diferencia(s) físicas`,
    };
  }
  if (!model.hasInventoryMetric && inventoryRows.length === 0) {
    return { tone: "neutral", label: "Sin datos", detail: "Sin conciliación física." };
  }
  const hasPhysical = inventoryRows.some((row) => row.diferencia != null);
  if (!hasPhysical) {
    return { tone: "pending", label: "Pendiente", detail: "Sin conciliación física." };
  }
  return { tone: "ok", label: "Correcto", detail: "Inventario conciliado." };
}

function commissionState(model: ReconciliationViewModel): {
  tone: CorteStatusTone;
  label: string;
  detail: string;
} {
  if (!model.hasCommission || model.comisionImporte == null) {
    return { tone: "neutral", label: "Sin datos", detail: "Comisión no disponible." };
  }
  return {
    tone: "ok",
    label: "Calculada correctamente",
    detail: formatPrice(model.comisionImporte),
  };
}

export function CortesReconciliationCard({
  model,
  inventoryRows,
  onInventory,
}: {
  model: ReconciliationViewModel | null;
  inventoryRows: CorteInventoryRow[];
  onInventory: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!model) return null;

  const cash = cashState(model);
  const inventory = inventoryState(model, inventoryRows);
  const commission = commissionState(model);

  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
          <CardTitle className="text-[1.6rem]">Conciliación</CardTitle>
          <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setOpen(true)}>
            Ver detalle
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[1.3rem] font-medium">
              <CircleDollarSign className="size-4" aria-hidden="true" />
              Caja
            </div>
            <StatusBadge tone={cash.tone}>{cash.label}</StatusBadge>
            <p className={secondaryLabelClass()}>{cash.detail}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[1.3rem] font-medium">
              <Boxes className="size-4" aria-hidden="true" />
              Inventario
            </div>
            <StatusBadge tone={inventory.tone}>{inventory.label}</StatusBadge>
            <p className={secondaryLabelClass()}>{inventory.detail}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="text-[1.3rem] font-medium">Comisión</div>
            <StatusBadge tone={commission.tone}>{commission.label}</StatusBadge>
            <p className={secondaryLabelClass()}>{commission.detail}</p>
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalle de conciliación</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-5 px-1 pb-6">
            <section>
              <h3 className="mb-2 text-[1.4rem] font-semibold">Caja</h3>
              <dl className="grid gap-2 text-[1.3rem]">
                <div className="flex justify-between gap-3">
                  <dt className={secondaryLabelClass()}>Ventas en efectivo</dt>
                  <dd className="tabular-nums">
                    {model.ventasEfectivo == null
                      ? "Sin dato"
                      : formatPrice(model.ventasEfectivo)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className={secondaryLabelClass()}>Efectivo contado</dt>
                  <dd className="tabular-nums">
                    {!model.hasCashCount || model.efectivoContado == null
                      ? "Conteo pendiente"
                      : formatPrice(model.efectivoContado)}
                  </dd>
                </div>
                {model.hasCashCount && model.diferenciaCaja != null ? (
                  <div className="flex justify-between gap-3">
                    <dt className={secondaryLabelClass()}>Diferencia de caja</dt>
                    <dd className="font-medium tabular-nums">
                      {formatPrice(model.diferenciaCaja)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
            <section>
              <h3 className="mb-2 text-[1.4rem] font-semibold">Inventario</h3>
              <p className={secondaryLabelClass("mb-2")}>
                {model.unidadesVendidas == null
                  ? "Sin datos de inventario."
                  : `${model.unidadesVendidas} unidad(es) vendidas`}
              </p>
              <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={onInventory}>
                Abrir inventario
              </Button>
            </section>
            <section>
              <h3 className="mb-2 text-[1.4rem] font-semibold">Comisión</h3>
              <dl className="grid gap-2 text-[1.3rem]">
                <div className="flex justify-between gap-3">
                  <dt className={secondaryLabelClass()}>Importe</dt>
                  <dd className="tabular-nums">
                    {model.comisionImporte == null
                      ? "Sin dato"
                      : formatPrice(model.comisionImporte)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className={secondaryLabelClass()}>Base</dt>
                  <dd className="tabular-nums">
                    {model.comisionBase == null
                      ? "Sin dato"
                      : formatPrice(model.comisionBase)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

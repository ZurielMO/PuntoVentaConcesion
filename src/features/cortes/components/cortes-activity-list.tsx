"use client";

import { useMemo, useState } from "react";
import AnimatedList from "@/components/animated-list";
import { CorteDetalleDialog } from "@/components/dashboard/corte-detalle-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { CorteHistoryItem } from "../contracts";
import { corteLifecycleLabel, formatBusinessDate } from "../formatters";
import { resolveHistoricalMoneyValue } from "../view-models";
import { secondaryLabelClass } from "./cortes-status";

function money(cut: CorteHistoryItem) {
  const value = resolveHistoricalMoneyValue(
    cut.availability?.dineroReal,
    cut.dineroReal ?? cut.totalReal,
  );
  return value == null ? "N/D" : formatPrice(value);
}

export function CortesActivityList({
  cuts,
  concessionNames,
  branchNames,
  sellerNames,
  canAudit,
  generatedBy,
  onOpenHistory,
}: {
  cuts: CorteHistoryItem[];
  concessionNames?: Record<string, string>;
  branchNames?: Record<string, string>;
  sellerNames?: Record<string, string>;
  canAudit?: boolean;
  generatedBy?: string;
  onOpenHistory: () => void;
}) {
  const [selected, setSelected] = useState<CorteHistoryItem | null>(null);
  const limited = cuts.slice(0, 5);

  const items = useMemo(
    () =>
      limited.map((cut) => ({
        id: cut.id,
        content: (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[1.3rem] font-medium">
                {cut.cajaNombre ??
                  (cut.concesionId && concessionNames?.[cut.concesionId]) ??
                  cut.cajaId ??
                  "Caja sin nombre"}
              </p>
              <p className={secondaryLabelClass()}>
                {formatBusinessDate(cut.businessDate ?? cut.fecha)} ·{" "}
                {corteLifecycleLabel(cut.estatus)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[1.3rem] font-semibold tabular-nums">
                {money(cut)}
              </span>
              <Badge variant="outline">{corteLifecycleLabel(cut.estatus)}</Badge>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11"
                onClick={() => setSelected(cut)}
              >
                Ver
              </Button>
            </div>
          </div>
        ),
      })),
    [concessionNames, limited],
  );

  if (limited.length === 0) return null;

  return (
    <section aria-labelledby="actividad-reciente-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="actividad-reciente-title" className="text-[1.6rem] font-semibold text-green-dark">
            Actividad reciente
          </h3>
          <p className={secondaryLabelClass()}>Últimos cortes de este alcance.</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={onOpenHistory}>
          Abrir historial
        </Button>
      </div>
      <AnimatedList
        items={items}
        height="auto"
        autoAddDelay={0}
        maxItems={5}
        startFrom="top"
        animationType="fade"
        enterFrom="bottom"
        duration={0.2}
        fadeEdges={false}
        itemGap={8}
        ariaLabel="Cortes recientes"
      />
      <CorteDetalleDialog
        corte={selected}
        open={Boolean(selected)}
        canAudit={canAudit}
        generatedBy={generatedBy}
        labels={
          selected
            ? {
                concesion: concessionNames?.[selected.concesionId],
                sucursal: selected.sucursalId
                  ? branchNames?.[selected.sucursalId]
                  : undefined,
                vendedor: selected.idUser
                  ? sellerNames?.[selected.idUser]
                  : undefined,
              }
            : undefined
        }
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </section>
  );
}

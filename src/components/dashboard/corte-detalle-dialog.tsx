import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleAlert, FileDown, LoaderCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { CorteHistoryItem, CorteMetricKey } from "@/features/cortes/contracts";
import { useCortePdfExport } from "@/features/cortes/components/use-pdf-export";
import {
  corteCalculationLabel,
  corteLifecycleLabel,
  formatBusinessDate,
  formatCorteTimestamp,
} from "@/features/cortes/formatters";

const available = (corte: CorteHistoryItem, key: CorteMetricKey, value: unknown) =>
  corte.availability?.[key] ?? (value !== null && value !== undefined);

const money = (corte: CorteHistoryItem, key: CorteMetricKey, value?: number | null) =>
  available(corte, key, value) && value != null ? formatPrice(value) : "N/D";

const quantity = (corte: CorteHistoryItem, key: CorteMetricKey, value?: number | null) =>
  available(corte, key, value) && value != null ? value.toLocaleString("es-MX") : "N/D";

type CorteDetalleDialogProps = {
  corte: CorteHistoryItem | null;
  open: boolean;
  canAudit?: boolean;
  generatedBy?: string;
  labels?: { concesion?: string; sucursal?: string; vendedor?: string };
  onOpenChange: (open: boolean) => void;
};

export function CorteDetalleDialog({
  corte,
  open,
  canAudit = false,
  generatedBy,
  labels,
  onOpenChange,
}: CorteDetalleDialogProps) {
  const pdfExport = useCortePdfExport();
  const downloadPdf = async () => {
    if (!corte) return;
    await pdfExport.run("corte-detail", async () => {
      const { downloadCorteHistoricoPdf } = await import("@/lib/cortes-pdf");
      downloadCorteHistoricoPdf(corte, labels, "historical-cut", { generatedBy });
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,56rem)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)]">
        <DialogHeader className="shrink-0 border-b border-neutral-cool px-4 py-4 pr-12 sm:px-6">
          <DialogTitle className="text-left text-[1.8rem] sm:text-[2rem]">
            Detalle del corte
          </DialogTitle>
          <DialogDescription className="text-left">
            {corte
              ? `Corte del ${formatBusinessDate(corte.businessDate ?? corte.fecha)} · ${corteLifecycleLabel(corte.estatus)}${
                  corte.cajaNombre ? ` · ${corte.cajaNombre}` : ""
                }`
              : "Sin corte seleccionado"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {corte ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={corte.estatus === "CERRADO" ? "secondary" : "outline"}>{corteLifecycleLabel(corte.estatus)}</Badge>
                <Badge variant="outline">{corteCalculationLabel(corte.calculationVersion)}</Badge>
                <Badge variant="outline">{corte.hasAuthoritativeSnapshot ? "Snapshot versionado" : "Compatibilidad legacy"}</Badge>
              </div>
              <dl className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-[1.2rem] text-muted-foreground">Dinero real</dt><dd className="font-semibold tabular-nums">{money(corte, "dineroReal", corte.dineroReal ?? corte.totalReal)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Efectivo</dt><dd className="font-semibold tabular-nums">{money(corte, "totalEfectivo", corte.totalEfectivo ?? corte.totalCaja)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Tarjeta</dt><dd className="font-semibold tabular-nums">{money(corte, "totalTarjeta", corte.totalTarjeta)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Valor con puntos</dt><dd className="font-semibold tabular-nums">{money(corte, "totalPuntosMonto", corte.totalPuntosMonto)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Tickets</dt><dd className="font-semibold tabular-nums">{quantity(corte, "cantidadVentas", corte.cantidadVentas)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Efectivo esperado</dt><dd className="font-semibold tabular-nums">{money(corte, "efectivoEsperado", corte.efectivoEsperado)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Efectivo contado</dt><dd className="font-semibold tabular-nums">{money(corte, "efectivoContado", corte.efectivoContado)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Diferencia</dt><dd className="font-semibold tabular-nums">{money(corte, "diferenciaCaja", corte.diferenciaCaja)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Comisión</dt><dd className="font-semibold tabular-nums">{money(corte, "comision", corte.comision?.importeComision)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Ajustes</dt><dd className="font-semibold tabular-nums">{money(corte, "ajustes", corte.ajustes)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Inventario</dt><dd className="font-semibold">{available(corte, "inventario", corte.inventario) && corte.inventario ? `${corte.inventario.items.length} producto(s)` : "N/D"}</dd></div>
              </dl>
              {pdfExport.error ? (
                <p id="corte-detail-pdf-error" role="alert" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-[1.3rem] text-destructive">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {pdfExport.error}
                </p>
              ) : null}
              <Button
                className="min-h-11 w-fit"
                variant="outline"
                disabled={pdfExport.exporting}
                aria-busy={pdfExport.exporting}
                aria-describedby={pdfExport.error ? "corte-detail-pdf-error" : undefined}
                onClick={() => void downloadPdf()}
              >
                {pdfExport.exporting ? <LoaderCircle data-icon="inline-start" className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <FileDown data-icon="inline-start" aria-hidden="true" />}
                {pdfExport.exporting ? "Generando resumen…" : "Descargar resumen PDF"}
              </Button>
            </div>
          ) : null}
          {corte?.comentarios && (
            <p className="mt-4 rounded-sm bg-neutral-cool p-3 text-[1.3rem] leading-snug text-muted-foreground sm:text-[1.4rem]">
              {corte.comentarios}
            </p>
          )}
          {corte && canAudit ? (
            <section className="mt-5 border-t border-border pt-4" aria-labelledby="corte-audit-title">
              <h3 id="corte-audit-title" className="text-[1.5rem] font-semibold">Auditoría disponible</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><dt className="text-[1.2rem] text-muted-foreground">Folio</dt><dd className="break-all font-medium">{corte.id}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Generado</dt><dd>{formatCorteTimestamp(corte.generatedAt ?? corte.createdAt)}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Cerrado por</dt><dd>{corte.closedBy ?? "N/D"}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Comprobantes</dt><dd>{corte.conteoComprobantes == null ? "N/D" : corte.conteoComprobantes.toLocaleString("es-MX")}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Concesión</dt><dd>{labels?.concesion ?? corte.concesionId ?? "N/D"}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Sucursal</dt><dd>{labels?.sucursal ?? corte.sucursalId ?? "N/D"}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Vendedor</dt><dd>{labels?.vendedor ?? corte.cajeroNombre ?? corte.idUser ?? "N/D"}</dd></div>
                <div><dt className="text-[1.2rem] text-muted-foreground">Inventario</dt><dd>{corte.inventarioId ?? "N/D"}</dd></div>
              </dl>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

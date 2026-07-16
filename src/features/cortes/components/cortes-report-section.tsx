"use client";

import dynamic from "next/dynamic";
import { CircleAlert, FileDown, Info, LoaderCircle } from "lucide-react";
import { CorteReporteComisionTable } from "@/components/dashboard/corte-reporte-comision-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatPrice } from "@/lib/format";
import {
  CircleDollarSign,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type {
  CorteHistoryItem,
  CorteInventoryRow,
  CorteReport,
  CorteSection,
  CorteUiIncident,
} from "../contracts";
import { corteCalculationLabel, formatBusinessDate } from "../formatters";
import { resolveHistoricalMoneyValue } from "../view-models";
import { useCortePdfExport } from "./use-pdf-export";
import { CortesProductosTable } from "./cortes-productos-table";
import { CortesReconciliationCard } from "./cortes-reconciliation-card";
import { MetodosCobroCollapse } from "./cortes-kpi-grid";
import { filterActionableIncidents } from "./cortes-incidents-section";
import { FadeInSection } from "./cortes-motion";
import { secondaryLabelClass } from "./cortes-status";

const OperationalComparison = dynamic(
  () => import("./corte-visualizations").then((m) => m.OperationalComparison),
  { ssr: false },
);

const historicalMoney = (available: boolean | undefined, value?: number) =>
  available && value !== undefined ? formatPrice(value) : "Sin dato";

const historicalQuantity = (available: boolean | undefined, value?: number) =>
  available && value !== undefined ? value.toLocaleString("es-MX") : "Sin dato";

const isZeroish = (available: boolean | undefined, value?: number) =>
  !available || value == null || value === 0;

function ReportMetric({
  title,
  values,
}: {
  title: string;
  values: Array<[string, string]>;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-[1.5rem]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          {values.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-3">
              <dt className={secondaryLabelClass()}>{label}</dt>
              <dd className="text-right font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function CortesReportSection({
  report,
  loading,
  error,
  stale,
  partial,
  requestId,
  concessionId,
  concessionName,
  branchName,
  cashboxName,
  sellerName,
  generatedBy,
  canDownloadConsolidated,
  inventoryRows,
  incidents,
  relatedCuts,
  onNavigate,
  onSelectConcession,
  onRetry,
}: {
  report: CorteReport | null;
  loading?: boolean;
  error?: string | null;
  stale?: boolean;
  partial?: boolean;
  requestId?: string | null;
  concessionId: string;
  concessionName?: string;
  branchName?: string;
  cashboxName?: string;
  sellerName?: string;
  generatedBy?: string;
  canDownloadConsolidated: boolean;
  inventoryRows: CorteInventoryRow[];
  incidents: CorteUiIncident[];
  relatedCuts: CorteHistoryItem[];
  onNavigate: (section: CorteSection) => void;
  onSelectConcession: (concessionId: string) => void;
  onRetry?: () => void;
}) {
  const pdfExport = useCortePdfExport();
  const income = report?.ingresos;
  const actionable = filterActionableIncidents(incidents);

  const downloadConcessionPdf = async () => {
    if (!report) return;
    await pdfExport.run("concession-report", async () => {
      const { downloadReporteConcesionPdf } = await import("@/lib/cortes-pdf");
      downloadReporteConcesionPdf(
        report,
        {
          concesion: concessionName ?? report.resumen[0]?.nombre ?? concessionId,
          sucursal: branchName,
          caja: cashboxName,
          vendedor: sellerName,
        },
        { generatedBy },
      );
    });
  };

  const downloadConsolidatedPdf = async () => {
    if (!report) return;
    await pdfExport.run("consolidated-report", async () => {
      const { downloadReporteConsolidadoPdf } = await import("@/lib/cortes-pdf");
      downloadReporteConsolidadoPdf(report, { generatedBy });
    });
  };

  if (error && !stale) {
    return (
      <Card role="alert" className="border-destructive/20 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <CircleAlert aria-hidden="true" />
            No fue posible cargar el reporte
          </CardTitle>
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

  const puntosZero =
    !income ||
    (isZeroish(income.availability.totalPuntosMonto, income.totalPuntosMonto) &&
      isZeroish(income.availability.totalPuntosCanjeados, income.totalPuntosCanjeados) &&
      isZeroish(income.availability.ventasConPuntos, income.ventasConPuntos) &&
      isZeroish(income.availability.abonados, income.abonados?.operaciones) &&
      isZeroish(income.availability.abonados, income.abonados?.unidades));

  const promoZero =
    !income ||
    (isZeroish(income.availability.promociones, income.promociones?.montoDescuento) &&
      isZeroish(income.availability.promociones, income.promociones?.unidadesGratis) &&
      isZeroish(income.availability.combos, income.combos?.montoTotal) &&
      isZeroish(income.availability.combos, income.combos?.cantidadVendidos));

  const otrosAllZero =
    !income ||
    (isZeroish(income.availability.combos, income.combos?.montoTotal) &&
      isZeroish(income.availability.cortesias, income.cortesias?.cantidad) &&
      isZeroish(income.availability.merma, income.merma?.cantidad) &&
      isZeroish(income.availability.cancelaciones, income.cancelaciones) &&
      isZeroish(income.availability.reembolsos, income.reembolsos));

  const paymentMethods = income
    ? [
        income.availability.totalEfectivo && income.totalEfectivo !== undefined
          ? { metodo: "efectivo", monto: income.totalEfectivo }
          : null,
        income.availability.totalTarjeta && income.totalTarjeta !== undefined
          ? { metodo: "tarjeta", monto: income.totalTarjeta }
          : null,
        income.availability.totalPuntosMonto && income.totalPuntosMonto !== undefined
          ? { metodo: "puntos", monto: income.totalPuntosMonto }
          : null,
      ].filter((entry): entry is { metodo: string; monto: number } => entry !== null)
    : [];

  const defaultAccordion = [
    ...(!puntosZero ? ["puntos"] : []),
    ...(!promoZero ? ["promos"] : []),
    ...(!otrosAllZero ? ["otros"] : []),
    ...(concessionId && report?.productos?.length ? ["productos"] : []),
  ];

  const historicalCutMoney = (cut: CorteHistoryItem) => {
    const value = resolveHistoricalMoneyValue(
      cut.availability?.dineroReal,
      cut.dineroReal ?? cut.totalReal,
    );
    return value == null ? "N/D" : formatPrice(value);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[1.9rem] font-semibold text-green-dark">Reporte de jornada</h2>
          <p className={secondaryLabelClass("mt-1 max-w-[70ch]")}>
            Resumen histórico de la jornada seleccionada.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {report && concessionId ? (
            <Button
              type="button"
              className="min-h-11"
              variant="outline"
              size="sm"
              disabled={pdfExport.exporting}
              onClick={() => void downloadConcessionPdf()}
            >
              {pdfExport.activeId === "concession-report" ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <FileDown data-icon="inline-start" aria-hidden="true" />
              )}
              PDF concesión
            </Button>
          ) : null}
          {report && canDownloadConsolidated ? (
            <Button
              type="button"
              className="min-h-11"
              variant="outline"
              size="sm"
              disabled={pdfExport.exporting}
              onClick={() => void downloadConsolidatedPdf()}
            >
              {pdfExport.activeId === "consolidated-report" ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <FileDown data-icon="inline-start" aria-hidden="true" />
              )}
              PDF consolidado
            </Button>
          ) : null}
        </div>
      </div>

      {pdfExport.error ? (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-[1.3rem] text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {pdfExport.error}
        </p>
      ) : null}

      {(stale || partial) && requestId ? (
        <p className={secondaryLabelClass()}>
          {stale ? "Datos desactualizados" : "Datos parciales"} · Ref: {requestId}
        </p>
      ) : null}

      {report ? (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Jornada {report.jornada.numero}</Badge>
          <Badge variant="outline">{formatBusinessDate(report.jornada.fecha)}</Badge>
        </div>
      ) : null}

      {loading ? (
        <>
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
        </>
      ) : report ? (
        <FadeInSection className="flex flex-col gap-6">
          {income ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-[1.6rem] font-semibold text-green-dark">
                Resumen financiero
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  compact
                  label="Ventas netas"
                  value={historicalMoney(
                    income.availability.ventasNetas ?? income.availability.ventaNeta,
                    income.ventasNetas ?? income.ventaNeta,
                  )}
                  icon={TrendingUp}
                />
                <StatCard
                  compact
                  label="Dinero real"
                  value={historicalMoney(income.availability.dineroReal, income.dineroReal)}
                  icon={WalletCards}
                />
                <StatCard
                  compact
                  label="Tickets y promedio"
                  value={`${historicalQuantity(income.availability.cantidadVentas, income.cantidadVentas)} · ${historicalMoney(income.availability.ticketPromedio, income.ticketPromedio)}`}
                  icon={ReceiptText}
                />
                <StatCard
                  compact
                  label="Comisión"
                  value={historicalMoney(
                    income.availability.comision,
                    income.comision?.importeComision,
                  )}
                  icon={CircleDollarSign}
                />
              </div>
              <MetodosCobroCollapse data={paymentMethods} />
            </section>
          ) : null}

          <CortesReconciliationCard
            model={
              income
                ? {
                    ventasEfectivo: income.availability.totalEfectivo
                      ? income.totalEfectivo ?? null
                      : null,
                    efectivoContado: null,
                    diferenciaCaja: null,
                    hasCashSale: Boolean(income.availability.totalEfectivo),
                    hasCashCount: false,
                    unidadesVendidas: income.availability.unidadesVendidas
                      ? income.unidadesVendidas ?? null
                      : null,
                    hasInventoryMetric: Boolean(income.availability.unidadesVendidas),
                    comisionImporte: income.availability.comision
                      ? income.comision?.importeComision ?? null
                      : null,
                    comisionBase: income.availability.comision
                      ? income.comision?.baseComision ?? null
                      : null,
                    hasCommission: Boolean(income.availability.comision && income.comision),
                  }
                : null
            }
            inventoryRows={inventoryRows}
            onInventory={() => onNavigate("inventario")}
          />

          <section className="flex flex-col gap-3">
            <h3 className="text-[1.6rem] font-semibold text-green-dark">
              {concessionId ? "Comisión" : "Resumen por concesión"}
            </h3>
            <CorteReporteComisionTable data={report.resumen} showTotals={!concessionId} />
            {!concessionId ? (
              <OperationalComparison report={report} onSelect={onSelectConcession} />
            ) : null}
          </section>

          <Card className="shadow-none">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-[1.6rem]">Incidencias</CardTitle>
                <CardDescription>
                  {actionable.length
                    ? `${actionable.length} pendiente(s)`
                    : "No hay incidencias pendientes."}
                </CardDescription>
              </div>
              {actionable.length ? (
                <Button
                  type="button"
                  className="min-h-11"
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate("incidencias")}
                >
                  Ver incidencias
                </Button>
              ) : null}
            </CardHeader>
          </Card>

          <Accordion
            type="multiple"
            defaultValue={defaultAccordion}
            className="rounded-md border border-border px-4"
          >
            {income ? (
              <AccordionItem value="puntos">
                <AccordionTrigger className="text-[1.4rem]">
                  Puntos y abonados ·{" "}
                  {historicalQuantity(
                    income.availability.totalPuntosCanjeados,
                    income.totalPuntosCanjeados,
                  )}{" "}
                  puntos ·{" "}
                  {historicalQuantity(
                    income.availability.abonados,
                    income.abonados?.operaciones,
                  )}{" "}
                  operaciones
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReportMetric
                      title="Puntos"
                      values={[
                        [
                          "Valor cubierto con puntos",
                          historicalMoney(
                            income.availability.totalPuntosMonto,
                            income.totalPuntosMonto,
                          ),
                        ],
                        [
                          "Puntos canjeados",
                          historicalQuantity(
                            income.availability.totalPuntosCanjeados,
                            income.totalPuntosCanjeados,
                          ),
                        ],
                        [
                          "Ventas con puntos",
                          historicalQuantity(
                            income.availability.ventasConPuntos,
                            income.ventasConPuntos,
                          ),
                        ],
                      ]}
                    />
                    <ReportMetric
                      title="Abonados"
                      values={[
                        [
                          "Operaciones",
                          historicalQuantity(
                            income.availability.abonados,
                            income.abonados?.operaciones,
                          ),
                        ],
                        [
                          "Unidades",
                          historicalQuantity(
                            income.availability.abonados,
                            income.abonados?.unidades,
                          ),
                        ],
                        [
                          "Descuento de abonado",
                          historicalMoney(
                            income.availability.abonados,
                            income.abonados?.descuentoOtorgado,
                          ),
                        ],
                      ]}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {income ? (
              <AccordionItem value="promos">
                <AccordionTrigger className="text-[1.4rem]">
                  Promociones y combos ·{" "}
                  {historicalMoney(
                    income.availability.promociones,
                    income.promociones?.montoDescuento,
                  )}{" "}
                  de descuento
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReportMetric
                      title="Promociones"
                      values={[
                        [
                          "Descuento aplicado",
                          historicalMoney(
                            income.availability.promociones,
                            income.promociones?.montoDescuento,
                          ),
                        ],
                        [
                          "Unidades gratuitas",
                          historicalQuantity(
                            income.availability.promociones,
                            income.promociones?.unidadesGratis,
                          ),
                        ],
                        [
                          "Transacciones",
                          historicalQuantity(
                            income.availability.promociones,
                            income.promociones?.cantidadTransacciones,
                          ),
                        ],
                      ]}
                    />
                    <ReportMetric
                      title="Combos"
                      values={[
                        [
                          "Importe vendido",
                          historicalMoney(
                            income.availability.combos,
                            income.combos?.montoTotal,
                          ),
                        ],
                        [
                          "Combos vendidos",
                          historicalQuantity(
                            income.availability.combos,
                            income.combos?.cantidadVendidos,
                          ),
                        ],
                      ]}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {income ? (
              <AccordionItem value="otros">
                <AccordionTrigger className="text-[1.4rem]">
                  {otrosAllZero
                    ? "Otros movimientos · Sin actividad"
                    : "Otros movimientos · Combos, cortesías, merma y reversiones"}
                </AccordionTrigger>
                <AccordionContent>
                  {otrosAllZero ? (
                    <p className={secondaryLabelClass()}>
                      Sin combos, cortesías, merma, cancelaciones ni reembolsos.
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <ReportMetric
                        title="Cortesías y merma"
                        values={[
                          [
                            "Cortesías",
                            historicalQuantity(
                              income.availability.cortesias,
                              income.cortesias?.cantidad,
                            ),
                          ],
                          [
                            "Valor teórico cortesías",
                            historicalMoney(
                              income.availability.cortesias,
                              income.cortesias?.valorTeorico,
                            ),
                          ],
                          [
                            "Merma",
                            historicalQuantity(
                              income.availability.merma,
                              income.merma?.cantidad,
                            ),
                          ],
                          [
                            "Valor teórico merma",
                            historicalMoney(
                              income.availability.merma,
                              income.merma?.valorTeorico,
                            ),
                          ],
                        ]}
                      />
                      <ReportMetric
                        title="Reversiones"
                        values={[
                          [
                            "Cancelaciones",
                            historicalMoney(
                              income.availability.cancelaciones,
                              income.cancelaciones,
                            ),
                          ],
                          [
                            "Reembolsos",
                            historicalMoney(
                              income.availability.reembolsos,
                              income.reembolsos,
                            ),
                          ],
                          [
                            "Ajustes",
                            historicalMoney(income.availability.ajustes, income.ajustes),
                          ],
                        ]}
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {concessionId && report.productos ? (
              <AccordionItem value="productos">
                <AccordionTrigger className="text-[1.4rem]">
                  Detalle por producto · {report.productos.length} producto(s)
                </AccordionTrigger>
                <AccordionContent>
                  <CortesProductosTable
                    data={report.productos}
                    totales={report.productoTotales}
                  />
                </AccordionContent>
              </AccordionItem>
            ) : null}

            <AccordionItem value="tecnica">
              <AccordionTrigger className="text-[1.4rem]">
                Información técnica
                {report.calculationVersion
                  ? ` · ${corteCalculationLabel(report.calculationVersion)}`
                  : ""}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {report.calculationVersion ? (
                    <Badge variant="outline">
                      {corteCalculationLabel(report.calculationVersion)}
                    </Badge>
                  ) : (
                    <span className={secondaryLabelClass()}>
                      Sin versión de cálculo expuesta.
                    </span>
                  )}
                  <Badge variant="outline">
                    Inventario: {inventoryRows.length} producto(s)
                  </Badge>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => onNavigate("inventario")}
                  >
                    Abrir inventario
                  </Button>
                </div>
                {relatedCuts.length ? (
                  <ul className="mt-4 flex flex-col gap-2">
                    {relatedCuts.slice(0, 5).map((cut) => (
                      <li
                        key={cut.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[1.3rem]"
                      >
                        <span>
                          {cut.id} · {cut.cajaNombre ?? cut.cajaId ?? "Caja"}
                        </span>
                        <span className="font-medium tabular-nums">
                          {historicalCutMoney(cut)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex items-start gap-2 text-[1.25rem] text-foreground/70">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>Los puntos no forman parte del dinero real.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </FadeInSection>
      ) : (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Sin reporte disponible</CardTitle>
            <CardDescription>
              Selecciona una jornada con ventas registradas.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

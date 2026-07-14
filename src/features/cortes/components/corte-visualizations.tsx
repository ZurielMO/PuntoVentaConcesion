"use client";

import { ArrowRight, Boxes, CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type {
  CorteDashboard,
  CorteInventoryRow,
  CorteReport,
  CorteSummary,
} from "../contracts";

const percent = (value: number, total: number) =>
  total > 0 ? Math.max(2, Math.round((value / total) * 100)) : 0;

export function SalesByHourChart({
  data,
}: {
  data: NonNullable<CorteDashboard["ventasPorHora"]>;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((item) => item.ventasNetas), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[1.7rem]">Ventas por hora</CardTitle>
        <CardDescription>Picos de venta neta durante la jornada.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3" aria-label="Ventas netas por hora">
          {data.map((item) => (
            <li
              key={item.hora}
              className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3"
              aria-label={`${item.hora}: ${formatPrice(item.ventasNetas)}, ${item.tickets} tickets`}
            >
              <span className="text-[1.2rem] font-medium tabular-nums">
                {item.hora}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-200"
                  style={{ width: `${percent(item.ventasNetas, max)}%` }}
                />
              </span>
              <span className="text-right text-[1.2rem] tabular-nums text-muted-foreground">
                {formatPrice(item.ventasNetas)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function PaymentDistribution({
  data,
}: {
  data: CorteDashboard["metodosPago"];
}) {
  const cash = data.find((item) => item.metodo === "efectivo")?.monto;
  const card = data.find((item) => item.metodo === "tarjeta")?.monto;
  const points = data.find((item) => item.metodo === "puntos")?.monto;
  const monetaryTotal = (cash ?? 0) + (card ?? 0);
  const displayMoney = (amount?: number) => amount === undefined ? "N/D" : formatPrice(amount);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[1.7rem]">Distribución de cobro</CardTitle>
        <CardDescription>
          Los puntos no forman parte del dinero real.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          className="flex h-3 overflow-hidden rounded-full bg-muted"
          aria-label={`Efectivo ${displayMoney(cash)}; tarjeta ${displayMoney(card)}`}
        >
          {cash !== undefined && cash > 0 ? (
            <span
              className="h-full bg-green-dark"
              style={{ width: `${percent(cash, monetaryTotal)}%` }}
            />
          ) : null}
          {card !== undefined && card > 0 ? (
            <span
              className="h-full bg-green-accent"
              style={{ width: `${percent(card, monetaryTotal)}%` }}
            />
          ) : null}
        </div>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-[1.2rem] text-muted-foreground">Ventas en efectivo</dt>
            <dd className="font-semibold tabular-nums">{displayMoney(cash)}</dd>
          </div>
          <div>
            <dt className="text-[1.2rem] text-muted-foreground">Tarjeta</dt>
            <dd className="font-semibold tabular-nums">{displayMoney(card)}</dd>
          </div>
          <div>
            <dt className="text-[1.2rem] text-muted-foreground">Valor con puntos</dt>
            <dd className="font-semibold tabular-nums">{displayMoney(points)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export function OperationalComparison({
  report,
  onSelect,
}: {
  report: CorteReport | null;
  onSelect?: (concessionId: string) => void;
}) {
  const rows = [...(report?.resumen ?? [])]
    .sort((left, right) => right.totalVenta - left.totalVenta)
    .slice(0, 8);
  if (rows.length < 2) return null;
  const max = Math.max(...rows.map((row) => row.totalVenta), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[1.7rem]">Rendimiento por concesión</CardTitle>
        <CardDescription>Comparación de dinero real y comisión.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.concesionId} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-[1.3rem] font-medium">{row.nombre}</span>
                {onSelect ? (
                  <Button variant="ghost" size="sm" onClick={() => onSelect(row.concesionId)}>
                    {formatPrice(row.totalVenta)}
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                ) : (
                  <span className="text-[1.3rem] tabular-nums">{formatPrice(row.totalVenta)}</span>
                )}
              </div>
              <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${percent(row.totalVenta, max)}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ReconciliationPanel({
  summary,
  inventoryRows,
  onInventory,
}: {
  summary: CorteSummary | null;
  inventoryRows: CorteInventoryRow[];
  onInventory: () => void;
}) {
  if (!summary) return null;
  const inventoryDifferences = inventoryRows.filter(
    (row) => row.diferencia != null && row.diferencia !== 0,
  );
  const cashStatus = summary.diferenciaCaja == null
    ? "Pendiente de conteo"
    : summary.diferenciaCaja === 0
      ? "Correcto"
      : "Requiere revisión";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[1.7rem]">Conciliación</CardTitle>
        <CardDescription>Caja, consumo de inventario y comisión del alcance operativo actual.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2"><CircleDollarSign aria-hidden="true" /><strong>Efectivo</strong></div>
          <p className="text-[1.3rem] text-muted-foreground">Calculado {summary.availability?.totalEfectivo === false ? "N/D" : formatPrice(summary.totalEfectivo)}</p>
          <p className="text-[1.3rem] text-muted-foreground">Contado {summary.availability?.efectivoContado === false || summary.efectivoContado == null ? "N/D" : formatPrice(summary.efectivoContado)}</p>
          <Badge variant={summary.diferenciaCaja === 0 ? "secondary" : "outline"}>{cashStatus}</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2"><Boxes aria-hidden="true" /><strong>Inventario</strong></div>
          <p className="text-[1.3rem] text-muted-foreground">{summary.availability?.inventario === false || !summary.inventario ? "N/D" : `${summary.inventario.unidadesVendidas} unidad(es) vendidas`}</p>
          <p className="text-[1.3rem] text-muted-foreground">{inventoryDifferences.length ? `${inventoryDifferences.length} diferencia(s) físicas explícitas` : "Sin conciliación física en el resumen operativo"}</p>
          <Button className="min-h-11" variant="link" size="sm" onClick={onInventory}>Abrir inventario histórico</Button>
        </div>
        <div className="flex flex-col gap-2">
          <strong>Comisión calculada</strong>
          <p className="text-[2rem] font-semibold tabular-nums text-green-dark">{summary.availability?.comision === false || !summary.comision ? "N/D" : formatPrice(summary.comision.importeComision)}</p>
          <p className="text-[1.3rem] text-muted-foreground">Base {summary.availability?.comision === false || !summary.comision ? "N/D" : formatPrice(summary.comision.baseComision)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

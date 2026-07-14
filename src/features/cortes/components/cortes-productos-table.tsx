"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CorteReportProduct } from "../contracts";
import type { ReporteProductoTotales } from "@/lib/types";
import { StatusBadge, secondaryLabelClass, type CorteStatusTone } from "./cortes-status";

type CortesProductosTableProps = {
  data: CorteReportProduct[];
  totales?: ReporteProductoTotales | null;
  loading?: boolean;
};

const money = (value: number) => (value > 0 ? formatPrice(value) : "—");
const qty = (value: number) => (value > 0 ? value.toLocaleString("es-MX") : "—");
const nullable = (value: number | null | undefined) =>
  value == null ? "—" : value.toLocaleString("es-MX");

function productStatus(row: CorteReportProduct): { tone: CorteStatusTone; label: string } {
  if (row.diferencia != null && row.diferencia !== 0) {
    return { tone: "issue", label: "Revisar" };
  }
  if (row.estadoConciliacion) {
    const lower = row.estadoConciliacion.toLowerCase();
    if (lower.includes("crit") || lower.includes("dif")) {
      return { tone: "issue", label: "Revisar" };
    }
    if (lower.includes("ok") || lower.includes("correct")) {
      return { tone: "ok", label: "Correcto" };
    }
  }
  if (row.fisico == null && row.esperado == null) {
    return { tone: "neutral", label: "Sin conciliación" };
  }
  return { tone: "ok", label: "Correcto" };
}

function unitPrice(importe: number, cantidad: number) {
  if (cantidad <= 0) return null;
  return formatPrice(importe / cantidad);
}

export function CortesProductosTable({
  data,
  totales,
  loading,
}: CortesProductosTableProps) {
  const [selected, setSelected] = useState<CorteReportProduct | null>(null);

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-md" />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-border p-8 text-center text-[1.4rem] text-foreground/70">
        Sin productos en el reporte de esta jornada.
      </div>
    );
  }

  const th =
    "px-3 py-2 text-left text-[1.2rem] font-semibold uppercase tracking-wide text-foreground/65";
  const td = "px-3 py-2.5 text-[1.35rem]";

  return (
    <>
      {/* Desktop table */}
      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[40rem] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>Producto</th>
              <th className={cn(th, "text-right")}>Unidades vendidas</th>
              <th className={cn(th, "text-right")}>Unidades abonado</th>
              <th className={cn(th, "text-right")}>Venta neta</th>
              <th className={cn(th, "text-right")}>Inventario final</th>
              <th className={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const status = productStatus(row);
              return (
                <tr
                  key={row.productoId}
                  className="cursor-pointer border-b border-border/60 hover:bg-muted/40"
                  onClick={() => setSelected(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(row);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver detalle de ${row.nombre}`}
                >
                  <td className={cn(td, "max-w-[14rem] font-medium")}>
                    <span className="block truncate">{row.nombre}</span>
                  </td>
                  <td className={cn(td, "text-right tabular-nums")}>{qty(row.cantidadRegular)}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{qty(row.cantidadAbonado)}</td>
                  <td className={cn(td, "text-right font-medium tabular-nums")}>
                    {money(row.ventasTotales)}
                  </td>
                  <td className={cn(td, "text-right tabular-nums")}>{qty(row.inventarioFinal)}</td>
                  <td className={td}>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {totales ? (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                <td className={td}>Totales</td>
                <td className={cn(td, "text-right tabular-nums")}>{qty(totales.cantidadRegular)}</td>
                <td className={cn(td, "text-right tabular-nums")}>{qty(totales.cantidadAbonado)}</td>
                <td className={cn(td, "text-right tabular-nums")}>{money(totales.ventasTotales)}</td>
                <td className={cn(td, "text-right")}>—</td>
                <td className={td} />
              </tr>
              <tr className="bg-muted/20">
                <td className={td} colSpan={3}>
                  Dinero real
                </td>
                <td className={cn(td, "text-right font-bold tabular-nums text-green-dark")} colSpan={3}>
                  {money(totales.dineroReal)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {data.map((row) => {
          const status = productStatus(row);
          return (
            <li key={row.productoId}>
              <button
                type="button"
                className="w-full rounded-md border border-border bg-card p-4 text-left"
                onClick={() => setSelected(row)}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-medium">{row.nombre}</span>
                  <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-[1.25rem]">
                  <div>
                    <dt className={secondaryLabelClass()}>Vendidas</dt>
                    <dd className="tabular-nums">{qty(row.cantidadRegular)}</dd>
                  </div>
                  <div>
                    <dt className={secondaryLabelClass()}>Abonado</dt>
                    <dd className="tabular-nums">{qty(row.cantidadAbonado)}</dd>
                  </div>
                  <div>
                    <dt className={secondaryLabelClass()}>Venta neta</dt>
                    <dd className="font-medium tabular-nums">{money(row.ventasTotales)}</dd>
                  </div>
                  <div>
                    <dt className={secondaryLabelClass()}>Inv. final</dt>
                    <dd className="tabular-nums">{qty(row.inventarioFinal)}</dd>
                  </div>
                </dl>
              </button>
            </li>
          );
        })}
      </ul>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected?.nombre ?? "Producto"}</SheetTitle>
          </SheetHeader>
          {selected ? (
            <dl className="mt-4 grid gap-3 px-1 pb-6 text-[1.3rem]">
              {(
                [
                  ["Inventario inicial", qty(selected.inventarioInicial)],
                  ["Ventas regulares (unidades)", qty(selected.cantidadRegular)],
                  ["Ventas regulares (importe)", money(selected.ventasRegular)],
                  [
                    "Precio unitario regular",
                    unitPrice(selected.ventasRegular, selected.cantidadRegular) ?? "—",
                  ],
                  ["Ventas de abonado (unidades)", qty(selected.cantidadAbonado)],
                  ["Ventas de abonado (importe)", money(selected.ventasAbonado)],
                  [
                    "Precio unitario abonado",
                    unitPrice(selected.ventasAbonado, selected.cantidadAbonado) ?? "—",
                  ],
                  ["Puntos", money(selected.puntosCanjeados)],
                  ["Cortesías", qty(selected.cortesias)],
                  ["Promociones", nullable(selected.promociones)],
                  ["Merma", nullable(selected.merma)],
                  ["Inventario esperado", nullable(selected.esperado)],
                  ["Inventario físico", nullable(selected.fisico)],
                  ["Diferencia", nullable(selected.diferencia)],
                  ["Inventario final", qty(selected.inventarioFinal)],
                ] as Array<[string, string]>
              ).map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b border-border/50 pb-2">
                  <dt className={secondaryLabelClass()}>{label}</dt>
                  <dd className="text-right font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

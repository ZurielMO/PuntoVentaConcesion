import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReporteProductoRow, ReporteProductoTotales } from "@/lib/types";

type CorteReporteProductosTableProps = {
  data: ReporteProductoRow[];
  totales?: ReporteProductoTotales | null;
  loading?: boolean;
};

const money = (value: number) => (value > 0 ? formatPrice(value) : "—");
const qty = (value: number) => (value > 0 ? value.toLocaleString("es-MX") : "—");

function MoneyWithHint({
  amount,
  hint,
}: {
  amount: number;
  hint?: string | null;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span>{money(amount)}</span>
      {hint ? (
        <span className="text-[1.1rem] font-normal text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function CorteReporteProductosTable({
  data,
  totales,
  loading,
}: CorteReporteProductosTableProps) {
  if (loading) {
    return <Skeleton className="h-48 w-full rounded-md" />;
  }

  if (data.length === 0) {
    return (
      <div className="dashboard-card p-8 text-center text-[1.4rem] text-muted-foreground">
        Sin productos en el reporte de esta jornada.
      </div>
    );
  }

  const thClass =
    "whitespace-nowrap px-3 py-2 text-left text-[1.2rem] font-semibold uppercase tracking-wide text-muted-foreground";
  const tdClass = "whitespace-nowrap px-3 py-2.5 text-[1.35rem]";
  const tdRight = cn(tdClass, "text-right");

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[72rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className={thClass}>Producto</th>
            <th className={cn(thClass, "text-right")}>Inv. inicial</th>
            <th className={cn(thClass, "text-right")}>Inv. final</th>
            <th className={cn(thClass, "text-right")}>Ventas regulares</th>
            <th className={cn(thClass, "text-right")}>Ventas de abonados</th>
            <th className={cn(thClass, "text-right")}>Precio regular</th>
            <th className={cn(thClass, "text-right")}>Precio abonado</th>
            <th className={cn(thClass, "text-right")}>Cortesías</th>
            <th className={cn(thClass, "text-right")}>Puntos ($)</th>
            <th className={cn(thClass, "text-right")}>Ventas totales</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const precioHint =
              row.precioActual != null && row.precioActual > 0
                ? `(${formatPrice(row.precioActual)})`
                : null;
            const descuentoHint =
              row.descuentoAbonado != null && row.descuentoAbonado > 0
                ? `(-${formatPrice(row.descuentoAbonado)})`
                : null;

            return (
              <tr key={row.productoId} className="border-b border-border/60">
                <td className={cn(tdClass, "max-w-[14rem] font-medium")}>
                  <span className="block truncate">{row.nombre}</span>
                </td>
                <td className={tdRight}>{qty(row.inventarioInicial)}</td>
                <td className={tdRight}>{qty(row.inventarioFinal)}</td>
                <td className={tdRight}>{qty(row.cantidadRegular)}</td>
                <td className={tdRight}>{qty(row.cantidadAbonado)}</td>
                <td className={tdRight}>
                  <MoneyWithHint amount={row.ventasRegular} hint={precioHint} />
                </td>
                <td className={tdRight}>
                  <MoneyWithHint
                    amount={row.ventasAbonado}
                    hint={descuentoHint}
                  />
                </td>
                <td className={tdRight}>{qty(row.cortesias)}</td>
                <td className={tdRight}>{money(row.puntosCanjeados)}</td>
                <td className={cn(tdRight, "font-medium")}>
                  {money(row.ventasTotales)}
                </td>
              </tr>
            );
          })}
        </tbody>
        {totales && (
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30 font-semibold">
              <td className={tdClass}>Totales</td>
              <td className={tdRight}>—</td>
              <td className={tdRight}>—</td>
              <td className={tdRight}>{qty(totales.cantidadRegular)}</td>
              <td className={tdRight}>{qty(totales.cantidadAbonado)}</td>
              <td className={tdRight}>{money(totales.ventasRegular)}</td>
              <td className={tdRight}>{money(totales.ventasAbonado)}</td>
              <td className={tdRight}>{qty(totales.cortesias)}</td>
              <td className={tdRight}>{money(totales.puntosCanjeados)}</td>
              <td className={cn(tdRight, "font-bold text-green-dark")}>
                {money(totales.ventasTotales)}
              </td>
            </tr>
            <tr className="bg-muted/20">
              <td className={tdClass} colSpan={9}>
                Menos puntos canjeados
              </td>
              <td className={cn(tdRight, "text-destructive")}>
                {totales.puntosCanjeados > 0
                  ? `-${formatPrice(totales.puntosCanjeados)}`
                  : "—"}
              </td>
            </tr>
            <tr className="bg-green-muted font-bold">
              <td className={cn(tdClass, "text-green-dark")} colSpan={9}>
                Dinero real
              </td>
              <td
                className={cn(
                  tdRight,
                  "text-[1.5rem] font-bold text-green-dark",
                )}
              >
                {money(totales.dineroReal)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

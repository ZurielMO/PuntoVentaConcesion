import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  precioEfectivoDivergente,
  toDesgloseGeneralRow,
  toDesgloseGeneralTotales,
} from "@/lib/cortes-desglose-general";
import type { ReporteProductoRow, ReporteProductoTotales } from "@/lib/types";

type CorteReporteProductosGeneralTableProps = {
  data: ReporteProductoRow[];
  totales?: ReporteProductoTotales | null;
  /** Cantidad de puntos canjeados en la jornada (no existe por producto). */
  puntosCantidad?: number | null;
  loading?: boolean;
};

const money = (value: number) => (value > 0 ? formatPrice(value) : "—");
const qty = (value: number) => (value > 0 ? value.toLocaleString("es-MX") : "—");

function MoneyWithHint({
  amount,
  hint,
  className,
}: {
  amount: number;
  hint?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-end gap-0.5", className)}>
      <span>{money(amount)}</span>
      {hint ? (
        <span className="text-[1.1rem] font-normal text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function CorteReporteProductosGeneralTable({
  data,
  totales,
  puntosCantidad,
  loading,
}: CorteReporteProductosGeneralTableProps) {
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

  const rows = data.map(toDesgloseGeneralRow);
  const t = totales ? toDesgloseGeneralTotales(totales) : null;
  const mostrarPuntos = Boolean(t && t.puntosCanjeadosMonto > 0);
  const etiquetaPuntos =
    puntosCantidad != null && puntosCantidad > 0
      ? `Menos puntos canjeados (${puntosCantidad.toLocaleString("es-MX")} pts)`
      : "Menos puntos canjeados";

  const thClass =
    "whitespace-nowrap px-3 py-2 text-left text-[1.2rem] font-semibold uppercase tracking-wide text-muted-foreground";
  const tdClass = "whitespace-nowrap px-3 py-2.5 text-[1.35rem]";
  const tdRight = cn(tdClass, "text-right");

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-5xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className={thClass}>Producto</th>
            <th className={cn(thClass, "text-right")}>Inv. inicial</th>
            <th className={cn(thClass, "text-right")}>Inv. final</th>
            <th className={cn(thClass, "text-right")}>Ventas</th>
            <th className={cn(thClass, "text-right")}>Precio unitario</th>
            <th className={cn(thClass, "text-right")}>Cortesías</th>
            <th className={cn(thClass, "text-right")}>Venta palcos</th>
            <th className={cn(thClass, "text-right")}>Ventas totales</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const precioDivergente = precioEfectivoDivergente(row);

            return (
              <tr key={row.productoId} className="border-b border-border/60">
                <td className={cn(tdClass, "max-w-[16rem] font-medium")}>
                  <span className="block truncate">{row.nombre}</span>
                </td>
                <td className={tdRight}>{qty(row.inventarioInicial)}</td>
                <td className={tdRight}>{qty(row.inventarioFinal)}</td>
                <td className={tdRight}>{qty(row.ventas)}</td>
                <td className={tdRight}>
                  <div className="flex flex-col items-end gap-0.5">
                    <span>{money(row.precioUnitario)}</span>
                    {precioDivergente != null ? (
                      <span className="text-[1.1rem] font-normal text-muted-foreground">
                        (cobrado {formatPrice(precioDivergente)})
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className={tdRight}>{qty(row.cortesias)}</td>
                <td className={tdRight}>
                  <MoneyWithHint
                    amount={row.ventaPalcos}
                    hint={row.ventaPalcos > 0 ? "incluido en total" : null}
                  />
                </td>
                <td className={cn(tdRight, "font-medium")}>
                  <MoneyWithHint
                    amount={row.ventasTotales}
                    hint={
                      row.ventasTotales > 0 ? "Incluye POS y palcos" : null
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        {t && (
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30 font-semibold">
              <td className={tdClass}>Totales</td>
              <td className={tdRight}>—</td>
              <td className={tdRight}>—</td>
              <td className={tdRight}>{qty(t.ventas)}</td>
              <td className={tdRight}>—</td>
              <td className={tdRight}>{qty(t.cortesias)}</td>
              <td className={tdRight}>
                <MoneyWithHint
                  amount={t.ventaPalcos}
                  hint={t.ventaPalcos > 0 ? "incluido en total" : null}
                />
              </td>
              <td className={cn(tdRight, "font-bold text-green-dark")}>
                <MoneyWithHint
                  amount={t.ventasTotales}
                  hint={t.ventasTotales > 0 ? "Incluye POS y palcos" : null}
                />
              </td>
            </tr>
            {mostrarPuntos && (
              <tr className="bg-muted/20">
                <td className={tdClass} colSpan={7}>
                  {etiquetaPuntos}
                </td>
                <td className={cn(tdRight, "text-destructive")}>
                  {`-${formatPrice(t.puntosCanjeadosMonto)}`}
                </td>
              </tr>
            )}
            <tr className="bg-green-muted font-bold">
              <td className={cn(tdClass, "text-green-dark")} colSpan={7}>
                Dinero real
              </td>
              <td
                className={cn(
                  tdRight,
                  "text-[1.5rem] font-bold text-green-dark",
                )}
              >
                {money(t.dineroReal)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

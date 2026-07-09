import { DataTable } from "@/components/dashboard/data-table";
import { formatPrice } from "@/lib/format";
import type { ReporteConcesionRow } from "@/lib/types";

type CorteReporteComisionTableProps = {
  data: ReporteConcesionRow[];
  loading?: boolean;
  showTotals?: boolean;
};

export function CorteReporteComisionTable({
  data,
  loading,
  showTotals = true,
}: CorteReporteComisionTableProps) {
  const totals = data.reduce(
    (acc, row) => ({
      totalVenta: acc.totalVenta + row.totalVenta,
      comision: acc.comision + row.comision,
      gananciaConcesion: acc.gananciaConcesion + row.gananciaConcesion,
    }),
    { totalVenta: 0, comision: 0, gananciaConcesion: 0 },
  );

  return (
    <div className="space-y-3">
      <div className="-mx-1 overflow-x-auto px-1">
        <DataTable<ReporteConcesionRow>
          loading={loading}
          className="min-w-[40rem]"
          data={data}
          getRowKey={(row) => row.concesionId}
          emptyMessage="Sin datos de comisión para los filtros seleccionados."
          columns={[
            {
              key: "nombre",
              header: "Concesión",
              cell: (row) => (
                <span className="font-medium">{row.nombre}</span>
              ),
            },
            {
              key: "porcentaje",
              header: "Comisión %",
              className: "whitespace-nowrap text-right",
              cell: (row) => `${row.porcentajeComision.toLocaleString("es-MX")}%`,
            },
            {
              key: "totalVenta",
              header: "Total venta",
              className: "whitespace-nowrap text-right",
              cell: (row) => formatPrice(row.totalVenta),
            },
            {
              key: "comision",
              header: "Comisión",
              className: "whitespace-nowrap text-right",
              cell: (row) => formatPrice(row.comision),
            },
            {
              key: "ganancia",
              header: "Ganancia concesión",
              className: "whitespace-nowrap text-right",
              cell: (row) => (
                <span className="font-medium">
                  {formatPrice(row.gananciaConcesion)}
                </span>
              ),
            },
          ]}
        />
      </div>

      {showTotals && data.length > 1 && (
        <div className="dashboard-card grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Total venta</p>
            <p className="text-[1.8rem] font-semibold text-green-dark">
              {formatPrice(totals.totalVenta)}
            </p>
          </div>
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Total comisión</p>
            <p className="text-[1.8rem] font-semibold">
              {formatPrice(totals.comision)}
            </p>
          </div>
          <div>
            <p className="text-[1.2rem] text-muted-foreground">
              Total ganancia concesiones
            </p>
            <p className="text-[1.8rem] font-semibold text-green-dark">
              {formatPrice(totals.gananciaConcesion)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

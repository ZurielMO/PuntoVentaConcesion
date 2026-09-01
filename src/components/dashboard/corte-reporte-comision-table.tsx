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
      ventaPalcos: acc.ventaPalcos + Number(row.ventaPalcos ?? 0),
      comision: acc.comision + row.comision,
      gananciaConcesion: acc.gananciaConcesion + row.gananciaConcesion,
    }),
    { totalVenta: 0, ventaPalcos: 0, comision: 0, gananciaConcesion: 0 },
  );

  return (
    <div className="space-y-3">
      <div className="-mx-1 overflow-x-auto px-1">
        <DataTable<ReporteConcesionRow>
          loading={loading}
          className="md:min-w-[48rem]"
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
              header: "Venta total",
              className: "whitespace-nowrap text-right",
              cell: (row) => (
                <div>
                  <p>{formatPrice(row.totalVenta)}</p>
                  <p className="text-[1.1rem] font-normal text-muted-foreground">
                    Incluye POS y palcos
                  </p>
                </div>
              ),
            },
            {
              key: "ventaPalcos",
              header: "Venta Palcos",
              className: "whitespace-nowrap text-right",
              cell: (row) => {
                const monto = Number(row.ventaPalcos ?? 0);
                const qty = Number(row.cantidadVentasPalcos ?? 0);
                return (
                  <div>
                    <p className="font-medium">{formatPrice(monto)}</p>
                    {qty > 0 ? (
                      <p className="text-[1.1rem] font-normal text-muted-foreground">
                        {qty} venta{qty === 1 ? "" : "s"} · incluido en total
                      </p>
                    ) : (
                      <p className="text-[1.1rem] font-normal text-muted-foreground">
                        Sin ventas palcos
                      </p>
                    )}
                  </div>
                );
              },
            },
            {
              key: "comision",
              header: "Comisión",
              className: "whitespace-nowrap text-right",
              cell: (row) => formatPrice(row.comision),
            },
            {
              key: "ganancia",
              header: "Total final",
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
        <div className="dashboard-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Venta total</p>
            <p className="text-[1.8rem] font-semibold text-green-dark">
              {formatPrice(totals.totalVenta)}
            </p>
          </div>
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Venta Palcos</p>
            <p className="text-[1.8rem] font-semibold text-green-dark">
              {formatPrice(totals.ventaPalcos)}
            </p>
            <p className="text-[1.1rem] text-muted-foreground">
              Incluido en la venta total
            </p>
          </div>
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Total comisión</p>
            <p className="text-[1.8rem] font-semibold">
              {formatPrice(totals.comision)}
            </p>
          </div>
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Total final</p>
            <p className="text-[1.8rem] font-semibold text-green-dark">
              {formatPrice(totals.gananciaConcesion)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const sumOptional = (field: "totalPuntosCanjeados" | "valorPuntosCanjeados" | "descuentos") =>
    data.every((row) => row[field] !== undefined)
      ? data.reduce((total, row) => total + (row[field] ?? 0), 0)
      : undefined;
  const displayMoney = (value: number | undefined) =>
    value === undefined ? "N/D" : formatPrice(value);
  const displayQuantity = (value: number | undefined) =>
    value === undefined ? "N/D" : value.toLocaleString("es-MX");
  const benefitTotals = {
    totalPuntosCanjeados: sumOptional("totalPuntosCanjeados"),
    valorPuntosCanjeados: sumOptional("valorPuntosCanjeados"),
    descuentos: sumOptional("descuentos"),
  };
  const totals = data.reduce(
    (acc, row) => ({
      totalVenta: acc.totalVenta + row.totalVenta,
      comision: acc.comision + row.comision,
      gananciaConcesion: acc.gananciaConcesion + row.gananciaConcesion,
    }),
    {
      totalVenta: 0,
      comision: 0,
      gananciaConcesion: 0,
    },
  );

  return (
    <div className="space-y-3">
      <section
        aria-labelledby="beneficios-por-concesion"
        className="rounded-xl border border-green-light/70 bg-green-soft/40 p-4"
      >
        <div className="mb-3 space-y-1">
          <h3 id="beneficios-por-concesion" className="text-[1.5rem] font-semibold text-green-dark">
            Puntos y descuentos por concesiÃ³n
          </h3>
          <p className="text-[1.2rem] text-muted-foreground">
            Los puntos se muestran fuera del dinero real. Los descuentos incluyen promociones y beneficios de abonado, sin sumarse con otros beneficios.
          </p>
        </div>
        <div className="-mx-1 overflow-x-auto px-1">
          <DataTable<ReporteConcesionRow>
            loading={loading}
            className="min-w-[46rem]"
            data={data}
            getRowKey={(row) => `beneficios-${row.concesionId}`}
            emptyMessage="Sin datos de puntos o descuentos para los filtros seleccionados."
            columns={[
              {
                key: "nombre",
                header: "ConcesiÃ³n",
                cell: (row) => <span className="font-medium">{row.nombre}</span>,
              },
              {
                key: "puntos",
                header: "Puntos canjeados",
                className: "whitespace-nowrap text-right",
                cell: (row) => displayQuantity(row.totalPuntosCanjeados),
              },
              {
                key: "valorPuntos",
                header: "Valor cubierto con puntos",
                className: "whitespace-nowrap text-right",
                cell: (row) => displayMoney(row.valorPuntosCanjeados),
              },
              {
                key: "descuentos",
                header: "Descuentos aplicados",
                className: "whitespace-nowrap text-right",
                cell: (row) => displayMoney(row.descuentos),
              },
            ]}
          />
        </div>
      </section>
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
              header: "Base comisionable",
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
              header: "Neto posterior a comisión",
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
        <div className="dashboard-card grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Puntos canjeados</p>
            <p className="text-[1.8rem] font-semibold text-green-dark">
              {displayQuantity(benefitTotals.totalPuntosCanjeados)}
            </p>
            <p className="text-[1.1rem] text-muted-foreground">No son dinero real</p>
          </div>
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Valor cubierto con puntos</p>
            <p className="text-[1.8rem] font-semibold text-green-dark">
              {displayMoney(benefitTotals.valorPuntosCanjeados)}
            </p>
          </div>
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Descuentos aplicados</p>
            <p className="text-[1.8rem] font-semibold text-green-dark">
              {displayMoney(benefitTotals.descuentos)}
            </p>
          </div>
          <div>
            <p className="text-[1.2rem] text-muted-foreground">Base comisionable</p>
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
            <p className="text-[1.2rem] text-muted-foreground">Neto posterior a comisión</p>
            <p className="text-[1.8rem] font-semibold text-green-dark">
              {formatPrice(totals.gananciaConcesion)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

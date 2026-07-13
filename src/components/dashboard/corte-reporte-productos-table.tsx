import { DataTable } from "@/components/dashboard/data-table";
import { formatPrice } from "@/lib/format";
import type { ReporteProductoRow } from "@/lib/types";

type CorteReporteProductosTableProps = {
  data: ReporteProductoRow[];
  loading?: boolean;
  showHint?: boolean;
};

export function CorteReporteProductosTable({
  data,
  loading,
  showHint = false,
}: CorteReporteProductosTableProps) {
  return (
    <div className="space-y-2">
      {showHint && (
        <p className="text-[1.3rem] text-muted-foreground">
          Total vendido incluye el valor cobrado (efectivo, tarjeta y puntos). La
          comisión se calcula solo con efectivo + tarjeta.
        </p>
      )}
      <div className="-mx-1 overflow-x-auto px-1">
      <DataTable<ReporteProductoRow>
        loading={loading}
        className="min-w-[56rem]"
        data={data}
        getRowKey={(row) => row.productoId}
        emptyMessage="Sin productos en el reporte de esta jornada."
        columns={[
          {
            key: "nombre",
            header: "Producto",
            cell: (row) => (
              <span className="block max-w-[14rem] truncate font-medium sm:max-w-none">
                {row.nombre}
              </span>
            ),
          },
          {
            key: "inicial",
            header: "Inv. inicial",
            className: "whitespace-nowrap text-right",
            cell: (row) => row.inventarioInicial.toLocaleString("es-MX"),
          },
          {
            key: "cantidad",
            header: "Cant. vendida",
            className: "whitespace-nowrap text-right",
            cell: (row) => row.cantidadVendida.toLocaleString("es-MX"),
          },
          {
            key: "precio",
            header: "Precio unit.",
            className: "whitespace-nowrap text-right",
            cell: (row) => formatPrice(row.precioUnitario),
          },
          {
            key: "final",
            header: "Inv. final",
            className: "whitespace-nowrap text-right",
            cell: (row) => row.inventarioFinal.toLocaleString("es-MX"),
          },
          {
            key: "cortesias",
            header: "Cortesías ($0)",
            className: "whitespace-nowrap text-right",
            cell: (row) => row.cortesias.toLocaleString("es-MX"),
          },
          {
            key: "total",
            header: "Total vendido",
            className: "whitespace-nowrap text-right",
            cell: (row) => (
              <span className="font-medium">{formatPrice(row.totalVendido)}</span>
            ),
          },
        ]}
      />
      </div>
    </div>
  );
}

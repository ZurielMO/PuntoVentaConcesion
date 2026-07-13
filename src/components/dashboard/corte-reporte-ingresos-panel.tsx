import {
  CreditCard,
  Gift,
  Info,
  Package,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ReporteIngresos,
  ReportePromocionesAbonado,
  ReporteTipoVentaRow,
} from "@/lib/types";

type CorteReporteIngresosPanelProps = {
  ingresos: ReporteIngresos;
  tiposVenta: ReporteTipoVentaRow[];
  promocionesAbonado: ReportePromocionesAbonado;
};

const moneyOrDash = (value: number) =>
  value > 0 ? formatPrice(value) : "—";

export function CorteReporteIngresosPanel({
  ingresos,
  tiposVenta,
  promocionesAbonado,
}: CorteReporteIngresosPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Venta neta"
          value={formatPrice(ingresos.ventaNeta)}
          icon={TrendingUp}
          hint={`${ingresos.cantidadVentas} ventas · efectivo + tarjeta`}
        />
        <StatCard
          label="Efectivo en caja"
          value={formatPrice(ingresos.totalEfectivo)}
          icon={Wallet}
        />
        <StatCard
          label="Tarjeta"
          value={formatPrice(ingresos.totalTarjeta)}
          icon={CreditCard}
          hint="Pago con terminal"
        />
        <StatCard
          label="Puntos canjeados"
          value={ingresos.totalPuntosCanjeados.toLocaleString("es-MX")}
          icon={Gift}
          hint={`${formatPrice(ingresos.totalPuntosMonto)} en valor · ${ingresos.ventasConPuntos} ventas`}
        />
      </div>

      <div className="flex items-start gap-2 rounded-sm border border-green-soft bg-green-muted p-3 text-[1.3rem] text-green-dark">
        <Info className="mt-0.5 size-4 shrink-0 text-green-accent" />
        <p className="min-w-0 leading-snug">
          La venta neta es la suma de efectivo en caja más tarjeta. Los puntos
          canjeados son informativos y no forman parte del dinero real ni de la
          base de comisión.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-[1.6rem] font-semibold text-green-dark">
          Tipos de venta
        </h3>
        <div className="-mx-1 overflow-x-auto px-1">
          <DataTable<ReporteTipoVentaRow>
            className="min-w-[56rem]"
            data={tiposVenta}
            getRowKey={(row) => row.tipo}
            emptyMessage="Sin ventas en esta jornada."
            columns={[
              {
                key: "tipo",
                header: "Tipo",
                cell: (row) => (
                  <div className="min-w-[12rem]">
                    <p className="font-medium">{row.etiqueta}</p>
                    <p className="text-[1.2rem] text-muted-foreground">
                      {row.descripcion}
                    </p>
                  </div>
                ),
              },
              {
                key: "transacciones",
                header: "Trans.",
                className: "whitespace-nowrap text-right",
                cell: (row) => row.transacciones.toLocaleString("es-MX"),
              },
              {
                key: "efectivo",
                header: "Efectivo",
                className: "whitespace-nowrap text-right",
                cell: (row) => moneyOrDash(row.efectivo),
              },
              {
                key: "tarjeta",
                header: "Tarjeta",
                className: "whitespace-nowrap text-right",
                cell: (row) => moneyOrDash(row.tarjeta),
              },
              {
                key: "puntos",
                header: "Puntos ($)",
                className: "whitespace-nowrap text-right",
                cell: (row) => moneyOrDash(row.puntosMonto),
              },
              {
                key: "puntosCanjeados",
                header: "Pts. canjeados",
                className: "whitespace-nowrap text-right",
                cell: (row) =>
                  row.puntosCanjeados > 0
                    ? row.puntosCanjeados.toLocaleString("es-MX")
                    : "—",
              },
              {
                key: "valorTotal",
                header: "Valor total",
                className: "whitespace-nowrap text-right",
                cell: (row) => (
                  <span className="font-medium">
                    {moneyOrDash(row.valorTotal)}
                  </span>
                ),
              },
              {
                key: "descuento",
                header: "Desc. abonado",
                className: "whitespace-nowrap text-right",
                cell: (row) => moneyOrDash(row.descuentoAbonado),
              },
            ]}
          />
        </div>
      </div>

      {promocionesAbonado.cantidadTransacciones > 0 && (
        <div className={cn("dashboard-card p-5")}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-[1.6rem] font-semibold text-green-dark">
              Beneficios abonado
            </h3>
            <Badge variant="secondary">
              {promocionesAbonado.cantidadTransacciones} transacciones
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-3">
            <div>
              <p className="text-[1.3rem] text-muted-foreground">Monto vendido</p>
              <p className="text-[1.8rem] font-semibold text-green-dark sm:text-[2rem]">
                {formatPrice(promocionesAbonado.montoTotal)}
              </p>
            </div>
            <div>
              <p className="text-[1.3rem] text-muted-foreground">
                Descuento otorgado
              </p>
              <p className="text-[1.8rem] font-semibold text-green-dark sm:text-[2rem]">
                {formatPrice(promocionesAbonado.montoDescuento)}
              </p>
            </div>
            <div>
              <p className="text-[1.3rem] text-muted-foreground">
                Unidades gratis
              </p>
              <p className="flex items-center gap-2 text-[1.8rem] font-semibold text-green-dark sm:text-[2rem]">
                <Package className="size-5 shrink-0 text-green-accent" />
                {promocionesAbonado.unidadesGratis.toLocaleString("es-MX")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

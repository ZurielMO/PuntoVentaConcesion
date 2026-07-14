import { CreditCard, Gift, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatPrice } from "@/lib/format";
import type { CorteReportIncome } from "@/features/cortes/contracts";

type CorteReporteIngresosStatsProps = {
  ingresos: CorteReportIncome;
};

const historicalMoney = (available: boolean | undefined, value?: number) =>
  available && value !== undefined ? formatPrice(value) : "Sin dato histórico";

const historicalQuantity = (available: boolean | undefined, value?: number) =>
  available && value !== undefined ? value.toLocaleString("es-MX") : "Sin dato histórico";

export function CorteReporteIngresosStats({
  ingresos,
}: CorteReporteIngresosStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Ventas netas"
        value={historicalMoney(ingresos.availability.ventasNetas ?? ingresos.availability.ventaNeta, ingresos.ventasNetas ?? ingresos.ventaNeta)}
        icon={TrendingUp}
        hint={ingresos.availability.cantidadVentas && ingresos.cantidadVentas !== undefined ? `${ingresos.cantidadVentas} ventas · efectivo + tarjeta` : "Sin conteo histórico de ventas"}
      />
      <StatCard
        label="Ventas en efectivo"
        value={historicalMoney(ingresos.availability.totalEfectivo, ingresos.totalEfectivo)}
        icon={Wallet}
      />
      <StatCard
        label="Tarjeta"
        value={historicalMoney(ingresos.availability.totalTarjeta, ingresos.totalTarjeta)}
        icon={CreditCard}
        hint="Pago con terminal"
      />
      <StatCard
        label="Puntos canjeados"
        value={historicalQuantity(ingresos.availability.totalPuntosCanjeados, ingresos.totalPuntosCanjeados)}
        icon={Gift}
        hint={
          ingresos.availability.totalPuntosMonto && ingresos.totalPuntosMonto !== undefined && ingresos.availability.ventasConPuntos && ingresos.ventasConPuntos !== undefined
            ? `${formatPrice(ingresos.totalPuntosMonto)} en valor · ${ingresos.ventasConPuntos} ventas`
            : "Sin desglose histórico de puntos"
        }
      />
    </div>
  );
}

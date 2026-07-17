import { CreditCard, Gift, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatPrice } from "@/lib/format";
import type { ReporteIngresos } from "@/lib/types";

type CorteReporteIngresosStatsProps = {
  ingresos: ReporteIngresos;
};

export function CorteReporteIngresosStats({
  ingresos,
}: CorteReporteIngresosStatsProps) {
  return (
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
  );
}

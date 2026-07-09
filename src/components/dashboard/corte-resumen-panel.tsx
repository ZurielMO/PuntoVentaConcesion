import type { ReactNode } from "react";
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
  CorteResumen,
  CorteResumenComboLinea,
  CorteResumenProducto,
} from "@/lib/types";

type CorteResumenPanelProps = {
  resumen: CorteResumen;
  /** Layout más denso para modales y pantallas pequeñas */
  compact?: boolean;
};

export function CorteResumenPanel({
  resumen,
  compact = false,
}: CorteResumenPanelProps) {
  const tieneArqueo = resumen.corteCerrado && resumen.efectivoContado != null;
  const diferencia = resumen.diferenciaCaja ?? 0;

  const statsGrid = compact
    ? "grid grid-cols-1 gap-3 min-[420px]:grid-cols-2"
    : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";

  const arqueoGrid = compact
    ? "grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3"
    : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

  const sectionTitle = compact
    ? "mb-2 text-[1.4rem] font-semibold text-green-dark"
    : "mb-3 text-[1.6rem] font-semibold text-green-dark";

  const tableWrap = (children: ReactNode) => (
    <div className="-mx-1 overflow-x-auto px-1">{children}</div>
  );

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className={statsGrid}>
        <StatCard
          compact={compact}
          label="Venta neta"
          value={formatPrice(resumen.totalVendido)}
          icon={TrendingUp}
          hint={`${resumen.cantidadVentas} ventas · efectivo + tarjeta`}
        />
        <StatCard
          compact={compact}
          label="Efectivo en caja"
          value={formatPrice(resumen.totalEfectivo)}
          icon={Wallet}
        />
        <StatCard
          compact={compact}
          label="Tarjeta"
          value={formatPrice(resumen.totalTarjeta)}
          icon={CreditCard}
          hint="Pago con terminal"
        />
        <StatCard
          compact={compact}
          label="Puntos canjeados"
          value={resumen.totalPuntosCanjeados.toLocaleString("es-MX")}
          icon={Gift}
          hint={`${formatPrice(resumen.totalPuntosMonto)} en valor · ${resumen.ventasConPuntos} ventas`}
        />
      </div>

      <div
        className={cn(
          "flex items-start gap-2 rounded-sm border border-green-soft bg-green-muted text-green-dark",
          compact ? "p-2.5 text-[1.2rem]" : "p-3 text-[1.3rem]",
        )}
      >
        <Info className="mt-0.5 size-4 shrink-0 text-green-accent" />
        <p className="min-w-0 leading-snug">
          La venta neta es la suma de efectivo en caja más tarjeta. Los puntos
          canjeados son informativos y no forman parte del dinero real.
        </p>
      </div>

      {tieneArqueo && (
        <div className={arqueoGrid}>
          <StatCard
            compact={compact}
            label="Efectivo contado"
            value={formatPrice(resumen.efectivoContado ?? 0)}
            icon={Wallet}
          />
          <StatCard
            compact={compact}
            label="Efectivo esperado"
            value={formatPrice(resumen.totalEfectivo)}
            icon={Wallet}
          />
          <StatCard
            compact={compact}
            label="Diferencia de caja"
            value={formatPrice(diferencia)}
            icon={Info}
            hint={
              diferencia === 0
                ? "Cuadra"
                : diferencia > 0
                  ? "Sobrante"
                  : "Faltante"
            }
            iconClassName={
              diferencia < 0
                ? "bg-red-50 text-destructive"
                : undefined
            }
          />
        </div>
      )}

      <div>
        <h3 className={sectionTitle}>Productos vendidos</h3>
        {tableWrap(
          <DataTable<CorteResumenProducto>
            className="min-w-[32rem]"
            data={resumen.productos}
            getRowKey={(p) => `${p.productoId}-${p.precioUnitario}`}
            emptyMessage="Sin productos vendidos en este periodo."
            columns={[
              {
                key: "nombre",
                header: "Producto",
                cell: (p) => (
                  <span className="block max-w-[12rem] truncate sm:max-w-none">
                    {p.nombre}
                  </span>
                ),
              },
              {
                key: "cantidad",
                header: "Cant.",
                className: "whitespace-nowrap",
                cell: (p) => p.cantidad.toLocaleString("es-MX"),
              },
              {
                key: "precio",
                header: "Precio",
                className: "whitespace-nowrap",
                cell: (p) => formatPrice(p.precioUnitario),
              },
              {
                key: "subtotal",
                header: "Subtotal",
                className: "whitespace-nowrap",
                cell: (p) => (
                  <span className="font-medium">{formatPrice(p.subtotal)}</span>
                ),
              },
            ]}
          />,
        )}
      </div>

      {resumen.combos.items.length > 0 && (
        <div>
          <h3 className={sectionTitle}>Combos vendidos</h3>
          {tableWrap(
            <DataTable<CorteResumenComboLinea>
              className="min-w-[24rem]"
              data={resumen.combos.items}
              getRowKey={(c) => c.comboId}
              emptyMessage="Sin combos vendidos."
              columns={[
                {
                  key: "nombre",
                  header: "Combo",
                  cell: (c) => (
                    <span className="block max-w-[12rem] truncate sm:max-w-none">
                      {c.nombre}
                    </span>
                  ),
                },
                {
                  key: "cantidad",
                  header: "Cant.",
                  className: "whitespace-nowrap",
                  cell: (c) => c.cantidadVendidos.toLocaleString("es-MX"),
                },
                {
                  key: "monto",
                  header: "Monto",
                  className: "whitespace-nowrap",
                  cell: (c) => (
                    <span className="font-medium">{formatPrice(c.montoTotal)}</span>
                  ),
                },
              ]}
            />,
          )}
        </div>
      )}

      {resumen.promociones2x1.cantidadTransacciones > 0 && (
        <div className={cn("dashboard-card", compact ? "p-4" : "p-5")}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className={compact ? "text-[1.4rem] font-semibold text-green-dark" : "text-[1.6rem] font-semibold text-green-dark"}>
              Promociones 2x1
            </h3>
            <Badge variant="secondary">
              {resumen.promociones2x1.cantidadTransacciones} transacciones
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-3">
            <div>
              <p className="text-[1.3rem] text-muted-foreground">Monto vendido</p>
              <p className="text-[1.8rem] font-semibold text-green-dark sm:text-[2rem]">
                {formatPrice(resumen.promociones2x1.montoTotal)}
              </p>
            </div>
            <div>
              <p className="text-[1.3rem] text-muted-foreground">Descuento</p>
              <p className="text-[1.8rem] font-semibold text-green-dark sm:text-[2rem]">
                {formatPrice(resumen.promociones2x1.montoDescuento)}
              </p>
            </div>
            <div>
              <p className="text-[1.3rem] text-muted-foreground">
                Unidades gratis
              </p>
              <p className="flex items-center gap-2 text-[1.8rem] font-semibold text-green-dark sm:text-[2rem]">
                <Package className="size-5 shrink-0 text-green-accent" />
                {resumen.promociones2x1.unidadesGratis.toLocaleString("es-MX")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

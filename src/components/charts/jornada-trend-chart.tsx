"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { ChartTooltip, type TooltipEntry } from "@/components/charts/chart-tooltip";
import {
  CHART_GRID,
  CHART_PRIMARY,
  CHART_WARNING,
  axisProps,
  chartColor,
  cursorFill,
  formatCompactMoney,
  formatCompactNumber,
} from "@/components/charts/chart-theme";
import { SegmentedControl } from "@/components/charts/segmented-control";
import type { JornadaConcesionData, JornadaStat } from "@/lib/dashboard-stats";
import { formatPrice } from "@/lib/format";

type Modo = "total" | "concesion";
type Rango = "5" | "10" | "todas";

const MODOS: { value: Modo; label: string }[] = [
  { value: "total", label: "Total" },
  { value: "concesion", label: "Por concesión" },
];

const RANGOS: { value: Rango; label: string }[] = [
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "todas", label: "Todas" },
];

const formatTrendValue = (entry: TooltipEntry) =>
  entry.dataKey === "transacciones"
    ? `${formatCompactNumber(Number(entry.value ?? 0))} tickets`
    : formatPrice(Number(entry.value ?? 0));

type JornadaTrendChartProps = {
  stats: JornadaStat[];
  porConcesion: JornadaConcesionData;
  loading?: boolean;
};

export function JornadaTrendChart({
  stats,
  porConcesion,
  loading,
}: JornadaTrendChartProps) {
  const [modo, setModo] = useState<Modo>("total");
  const [rango, setRango] = useState<Rango>("10");

  const limite = rango === "todas" ? null : Number(rango);

  const statsVisibles = useMemo(
    () => (limite ? stats.slice(-limite) : stats),
    [stats, limite],
  );

  const stackVisible = useMemo(() => {
    const rows = limite ? porConcesion.rows.slice(-limite) : porConcesion.rows;
    // Sólo las concesiones con venta en las jornadas visibles.
    const series = porConcesion.series.filter((serie) =>
      rows.some((row) => Number(row[serie.key] ?? 0) > 0),
    );
    return { rows, series };
  }, [porConcesion, limite]);

  const isEmpty = statsVisibles.length === 0;

  const promedio = useMemo(() => {
    if (statsVisibles.length === 0) return 0;
    const suma = statsVisibles.reduce((acc, s) => acc + s.total, 0);
    return suma / statsVisibles.length;
  }, [statsVisibles]);

  return (
    <ChartCard
      title="Comparativa de ventas entre jornadas"
      subtitle={
        modo === "total"
          ? "Venta total y número de comprobantes por jornada"
          : "Aportación de cada concesión en cada jornada"
      }
      loading={loading}
      isEmpty={isEmpty}
      emptyMessage="Aún no hay ventas con jornada registrada"
      height="h-[320px]"
      actions={
        <>
          <SegmentedControl
            value={modo}
            options={MODOS}
            onChange={setModo}
            ariaLabel="Modo de comparación"
          />
          <SegmentedControl
            value={rango}
            options={RANGOS}
            onChange={setRango}
            ariaLabel="Jornadas a mostrar"
          />
        </>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 text-[1.3rem]">
          <span className="text-muted-foreground">
            {statsVisibles.length} jornada{statsVisibles.length === 1 ? "" : "s"} en el
            rango
          </span>
          <span className="text-muted-foreground">
            Promedio por jornada:{" "}
            <span className="font-semibold text-green-dark">
              {formatPrice(promedio)}
            </span>
          </span>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        {modo === "total" ? (
          <ComposedChart
            data={statsVisibles}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            <XAxis dataKey="shortLabel" {...axisProps} />
            <YAxis
              yAxisId="money"
              tickFormatter={formatCompactMoney}
              width={60}
              {...axisProps}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tickFormatter={formatCompactNumber}
              width={40}
              {...axisProps}
            />
            <Tooltip
              cursor={{ fill: cursorFill }}
              content={
                <ChartTooltip labelKey="label" formatValue={formatTrendValue} />
              }
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
            />
            <Bar
              yAxisId="money"
              dataKey="total"
              name="Venta"
              fill={CHART_PRIMARY}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="transacciones"
              name="Comprobantes"
              stroke={CHART_WARNING}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_WARNING }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        ) : (
          <BarChart
            data={stackVisible.rows}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            <XAxis dataKey="shortLabel" {...axisProps} />
            <YAxis tickFormatter={formatCompactMoney} width={60} {...axisProps} />
            <Tooltip
              cursor={{ fill: cursorFill }}
              content={<ChartTooltip labelKey="label" showTotal />}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
            />
            {stackVisible.series.map((serie, index) => (
              <Bar
                key={serie.key}
                dataKey={serie.key}
                name={serie.nombre}
                stackId="ventas"
                fill={chartColor(index)}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  );
}

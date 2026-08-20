"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  CHART_GRID,
  CHART_PRIMARY,
  axisProps,
  chartColor,
  cursorFill,
  formatCompactMoney,
} from "@/components/charts/chart-theme";
import { formatPrice } from "@/lib/format";

export type RankingDatum = {
  id: string;
  nombre: string;
  valor: number;
};

type RankingBarChartProps = {
  title: string;
  subtitle?: string;
  data: RankingDatum[];
  loading?: boolean;
  maxItems?: number;
  /** Nombre de la serie, visible en el tooltip. */
  valueLabel?: string;
  formatValue?: (value: number) => string;
  axisFormatter?: (value: number) => string;
  multicolor?: boolean;
  labelWidth?: number;
  height?: string;
  emptyMessage?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

// Recharts ya parte la etiqueta en varias líneas según el ancho del eje;
// esto sólo evita nombres desproporcionados.
const truncate = (value: string, max = 30) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

export function RankingBarChart({
  title,
  subtitle,
  data,
  loading,
  maxItems = 8,
  valueLabel = "Venta",
  formatValue = formatPrice,
  axisFormatter = formatCompactMoney,
  multicolor = false,
  labelWidth = 130,
  height = "h-[280px]",
  emptyMessage,
  actions,
  footer,
  className,
}: RankingBarChartProps) {
  const visible = data.slice(0, maxItems);

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      loading={loading}
      isEmpty={visible.length === 0}
      emptyMessage={emptyMessage}
      height={height}
      actions={actions}
      footer={footer}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={visible}
          layout="vertical"
          margin={{ top: 4, right: 68, bottom: 0, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke={CHART_GRID} />
          <XAxis type="number" tickFormatter={axisFormatter} {...axisProps} />
          <YAxis
            type="category"
            dataKey="nombre"
            width={labelWidth}
            tickFormatter={(value: string) => truncate(value)}
            {...axisProps}
          />
          <Tooltip
            cursor={{ fill: cursorFill }}
            content={
              <ChartTooltip
                labelKey="nombre"
                formatValue={(entry) => formatValue(Number(entry.value ?? 0))}
              />
            }
          />
          <Bar
            dataKey="valor"
            name={valueLabel}
            radius={[0, 6, 6, 0]}
            maxBarSize={26}
            fill={CHART_PRIMARY}
          >
            {multicolor &&
              visible.map((item, index) => (
                <Cell key={item.id} fill={chartColor(index)} />
              ))}
            <LabelList
              dataKey="valor"
              position="right"
              formatter={(value) => formatValue(Number(value ?? 0))}
              style={{ fontSize: 12, fontWeight: 600, fill: "rgba(5, 46, 22, 0.92)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

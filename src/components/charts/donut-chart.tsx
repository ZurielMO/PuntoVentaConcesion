"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { chartColor, formatCompactMoney } from "@/components/charts/chart-theme";

export type DonutDatum = {
  id: string;
  nombre: string;
  valor: number;
};

type DonutChartProps = {
  title: string;
  subtitle?: string;
  data: DonutDatum[];
  loading?: boolean;
  maxItems?: number;
  centerLabel?: string;
  height?: string;
  emptyMessage?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Agrupa la cola en "Otras" para que la dona siga siendo legible. */
function collapseTail(data: DonutDatum[], maxItems: number): DonutDatum[] {
  if (data.length <= maxItems) return data;
  const principales = data.slice(0, maxItems - 1);
  const resto = data.slice(maxItems - 1);
  return [
    ...principales,
    {
      id: "otras",
      nombre: `Otras (${resto.length})`,
      valor: resto.reduce((acc, item) => acc + item.valor, 0),
    },
  ];
}

export function DonutChart({
  title,
  subtitle,
  data,
  loading,
  maxItems = 6,
  centerLabel = "Total",
  height = "h-[280px]",
  emptyMessage,
  actions,
  footer,
  className,
}: DonutChartProps) {
  const visible = collapseTail(
    data.filter((item) => item.valor > 0),
    maxItems,
  );
  const total = visible.reduce((acc, item) => acc + item.valor, 0);

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
      <div className="flex size-full items-center gap-3">
        <div className="relative h-full min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[1.1rem] text-muted-foreground">{centerLabel}</span>
            <span className="text-[1.6rem] font-bold text-green-dark">
              {formatCompactMoney(total)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Tooltip content={<ChartTooltip labelKey="nombre" />} />
              <Pie
                data={visible}
                dataKey="valor"
                nameKey="nombre"
                innerRadius="58%"
                outerRadius="84%"
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {visible.map((item, index) => (
                  <Cell key={item.id} fill={chartColor(index)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="max-h-full w-[44%] shrink-0 space-y-1.5 overflow-y-auto pr-1">
          {visible.map((item, index) => {
            const pct = total > 0 ? (item.valor / total) * 100 : 0;
            return (
              <li key={item.id} className="flex items-center gap-2 text-[1.2rem]">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: chartColor(index) }}
                />
                <span className="truncate text-muted-foreground" title={item.nombre}>
                  {item.nombre}
                </span>
                <span className="ml-auto shrink-0 pl-2 font-semibold text-green-dark">
                  {pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </ChartCard>
  );
}

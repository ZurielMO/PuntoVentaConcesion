"use client";

import { formatPrice } from "@/lib/format";

export type TooltipEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  /** Lee el título del tooltip de la fila original (p.ej. la etiqueta larga). */
  labelKey?: string;
  formatValue?: (entry: TooltipEntry) => string;
  /** Suma de las series visibles, útil en gráficas apiladas. */
  showTotal?: boolean;
};

const defaultFormatValue = (entry: TooltipEntry) => formatPrice(Number(entry.value ?? 0));

export function ChartTooltip({
  active,
  label,
  payload,
  labelKey,
  formatValue = defaultFormatValue,
  showTotal = false,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  const heading =
    labelKey && row && typeof row[labelKey] === "string"
      ? (row[labelKey] as string)
      : String(label ?? "");

  const visibles = payload.filter((entry) => Number(entry.value ?? 0) !== 0);
  const entries = visibles.length > 0 ? visibles : payload;
  const total = entries.reduce((acc, entry) => acc + Number(entry.value ?? 0), 0);

  return (
    <div className="rounded-[8px] border border-[rgba(5,46,22,0.1)] bg-white px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      {heading && (
        <p className="mb-1.5 text-[1.3rem] font-semibold text-green-dark">{heading}</p>
      )}
      <div className="space-y-1">
        {entries.map((entry, index) => (
          <div
            key={`${entry.dataKey ?? entry.name ?? index}`}
            className="flex items-center gap-2 text-[1.3rem]"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto pl-3 font-semibold text-green-dark">
              {formatValue(entry)}
            </span>
          </div>
        ))}
      </div>
      {showTotal && entries.length > 1 && (
        <div className="mt-1.5 flex items-center gap-2 border-t border-[rgba(5,46,22,0.08)] pt-1.5 text-[1.3rem]">
          <span className="text-muted-foreground">Total</span>
          <span className="ml-auto pl-3 font-bold text-green-dark">
            {formatPrice(total)}
          </span>
        </div>
      )}
    </div>
  );
}

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  /** Alto del área de la gráfica. ResponsiveContainer necesita altura fija. */
  height?: string;
  className?: string;
  children: ReactNode;
};

export function ChartCard({
  title,
  subtitle,
  actions,
  footer,
  loading,
  isEmpty,
  emptyMessage = "Sin datos para el filtro seleccionado",
  height = "h-[280px]",
  className,
  children,
}: ChartCardProps) {
  return (
    <div className={cn("dashboard-card flex flex-col p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[1.8rem] font-semibold leading-tight text-green-dark">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[1.3rem] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {loading ? (
        <div className={cn("w-full", height)}>
          <Skeleton className="size-full rounded-[12px]" />
        </div>
      ) : isEmpty ? (
        <div
          className={cn(
            "flex w-full items-center justify-center rounded-[12px] border border-dashed border-[rgba(5,46,22,0.12)] bg-neutral-cool/60 px-4 text-center text-[1.4rem] text-muted-foreground",
            height,
          )}
        >
          {emptyMessage}
        </div>
      ) : (
        <div className={cn("w-full", height)}>{children}</div>
      )}

      {footer && !loading && !isEmpty && (
        <div className="mt-4 border-t border-[rgba(5,46,22,0.06)] pt-3">{footer}</div>
      )}
    </div>
  );
}

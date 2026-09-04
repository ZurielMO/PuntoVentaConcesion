import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
  iconClassName?: string;
  className?: string;
  compact?: boolean;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  iconClassName,
  className,
  compact = false,
}: StatCardProps) {
  return (
    <div className={cn("dashboard-card min-w-0", compact ? "p-4" : "p-6", className)}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium leading-snug text-muted-foreground",
              compact ? "text-[1.35rem]" : "text-[1.45rem]",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-2 font-bold leading-tight text-green-dark break-words",
              compact
                ? "text-[2.2rem] sm:text-[2.4rem]"
                : "text-[2.6rem] sm:text-[3.1rem]",
            )}
          >
            {value}
          </p>
          {hint && (
            <p
              className={cn(
                "mt-1.5 leading-snug text-muted-foreground",
                compact ? "text-[1.25rem]" : "text-[1.35rem]",
              )}
            >
              {hint}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[14px] bg-green-soft text-green-accent",
            compact ? "size-11" : "size-14",
            iconClassName,
          )}
        >
          <Icon className={compact ? "size-5" : "size-7"} />
        </div>
      </div>
    </div>
  );
}

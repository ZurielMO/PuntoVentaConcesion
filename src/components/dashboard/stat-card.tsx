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
    <div className={cn("dashboard-card min-w-0", compact ? "p-4" : "p-5", className)}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium leading-snug text-muted-foreground",
              compact ? "text-[1.2rem]" : "text-[1.3rem]",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-1.5 font-bold leading-tight text-green-dark break-words",
              compact
                ? "text-[2rem] sm:text-[2.2rem]"
                : "text-[2.4rem] sm:text-[2.8rem]",
            )}
          >
            {value}
          </p>
          {hint && (
            <p
              className={cn(
                "mt-1.5 leading-snug text-muted-foreground",
                compact ? "text-[1.1rem]" : "text-[1.2rem]",
              )}
            >
              {hint}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[12px] bg-green-soft text-green-accent",
            compact ? "size-10" : "size-12",
            iconClassName,
          )}
        >
          <Icon className={compact ? "size-5" : "size-6"} />
        </div>
      </div>
    </div>
  );
}

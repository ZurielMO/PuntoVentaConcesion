import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  iconClassName?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  iconClassName,
  className,
}: StatCardProps) {
  return (
    <div className={cn("dashboard-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[1.3rem] font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-[2.8rem] font-bold leading-none text-green-dark">
            {value}
          </p>
          {hint && (
            <p className="mt-2 text-[1.2rem] text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-[12px] bg-green-soft text-green-accent",
            iconClassName,
          )}
        >
          <Icon className="size-6" />
        </div>
      </div>
    </div>
  );
}

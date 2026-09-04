"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
};

export function MetricCard({ label, value, hint, icon: Icon, className }: MetricCardProps) {
  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[1.4rem] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-[2.8rem] font-semibold text-starbucks-green">{value}</p>
          {hint && (
            <p className="mt-1.5 text-[1.45rem] text-muted-foreground">{hint}</p>
          )}
        </div>
        {Icon && (
          <div className="flex size-14 items-center justify-center rounded-full bg-green-light/60 text-green-accent">
            <Icon className="size-7" />
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className={cn("glass-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[1.3rem] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-[2.4rem] font-semibold text-starbucks-green">{value}</p>
          {hint && (
            <p className="mt-1 text-[1.3rem] text-muted-foreground">{hint}</p>
          )}
        </div>
        {Icon && (
          <div className="flex size-12 items-center justify-center rounded-full bg-green-light/60 text-green-accent">
            <Icon className="size-6" />
          </div>
        )}
      </div>
    </div>
  );
}

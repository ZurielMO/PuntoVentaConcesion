import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardBannerProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function DashboardBanner({
  title,
  subtitle,
  action,
  className,
}: DashboardBannerProps) {
  return (
    <div className={cn("dashboard-banner relative p-6 md:p-8", className)}>
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="!text-[2.4rem] !font-semibold !text-white">{title}</h2>
          {subtitle && (
            <p className="mt-2 max-w-xl text-[1.5rem] text-white/80">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

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
    <div className={cn("dashboard-banner relative p-6 sm:p-7 md:p-9", className)}>
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="!text-[2.2rem] !font-semibold !text-white sm:!text-[2.6rem]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-xl text-[1.5rem] text-white/85 sm:text-[1.65rem]">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

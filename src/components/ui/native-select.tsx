import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select nativo estilizado para formularios y filtros del dashboard.
 * Misma altura, borde, radio y focus ring que <Input />.
 */
function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        data-slot="native-select"
        className="h-11 w-full appearance-none rounded-[8px] border border-input bg-white pl-3 pr-10 text-[1.4rem] text-foreground transition-colors outline-none focus-visible:border-green-accent focus-visible:ring-2 focus-visible:ring-green-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { NativeSelect };

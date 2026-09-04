import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-[5.2rem] min-h-[52px] w-full rounded-[12px] border border-input bg-white px-4 text-[1.55rem] text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-green-accent focus-visible:ring-2 focus-visible:ring-green-accent/25 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

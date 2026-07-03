import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-[8px] border border-input bg-white px-3 text-[1.4rem] text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-green-accent focus-visible:ring-2 focus-visible:ring-green-accent/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

"use client";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[8px] bg-neutral-cool p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[6px] px-2.5 py-1 text-[1.2rem] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-green-accent/40",
              active
                ? "bg-white text-green-dark shadow-sm"
                : "text-muted-foreground hover:text-green-dark",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

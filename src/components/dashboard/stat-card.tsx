"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
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
  /** Encoge el valor para que un nombre largo quede entero en una línea. */
  fitValue?: boolean;
};

function valueText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function longestWordLength(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  return words.reduce((max, word) => Math.max(max, word.length), 1);
}

function FitValue({
  text,
  maxRem,
  minRem,
  className,
  children,
}: {
  text: string;
  maxRem: number;
  minRem: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastWidth = -1;

    const fit = () => {
      const available = el.clientWidth;
      if (available <= 0 || Math.abs(available - lastWidth) < 0.5) return;
      lastWidth = available;

      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const maxPx = maxRem * root;
      el.style.fontSize = `${maxPx}px`;
      const needed = el.scrollWidth;
      const next =
        needed <= available + 1 ? maxPx : Math.max(12, ((maxPx * available) / needed) * 0.98);
      el.style.fontSize = `${next}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el.parentElement ?? el);
    return () => observer.disconnect();
  }, [text, maxRem, minRem]);

  const divisor = (Math.max(longestWordLength(text), 1) * 0.8).toFixed(2);

  return (
    <p
      ref={ref}
      className={cn("max-w-full whitespace-nowrap font-bold leading-none tracking-tight text-green-dark", className)}
      style={{ fontSize: `clamp(${minRem}rem, calc(100cqi / ${divisor}), ${maxRem}rem)` }}
      title={text || undefined}
    >
      {children}
    </p>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  iconClassName,
  className,
  compact = false,
  fitValue = false,
}: StatCardProps) {
  const labelClass = cn(
    "font-medium leading-snug text-muted-foreground",
    compact ? "text-[1.35rem]" : "text-[1.45rem]",
  );
  const hintClass = cn(
    "mt-1.5 leading-snug text-muted-foreground",
    compact ? "text-[1.25rem]" : "text-[1.35rem]",
  );
  const iconBox = (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[14px] bg-green-soft text-green-accent",
        compact ? "size-11" : "size-14",
        iconClassName,
      )}
    >
      <Icon className={compact ? "size-5" : "size-7"} />
    </div>
  );

  const text = valueText(value);
  const maxRem = compact ? 2.4 : 3.1;
  const minRem = compact ? 1.2 : 1.35;

  return (
    <div className={cn("dashboard-card min-w-0", compact ? "p-4" : "p-6", className)}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div
          className="min-w-0 flex-1"
          style={fitValue ? { containerType: "inline-size" } : undefined}
        >
          <p className={labelClass}>{label}</p>
          {fitValue ? (
            <FitValue text={text} maxRem={maxRem} minRem={minRem} className="mt-2">
              {value}
            </FitValue>
          ) : (
            <p
              className={cn(
                "mt-2 font-bold leading-tight text-green-dark wrap-break-word",
                compact
                  ? "text-[2.2rem] sm:text-[2.4rem]"
                  : "text-[2.6rem] sm:text-[3.1rem]",
              )}
            >
              {value}
            </p>
          )}
          {hint ? <p className={hintClass}>{hint}</p> : null}
        </div>
        {iconBox}
      </div>
    </div>
  );
}

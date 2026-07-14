"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function FadeInSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function FlashHighlight({
  active,
  children,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      className={cn(
        className,
        !reduce && active && "motion-safe:animate-[pulse_0.6s_ease-out_1] ring-2 ring-primary/30 rounded-md",
      )}
    >
      {children}
    </div>
  );
}

/** Discrete count-up for numeric KPI display strings that are formatPrice-ready numbers only. */
export function CountUpValue({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const total = 12;
    const start = display;
    const delta = value - start;
    let raf = 0;
    const tick = () => {
      frame += 1;
      const t = Math.min(1, frame / total);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(start + delta * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Intentionally remount-driven; do not depend on display to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <span className={cn("tabular-nums", className)}>
      {display.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}

export function AnimatedCollapse({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return open ? <>{children}</> : null;
  }
  return (
    <motion.div
      initial={false}
      animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

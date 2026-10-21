"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "gold" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface VipButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Texto mientras `loading` está activo. */
  loadingLabel?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const BASE =
  "palco-press inline-flex select-none items-center justify-center rounded-full font-palco-display font-bold tracking-[-0.005em] cursor-pointer disabled:cursor-not-allowed";

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm gap-1.5",
  md: "min-h-12 px-5 text-[15px] gap-2",
  lg: "min-h-14 px-6 text-base gap-2.5",
};

// Deshabilitado se distingue por color, no por transparencia: sigue legible.
const FILLED_DISABLED = "disabled:bg-palco-sunken disabled:text-palco-ink-3 disabled:border-transparent";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `bg-palco-700 text-white hover:bg-palco-600 active:bg-palco-800 ${FILLED_DISABLED}`,
  secondary: `bg-palco-900 text-palco-on-dark hover:bg-palco-800 ${FILLED_DISABLED}`,
  gold: `bg-palco-gold text-palco-900 hover:bg-palco-gold-strong ${FILLED_DISABLED}`,
  outline:
    "border border-palco-line-strong bg-palco-surface text-palco-ink hover:border-palco-ink-3 hover:bg-palco-ground disabled:text-palco-ink-3 disabled:border-palco-line",
  ghost: "bg-transparent text-palco-ink-2 hover:bg-palco-sunken hover:text-palco-ink disabled:text-palco-ink-3",
  danger: `bg-palco-danger text-white hover:bg-[#9c1f18] ${FILLED_DISABLED}`,
};

export const VipButton: React.FC<VipButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel = "Procesando…",
  fullWidth = false,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}) => (
  <motion.button
    type={type}
    className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading ? (
      <>
        <Loader2 aria-hidden className="size-4 shrink-0 animate-spin" />
        <span>{loadingLabel}</span>
      </>
    ) : (
      children
    )}
  </motion.button>
);

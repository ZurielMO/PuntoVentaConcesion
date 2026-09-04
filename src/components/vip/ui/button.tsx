"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { VIP_MOTION } from "@/lib/vip/motion";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "gold" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface VipButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const VipButton: React.FC<VipButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-headline-md font-bold tracking-wide transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C8643] focus-visible:ring-offset-2 disabled:opacity-45 disabled:pointer-events-none cursor-pointer rounded-xl active:scale-[0.98]";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "min-h-[44px] px-4 text-sm gap-1.5",
    md: "min-h-[52px] px-6 text-base gap-2",
    lg: "min-h-[58px] px-8 text-lg gap-2.5",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-[#0C8643] text-white hover:bg-[#0A6F38] active:bg-[#065C2C] shadow-[0_4px_16px_rgba(12,134,67,0.22)] hover:shadow-[0_6px_20px_rgba(12,134,67,0.3)] border border-[#0C8643]/20",
    secondary:
      "bg-[#102D24] text-white hover:bg-[#183C32] active:bg-[#0A1C16] shadow-sm border border-[#234D41]",
    gold:
      "bg-[#FADC06] text-black hover:brightness-95 active:brightness-90 shadow-[0_4px_16px_rgba(250,220,6,0.35)] border border-[#FADC06]",
    outline:
      "border border-[#DFE5E2] bg-white text-[#111614] hover:bg-[#F6F8F7] hover:border-[#0C8643] hover:text-[#0C8643] shadow-2xs",
    ghost:
      "bg-transparent text-[#4E5C56] hover:text-[#111614] hover:bg-[#ECEFEA]/60",
    danger:
      "bg-[#C43D3D] text-white hover:bg-[#A83232] active:bg-[#8C2828] shadow-sm",
  };

  return (
    <motion.button
      whileTap={!disabled && !loading ? { scale: VIP_MOTION.press.scale } : undefined}
      transition={{ duration: VIP_MOTION.press.duration }}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Procesando...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

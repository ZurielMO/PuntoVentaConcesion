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
    "inline-flex items-center justify-center font-[family-name:var(--font-montserrat)] font-bold tracking-wide transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4A34] focus-visible:ring-offset-2 disabled:opacity-45 disabled:pointer-events-none cursor-pointer rounded-xl active:scale-[0.98]";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "min-h-[44px] px-4 text-xs sm:text-sm gap-1.5",
    md: "min-h-[50px] px-6 text-sm sm:text-base gap-2",
    lg: "min-h-[56px] px-8 text-base sm:text-lg gap-2.5",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-r from-[#062E20] to-[#0D4A34] hover:from-[#093E2B] hover:to-[#115C41] active:from-[#041A12] active:to-[#082D1F] text-white shadow-[0_4px_16px_rgba(6,46,32,0.25)] hover:shadow-[0_6px_22px_rgba(197,160,89,0.22)] border border-[#C5A059]/30",
    secondary:
      "bg-[#0A3224] text-white hover:bg-[#0D4A34] active:bg-[#062319] shadow-sm border border-[#C5A059]/30",
    gold:
      "bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#062319] hover:brightness-105 active:brightness-95 shadow-[0_4px_16px_rgba(197,160,89,0.3)] border border-[#FFF8E7]/40",
    outline:
      "border border-[#E5EBE8] bg-white text-[#111827] hover:bg-[#F8FAF9] hover:border-[#0D4A34] hover:text-[#0D4A34] shadow-xs",
    ghost:
      "bg-transparent text-[#4B5563] hover:text-[#111827] hover:bg-[#ECEFEA]/60",
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

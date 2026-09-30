"use client";

import React from "react";

export type BadgeVariant =
  | "available"
  | "occupied"
  | "fast"
  | "premium"
  | "success"
  | "closed"
  | "info"
  | "neutral";

export interface VipBadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const VipBadge: React.FC<VipBadgeProps> = ({
  variant = "available",
  size = "md",
  dot = false,
  children,
  className = "",
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    available: {
      bg: "bg-[#0D4A34]/10",
      text: "text-[#0D4A34]",
      border: "border-[#0D4A34]/20",
      dotColor: "bg-[#0D4A34]",
    },
    occupied: {
      bg: "bg-[#C5A059]/15",
      text: "text-[#A67C2E]",
      border: "border-[#C5A059]/40",
      dotColor: "bg-[#D4AF37]",
    },
    fast: {
      bg: "bg-[#0D4A34]/10",
      text: "text-[#0D4A34]",
      border: "border-[#0D4A34]/20",
      dotColor: "bg-[#0D4A34]",
    },
    premium: {
      bg: "bg-[#C5A059]/15",
      text: "text-[#A67C2E]",
      border: "border-[#C5A059]/40",
      dotColor: "bg-[#D4AF37]",
    },
    success: {
      bg: "bg-[#0D4A34]/10",
      text: "text-[#0D4A34]",
      border: "border-[#0D4A34]/20",
      dotColor: "bg-[#0D4A34]",
    },
    closed: {
      bg: "bg-[#C43D3D]/10",
      text: "text-[#C43D3D]",
      border: "border-[#C43D3D]/20",
      dotColor: "bg-[#C43D3D]",
    },
    info: {
      bg: "bg-[#2C7DA0]/10",
      text: "text-[#2C7DA0]",
      border: "border-[#2C7DA0]/20",
      dotColor: "bg-[#2C7DA0]",
    },
    neutral: {
      bg: "bg-[#F1F4F2]",
      text: "text-[#4B5563]",
      border: "border-[#E5EBE8]",
      dotColor: "bg-[#9CA3AF]",
    },
  };

  const current = variantStyles[variant] || variantStyles.available;
  const sizeClass = size === "sm" ? "px-2.5 py-0.5 text-[11px] tracking-wide" : "px-3 py-1 text-xs tracking-wide";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-[family-name:var(--font-montserrat)] font-bold border ${sizeClass} select-none
        ${current.bg} ${current.text} ${current.border} ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dotColor} ${
            variant === "available" || variant === "fast" ? "animate-pulse" : ""
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

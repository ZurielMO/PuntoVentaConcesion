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
      bg: "bg-[#0C8643]/10",
      text: "text-[#0C8643]",
      border: "border-[#0C8643]/20",
      dotColor: "bg-[#0C8643]",
    },
    occupied: {
      bg: "bg-[#FADC06]/25",
      text: "text-[#8A7600]",
      border: "border-[#FADC06]/50",
      dotColor: "bg-[#FADC06]",
    },
    fast: {
      bg: "bg-[#0C8643]/10",
      text: "text-[#0C8643]",
      border: "border-[#0C8643]/20",
      dotColor: "bg-[#0C8643]",
    },
    premium: {
      bg: "bg-[#FADC06]/20",
      text: "text-[#8A7600]",
      border: "border-[#FADC06]/40",
      dotColor: "bg-[#FADC06]",
    },
    success: {
      bg: "bg-[#0C8643]/10",
      text: "text-[#0C8643]",
      border: "border-[#0C8643]/20",
      dotColor: "bg-[#0C8643]",
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
      bg: "bg-[#ECEFEA]",
      text: "text-[#4E5C56]",
      border: "border-[#DFE5E2]",
      dotColor: "bg-[#7E8E87]",
    },
  };

  const current = variantStyles[variant] || variantStyles.available;
  const sizeClass = size === "sm" ? "px-2.5 py-1 text-[11px] tracking-wide" : "px-3 py-1.5 text-sm tracking-wide";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-label-md font-bold border ${sizeClass} select-none
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

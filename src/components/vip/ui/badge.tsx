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
      bg: "bg-[#187B56]/10",
      text: "text-[#187B56]",
      border: "border-[#187B56]/20",
      dotColor: "bg-[#187B56]",
    },
    occupied: {
      bg: "bg-[#D99721]/10",
      text: "text-[#D99721]",
      border: "border-[#D99721]/20",
      dotColor: "bg-[#D99721]",
    },
    fast: {
      bg: "bg-[#187B56]/10",
      text: "text-[#187B56]",
      border: "border-[#187B56]/20",
      dotColor: "bg-[#187B56]",
    },
    premium: {
      bg: "bg-[#9E7844]/12",
      text: "text-[#9E7844]",
      border: "border-[#9E7844]/25",
      dotColor: "bg-[#9E7844]",
    },
    success: {
      bg: "bg-[#1F8A55]/10",
      text: "text-[#1F8A55]",
      border: "border-[#1F8A55]/20",
      dotColor: "bg-[#1F8A55]",
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
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px] tracking-wide" : "px-2.5 py-1 text-xs tracking-wide";

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

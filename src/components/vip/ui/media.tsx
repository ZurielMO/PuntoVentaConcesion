"use client";

import React, { useState } from "react";
import { Utensils, Sparkles, CupSoda, Coffee } from "lucide-react";

interface VipMediaProps {
  src?: string;
  alt: string;
  className?: string;
  categoria?: string;
}

export const VipMedia: React.FC<VipMediaProps> = ({
  src,
  alt,
  className = "",
  categoria,
}) => {
  const [hasError, setHasError] = useState(false);

  const getCategoryIcon = (cat?: string) => {
    const lower = (cat || "").toLowerCase();
    if (lower.includes("bebida") || lower.includes("cerveza") || lower.includes("drink")) {
      return <CupSoda className="w-5 h-5 text-[#9E7844]" />;
    }
    if (lower.includes("cafe") || lower.includes("café") || lower.includes("postre")) {
      return <Coffee className="w-5 h-5 text-[#9E7844]" />;
    }
    if (lower.includes("comida") || lower.includes("snack") || lower.includes("burger")) {
      return <Utensils className="w-5 h-5 text-[#9E7844]" />;
    }
    return <Sparkles className="w-5 h-5 text-[#9E7844]" />;
  };

  if (!src || hasError) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#ECEFEA] via-[#E4EAE6] to-[#D8E0DC] flex flex-col items-center justify-center p-3 text-center select-none ${className}`}
        aria-label={alt}
      >
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#187B56_1px,transparent_1px)] [background-size:12px_12px] opacity-15 pointer-events-none" />
        
        <div className="relative z-10 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-xs border border-[#187B56]/15 flex items-center justify-center shadow-xs mb-1">
          {getCategoryIcon(categoria)}
        </div>
        <span className="relative z-10 text-[10px] font-semibold text-[#4E5C56] tracking-wider uppercase line-clamp-1 max-w-[85%]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

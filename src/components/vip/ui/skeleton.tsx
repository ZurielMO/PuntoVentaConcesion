"use client";

import React from "react";

export const VipSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-[#E5EBE8] rounded-xl ${className}`}
    />
  );
};

export const VipRestaurantCardSkeleton = () => (
  <div className="w-full bg-white rounded-2xl sm:rounded-[24px] border border-[#E5EBE8] shadow-[0_4px_20px_rgba(6,46,32,0.04)] overflow-hidden flex flex-col">
    <VipSkeleton className="aspect-[16/10] w-full rounded-none" />
    <div className="p-4 sm:p-5 flex flex-col gap-2.5">
      <VipSkeleton className="h-5 sm:h-6 w-2/3" />
      <VipSkeleton className="h-3.5 w-1/2" />
      <div className="pt-2 border-t border-[#EEF2F0] flex justify-between items-center">
        <VipSkeleton className="h-5 w-20" />
        <VipSkeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  </div>
);

export const VipMenuItemSkeleton = () => (
  <div className="w-full bg-white rounded-2xl sm:rounded-[22px] p-3 sm:p-5 border border-[#E5EBE8] shadow-xs flex items-center justify-between gap-3">
    <VipSkeleton className="w-[76px] h-[76px] sm:hidden rounded-xl shrink-0" />
    <div className="flex flex-col gap-2 flex-1">
      <VipSkeleton className="h-5 w-2/3" />
      <VipSkeleton className="h-3.5 w-4/5 hidden sm:block" />
      <VipSkeleton className="h-5 w-20" />
    </div>
    <VipSkeleton className="w-11 h-11 sm:w-26 sm:h-26 rounded-2xl shrink-0" />
  </div>
);

export const VipHeroSkeleton = () => (
  <div className="w-full h-44 sm:h-56 bg-gradient-to-br from-[#041A12] via-[#062319] to-[#0A3224] rounded-2xl sm:rounded-[26px] p-6 sm:p-8 border border-[#C5A059]/25 flex flex-col justify-end gap-3 shadow-md">
    <VipSkeleton className="h-4 w-32 bg-white/10" />
    <VipSkeleton className="h-8 w-3/4 sm:w-1/2 bg-white/10" />
    <VipSkeleton className="h-4 w-2/3 sm:w-1/3 bg-white/10" />
  </div>
);

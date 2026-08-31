"use client";

import React from "react";

export const VipSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-[#DFE5E2] rounded-xl ${className}`}
    />
  );
};

export const VipRestaurantCardSkeleton = () => (
  <div className="w-full bg-white rounded-2xl border border-[#DFE5E2] shadow-xs overflow-hidden flex flex-col">
    <VipSkeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="p-2.5 sm:p-5 flex flex-col gap-2">
      <VipSkeleton className="h-4 sm:h-6 w-2/3" />
      <VipSkeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const VipMenuItemSkeleton = () => (
  <div className="w-full bg-white rounded-2xl p-2.5 sm:p-5 border border-[#DFE5E2] shadow-xs flex items-center justify-between gap-3">
    <VipSkeleton className="w-[72px] h-[72px] sm:hidden rounded-xl shrink-0" />
    <div className="flex flex-col gap-2 flex-1">
      <VipSkeleton className="h-5 w-2/3" />
      <VipSkeleton className="h-3.5 w-4/5 hidden sm:block" />
      <VipSkeleton className="h-5 w-16" />
    </div>
    <VipSkeleton className="w-11 h-11 sm:w-28 sm:h-28 rounded-xl shrink-0" />
  </div>
);

export const VipHeroSkeleton = () => (
  <div className="w-full h-36 sm:h-48 bg-[#102D24] rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-[#234D41] flex flex-col justify-end gap-3 shadow-sm">
    <VipSkeleton className="h-4 w-28 bg-[#183C32]" />
    <VipSkeleton className="h-7 w-3/4 sm:w-1/2 bg-[#183C32]" />
    <VipSkeleton className="h-4 w-2/3 sm:w-1/3 bg-[#183C32]" />
  </div>
);

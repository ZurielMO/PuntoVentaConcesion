"use client";

import React from "react";
import {
  VIP_PURCHASE_UNAVAILABLE_HINT,
  VIP_PURCHASE_UNAVAILABLE_TITLE,
} from "@/lib/vip/purchase-availability";

export const VipSalesClosedNotice: React.FC = () => (
  <div
    role="status"
    className="rounded-2xl border border-[#C43D3D]/25 bg-[#C43D3D]/8 px-4 py-3 text-[#171A19]"
  >
    <p className="font-headline-md text-base font-extrabold">{VIP_PURCHASE_UNAVAILABLE_TITLE}</p>
    <p className="font-body-md text-sm text-[#4E5C56] mt-1">{VIP_PURCHASE_UNAVAILABLE_HINT}</p>
  </div>
);

"use client";

import React from "react";
import { VipCartProvider } from "@/hooks/vip/use-vip-cart";
import { VipOrdersProvider } from "@/hooks/vip/use-vip-orders";
import { VipServiceStatusProvider } from "@/hooks/vip/use-vip-public-sales";
import { VipProductSheetProvider } from "@/hooks/vip/use-vip-product-sheet";

export function VipProviders({ children }: { children: React.ReactNode }) {
  return (
    <VipServiceStatusProvider>
      <VipCartProvider>
        <VipOrdersProvider>
          <VipProductSheetProvider>{children}</VipProductSheetProvider>
        </VipOrdersProvider>
      </VipCartProvider>
    </VipServiceStatusProvider>
  );
}

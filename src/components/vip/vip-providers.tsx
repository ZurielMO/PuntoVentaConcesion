"use client";

import React from "react";
import { VipCartProvider } from "@/hooks/vip/use-vip-cart";
import { VipOrdersProvider } from "@/hooks/vip/use-vip-orders";

export function VipProviders({ children }: { children: React.ReactNode }) {
  return (
    <VipCartProvider>
      <VipOrdersProvider>{children}</VipOrdersProvider>
    </VipCartProvider>
  );
}

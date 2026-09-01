"use client";

import { usePathname } from "next/navigation";
import { VipBottomNav } from "./bottom-nav";

const HIDE_NAV_PREFIXES = ["/servicio-palcos/central"];

export function VipMobileChrome() {
  const pathname = usePathname() || "";
  if (HIDE_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  return <VipBottomNav />;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VIP_LEGAL_PATHS } from "@/lib/vip/legal-config";
import { useVipCart } from "@/hooks/vip/use-vip-cart";

const STORAGE_KEY = "vip_cookie_notice_v1";
const HIDDEN_PREFIXES = ["/servicio-palcos/central", "/servicio-palcos/carrito", "/servicio-palcos/legal"];

export function VipCookieNotice() {
  const pathname = usePathname() || "";
  const { totalItems } = useVipCart();
  const [visible, setVisible] = useState(false);
  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (hidden) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    setVisible(true);
  }, [hidden]);

  if (hidden || !visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Si el navegador bloquea el almacenamiento, el aviso solo se oculta en esta visita.
    }
    setVisible(false);
  };

  const raised = totalItems > 0;

  return (
    <div
      role="region"
      aria-label="Aviso de almacenamiento esencial"
      className={`fixed inset-x-3 z-[45] md:inset-x-auto md:left-1/2 md:w-full md:max-w-xl md:-translate-x-1/2 ${
        raised
          ? "bottom-[calc(9.25rem+env(safe-area-inset-bottom))] md:bottom-28"
          : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-4"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[#E5EBE8] bg-white/95 px-3.5 py-2.5 shadow-[0_8px_28px_rgba(6,46,32,0.08)] backdrop-blur-md">
        <p className="min-w-0 flex-1 text-xs leading-snug text-[#4B5563]">
          Guardamos tu carrito en este dispositivo.{" "}
          <Link href={VIP_LEGAL_PATHS.cookies} className="font-semibold text-[#0D4A34] underline-offset-2 hover:underline">
            Cookies
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 min-h-9 rounded-xl px-3 text-sm font-bold text-[#062E20] hover:bg-[#0D4A34]/8 cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

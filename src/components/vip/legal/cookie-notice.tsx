"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VIP_LEGAL_PATHS } from "@/lib/vip/legal-config";

const STORAGE_KEY = "vip_cookie_notice_v1";
const HIDDEN_PREFIXES = ["/servicio-palcos/central", "/servicio-palcos/carrito", "/servicio-palcos/legal"];

export function VipCookieNotice() {
  const pathname = usePathname() || "";
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

  return (
    <div
      role="region"
      aria-label="Aviso de almacenamiento esencial"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[45] md:inset-x-auto md:bottom-5 md:left-5 md:max-w-sm"
    >
      <div className="flex items-center gap-3 rounded-[var(--radius-palco-md)] bg-palco-900 py-2.5 pl-4 pr-2 text-palco-on-dark shadow-palco-float">
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-palco-on-dark-2">
          Guardamos tu carrito en este dispositivo.{" "}
          <Link href={VIP_LEGAL_PATHS.cookies} className="font-semibold text-palco-on-dark underline underline-offset-2">
            Cookies
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="palco-press min-h-10 shrink-0 rounded-full px-3.5 text-sm font-semibold text-palco-gold hover:bg-white/10"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

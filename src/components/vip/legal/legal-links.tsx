"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VIP_LEGAL_PATHS } from "@/lib/vip/legal-config";

const LINKS = [
  { href: VIP_LEGAL_PATHS.terms, label: "Términos" },
  { href: VIP_LEGAL_PATHS.privacy, label: "Privacidad" },
  { href: VIP_LEGAL_PATHS.cookies, label: "Cookies" },
];

export function VipLegalLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "";

  return (
    <footer className={`flex flex-col items-center gap-1 text-center ${className}`}>
      <nav aria-label="Información legal" className="flex flex-wrap items-center justify-center gap-x-1 text-[13px] text-palco-ink-3">
        {LINKS.map((link, index) => {
          const current = pathname.startsWith(link.href);
          return (
            <span key={link.href} className="inline-flex items-center gap-1">
              {index > 0 && <span aria-hidden>·</span>}
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-full px-2 underline-offset-4 hover:text-palco-ink hover:underline ${
                  current ? "font-semibold text-palco-ink" : ""
                }`}
              >
                {link.label}
              </Link>
            </span>
          );
        })}
      </nav>
      <p className="text-xs text-palco-ink-3">Servicio Palcos · Club León · Estadio León</p>
    </footer>
  );
}

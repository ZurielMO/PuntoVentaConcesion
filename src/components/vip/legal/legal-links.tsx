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
    <nav
      aria-label="Información legal"
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#7E8E87] ${className}`}
    >
      {LINKS.map((link, index) => {
        const current = pathname.startsWith(link.href);
        return (
          <span key={link.href} className="inline-flex items-center gap-3">
            {index > 0 && <span aria-hidden className="text-[#C5A059]/70">·</span>}
            <Link
              href={link.href}
              aria-current={current ? "page" : undefined}
              className={`min-h-8 inline-flex items-center font-medium underline-offset-4 hover:text-[#0D4A34] hover:underline ${
                current ? "text-[#0D4A34] font-semibold" : ""
              }`}
            >
              {link.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}

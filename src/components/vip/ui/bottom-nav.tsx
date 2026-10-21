"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, House, ReceiptText, ShoppingBag } from "lucide-react";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { formatVipPrice } from "@/lib/vip/money";

const TABS = [
  { href: "/servicio-palcos/inicio", label: "Menú", Icon: House, match: ["/servicio-palcos/inicio", "/servicio-palcos/restaurante"] },
  { href: "/servicio-palcos/guia", label: "Mi pedido", Icon: ReceiptText, match: ["/servicio-palcos/guia"] },
] as const;

/** La píldora del carrito crece con el primer producto y confirma cada agregado en su lugar. */
function CartPill() {
  const { totalItems, subtotal, lastAdded, ready } = useVipCart();
  const reduceMotion = useReducedMotion();
  const [flash, setFlash] = useState<{ key: number; text: string } | null>(null);
  const filled = ready && totalItems > 0;

  useEffect(() => {
    if (!lastAdded) return;
    const text = `${lastAdded.cantidad > 1 ? `${lastAdded.cantidad} × ` : ""}${lastAdded.nombre}`;
    setFlash({ key: lastAdded.key, text });
    const id = window.setTimeout(() => setFlash(null), 1700);
    return () => window.clearTimeout(id);
  }, [lastAdded]);

  const swap = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8, filter: "blur(2px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -8, filter: "blur(2px)" },
      };

  return (
    <motion.div layout={!reduceMotion} transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }} className={filled ? "min-w-0 flex-1" : ""}>
      <Link
        href="/servicio-palcos/carrito"
        aria-label={
          filled
            ? `Ver carrito: ${totalItems} ${totalItems === 1 ? "producto" : "productos"}, ${formatVipPrice(subtotal)}`
            : "Ver carrito, vacío"
        }
        className={`palco-press flex h-12 items-center gap-2.5 rounded-full font-palco-display text-[15px] font-bold ${
          filled
            ? "bg-palco-700 pl-2 pr-4 text-white shadow-palco-float hover:bg-palco-600"
            : "border border-palco-line px-4 text-palco-ink-2"
        }`}
      >
        <span className="relative flex size-9 shrink-0 items-center justify-center">
          <ShoppingBag aria-hidden className="size-5" />
          {filled && (
            <span
              key={lastAdded?.key || 0}
              className="palco-num palco-bump absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-palco-gold px-1 text-[11px] font-extrabold text-palco-900"
            >
              {totalItems}
            </span>
          )}
        </span>
        {filled ? (
          <span className="relative flex min-w-0 flex-1 items-center justify-between gap-3 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              {flash ? (
                <motion.span key={`f-${flash.key}`} {...swap} transition={{ duration: 0.2 }} className="flex min-w-0 items-center gap-1.5">
                  <Check aria-hidden className="size-4 shrink-0 text-palco-gold" />
                  <span className="truncate">{flash.text}</span>
                </motion.span>
              ) : (
                <motion.span key="label" {...swap} transition={{ duration: 0.2 }} className="truncate">
                  Ver carrito
                </motion.span>
              )}
            </AnimatePresence>
            <span className="palco-num shrink-0">{formatVipPrice(subtotal)}</span>
          </span>
        ) : (
          <span className="pr-1 text-sm font-semibold">Carrito</span>
        )}
      </Link>
      <span className="sr-only" aria-live="polite">
        {flash ? `${flash.text} agregado al carrito` : ""}
      </span>
    </motion.div>
  );
}

export const VipBottomNav: React.FC = () => {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="Navegación de Servicio Palcos"
      className="palco-safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-palco-line bg-palco-surface md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-center gap-1 px-3 pt-2">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match.some((prefix) => pathname.startsWith(prefix));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`palco-press flex h-12 w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] ${
                active ? "font-bold text-palco-900" : "font-medium text-palco-ink-3"
              }`}
            >
              <Icon aria-hidden className={`size-[22px] ${active ? "stroke-[2.2]" : "stroke-[1.8]"}`} />
              {label}
            </Link>
          );
        })}
        <div className="ml-auto flex min-w-0 flex-1 justify-end">
          <CartPill />
        </div>
      </div>
    </nav>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ReceiptText, ShoppingBag, X } from "lucide-react";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { formatVipPrice } from "@/lib/vip/money";

export interface VipTopBarProps {
  title?: string;
  subtitle?: string;
  variant?: "home" | "linear" | "modal";
  onBack?: () => void;
  /** Acciones extra a la derecha (p. ej. compartir el menú). */
  actions?: React.ReactNode;
  /** Oculta el acceso al carrito (en el propio checkout). */
  hideCart?: boolean;
  /** `p` cuando la página ya tiene su propio h1. */
  titleTag?: "h1" | "p";
}

const CREST_SRC = "/brand/club-leon-fc.png";

export function VipBrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CREST_SRC} alt="" width={28} height={34} className="h-[34px] w-auto shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-palco-display text-[15px] font-bold tracking-[-0.01em] text-palco-on-dark">
          Servicio Palcos
        </span>
        <span className="mt-1 hidden text-xs text-palco-on-dark-2 min-[380px]:block">Club León · Estadio León</span>
      </span>
    </span>
  );
}

/** Botón del carrito para escritorio: muestra conteo y subtotal y late al agregar. */
function DesktopCartButton() {
  const { totalItems, subtotal, lastAdded, ready } = useVipCart();
  const filled = ready && totalItems > 0;
  return (
    <>
    <span className="sr-only hidden md:inline" aria-live="polite">
      {lastAdded ? `${lastAdded.nombre} agregado al carrito` : ""}
    </span>
    <Link
      href="/servicio-palcos/carrito"
      aria-label={filled ? `Ver carrito: ${totalItems} ${totalItems === 1 ? "producto" : "productos"}, ${formatVipPrice(subtotal)}` : "Ver carrito"}
      className={`palco-press hidden h-10 items-center gap-2 rounded-full pl-3.5 pr-4 font-palco-display text-sm font-bold md:inline-flex ${
        filled
          ? "bg-palco-gold text-palco-900 hover:bg-palco-gold-strong"
          : "border border-white/20 text-palco-on-dark hover:border-white/40 hover:bg-white/5"
      }`}
    >
      <ShoppingBag aria-hidden className="size-[18px]" />
      {filled ? (
        <span key={lastAdded?.key || 0} className="palco-num palco-bump inline-flex items-center gap-2">
          <span>{totalItems}</span>
          <span aria-hidden className="h-4 w-px bg-palco-900/25" />
          <span>{formatVipPrice(subtotal)}</span>
        </span>
      ) : (
        <span>Carrito</span>
      )}
    </Link>
    </>
  );
}

export const VipTopBar: React.FC<VipTopBarProps> = ({
  title,
  subtitle,
  variant = "home",
  onBack,
  actions,
  hideCart = false,
  titleTag: TitleTag = "h1",
}) => {
  const router = useRouter();
  const pathname = usePathname() || "";
  const onGuide = pathname.startsWith("/servicio-palcos/guia");

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <header className="palco-on-dark sticky top-0 z-40 bg-palco-900 text-palco-on-dark">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 md:h-16 md:px-6">
        {variant === "home" ? (
          <Link href="/servicio-palcos/inicio" aria-label="Servicio Palcos, inicio" className="rounded-lg">
            <VipBrandMark />
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              aria-label={variant === "modal" ? "Cerrar" : "Regresar"}
              className="palco-press -ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-palco-on-dark hover:bg-white/10"
            >
              {variant === "modal" ? <X aria-hidden className="size-5" /> : <ArrowLeft aria-hidden className="size-5" />}
            </button>
            <div className="flex min-w-0 flex-col">
              <TitleTag className="truncate font-palco-display text-[17px] font-bold leading-tight tracking-[-0.01em] text-palco-on-dark">
                {title || "Servicio Palcos"}
              </TitleTag>
              {subtitle && <span className="truncate text-xs text-palco-on-dark-2">{subtitle}</span>}
            </div>
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {actions}
          <Link
            href="/servicio-palcos/guia"
            aria-current={onGuide ? "page" : undefined}
            className={`palco-press hidden h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold md:inline-flex ${
              onGuide ? "bg-white/10 text-palco-on-dark" : "text-palco-on-dark-2 hover:bg-white/10 hover:text-palco-on-dark"
            }`}
          >
            <ReceiptText aria-hidden className="size-[18px]" />
            Mi pedido
          </Link>
          {!hideCart && <DesktopCartButton />}
        </div>
      </div>
    </header>
  );
};

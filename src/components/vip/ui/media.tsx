"use client";

import React, { useEffect, useRef, useState } from "react";
import { CupSoda, Popcorn, IceCreamCone, Package, UtensilsCrossed } from "lucide-react";
import { categoryKeyFromLabel } from "@/lib/vip/catalog";

interface VipMediaProps {
  src?: string;
  alt: string;
  className?: string;
  categoria?: string;
  /**
   * `cover` llena el marco; `contain` muestra la imagen completa;
   * `brand` decide al cargar: si la imagen es casi cuadrada (un logotipo) en un marco ancho,
   * la muestra completa sobre blanco en lugar de recortarla (el gris queda para "cargando").
   */
  fit?: "cover" | "contain" | "brand";
  /** Carga de inmediato (primer pantallazo). El resto espera a estar cerca de la vista. */
  priority?: boolean;
  /** Fondo detrás de imágenes `contain` (fotos de producto sobre blanco). */
  backdrop?: string;
}

const FALLBACK_ICON = {
  bebidas: CupSoda,
  botanas: Popcorn,
  postres: IceCreamCone,
  combos: Package,
  comida: UtensilsCrossed,
} as const;

// Las imágenes del catálogo pesan 1–2 MB: solo se piden cuando están a punto de verse.
const NEAR_VIEWPORT = "320px 320px";

export const VipMedia: React.FC<VipMediaProps> = ({
  src,
  alt,
  className = "",
  categoria,
  fit = "cover",
  priority = false,
  backdrop = "bg-palco-surface",
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [logoMode, setLogoMode] = useState(false);
  const [near, setNear] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);

  const evaluate = (img: HTMLImageElement) => {
    const done = () => {
      if (fit === "brand") {
        const frame = frameRef.current;
        if (frame && img.naturalWidth && img.naturalHeight) {
          const imageRatio = img.naturalWidth / img.naturalHeight;
          const frameRatio = frame.clientWidth / Math.max(1, frame.clientHeight);
          setLogoMode(frameRatio / imageRatio > 1.35);
        }
      }
      setLoaded(true);
    };
    // Se muestra ya decodificada: así el marco no queda en blanco a medio pintar.
    if (typeof img.decode === "function") img.decode().then(done, done);
    else done();
  };

  useEffect(() => {
    if (near || !src) return;
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: NEAR_VIEWPORT },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near, src]);

  // Al cambiar de imagen se reinicia; las que ya estaban en caché terminan antes de hidratar
  // y no reciben onLoad, así que se evalúan aquí.
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    setLogoMode(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) evaluate(img);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, near]);

  if (!src || failed) {
    const Icon = FALLBACK_ICON[categoryKeyFromLabel(categoria) || "comida"];
    return (
      <span
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-palco-sunken text-palco-ink-3 ${className}`}
      >
        <Icon aria-hidden className="size-[28%] max-h-10 min-h-5 max-w-10 min-w-5 stroke-[1.5]" />
      </span>
    );
  }

  const contain = fit === "contain" || logoMode;
  const ground = logoMode ? "bg-palco-surface" : contain ? backdrop : "bg-palco-sunken";

  return (
    <span ref={frameRef} className={`relative block overflow-hidden ${loaded ? ground : "palco-skeleton"} ${className}`}>
      {near && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          data-loaded={loaded ? "true" : "false"}
          onLoad={(event) => evaluate(event.currentTarget)}
          onError={() => setFailed(true)}
          className={`palco-img palco-lift-media relative size-full ${contain ? "object-contain" : "object-cover"} ${
            logoMode ? "p-3 sm:p-5" : ""
          }`}
        />
      )}
    </span>
  );
};

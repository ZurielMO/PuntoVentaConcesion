"use client";

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { X } from "lucide-react";

export interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleClassName?: string;
  /** Texto de apoyo bajo el título (también describe el diálogo para lectores de pantalla). */
  description?: string;
  children: React.ReactNode;
  /** Barra fija al pie: acciones principales siempre visibles. */
  footer?: React.ReactNode;
  /** Imagen a sangre arriba del contenido; el título pasa debajo de ella. */
  media?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const WIDTH: Record<NonNullable<VipModalProps["maxWidth"]>, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useIsomorphicLayoutEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

/**
 * Diálogo del storefront: hoja inferior en el teléfono (se arrastra hacia abajo para cerrar)
 * y ventana centrada en escritorio. Atrapa el foco, lo devuelve al cerrar y bloquea el scroll.
 */
export const VipModal: React.FC<VipModalProps> = ({
  isOpen,
  onClose,
  title,
  titleClassName,
  description,
  children,
  footer,
  media,
  maxWidth = "md",
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();
  const reduceMotion = useReducedMotion();
  const desktop = useIsDesktop();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setPortalTarget((document.querySelector(".palco-app") as HTMLElement | null) || document.body);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const preferred = panel.querySelector<HTMLElement>("[data-autofocus]");
      (preferred || panel).focus({ preventScroll: true });
    }, 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      );
      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusFirst);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      const target = returnFocusRef.current;
      if (target && document.contains(target)) target.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onCloseRef.current();
  }, []);

  const sheetMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : desktop
      ? {
          initial: { opacity: 0, scale: 0.97, y: 8 },
          animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] as const } },
          exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const } },
        }
      : {
          initial: { y: "100%" },
          animate: { y: 0, transition: { duration: 0.34, ease: [0.32, 0.72, 0, 1] as const } },
          exit: { y: "100%", transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const } },
        };

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[#04170f]/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "Detalle"}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            {...sheetMotion}
            drag={!desktop && !reduceMotion ? "y" : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            className={`relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-palco-xl)] bg-palco-surface text-palco-ink shadow-palco-sheet outline-none sm:max-h-[86dvh] sm:rounded-[var(--radius-palco-xl)] sm:shadow-palco-float ${WIDTH[maxWidth]}`}
          >
            {/* Zona de agarre: arrastrar desde aquí cierra la hoja en el teléfono */}
            <div
              className="absolute inset-x-0 top-0 z-20 flex h-6 cursor-grab touch-none justify-center pt-2 active:cursor-grabbing sm:hidden"
              onPointerDown={(event) => dragControls.start(event)}
              aria-hidden
            >
              <span className={`h-1 w-10 rounded-full ${media ? "bg-white/80" : "bg-palco-line-strong"}`} />
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className={`palco-press absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full ${
                media
                  ? "bg-white/90 text-palco-ink shadow-palco-raise hover:bg-white"
                  : "bg-palco-sunken text-palco-ink-2 hover:text-palco-ink"
              }`}
            >
              <X aria-hidden className="size-5" />
            </button>

            <div className="palco-scroll min-h-0 flex-1 overflow-y-auto">
              {media}
              {(title || description) && (
                <div
                  className={`px-5 sm:px-7 ${media ? "pt-5" : "pt-7 sm:pt-6"} ${children ? "pb-1" : "pb-5"}`}
                  onPointerDown={media ? undefined : (event) => dragControls.start(event)}
                >
                  {title && (
                    <h2
                      id={titleId}
                      className={`pr-12 font-palco-display text-[1.375rem] font-bold leading-tight tracking-[-0.01em] text-palco-ink ${titleClassName ?? ""}`}
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-1.5 text-[15px] leading-relaxed text-palco-ink-2">
                      {description}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-4 px-5 pb-6 pt-4 sm:px-7">{children}</div>
            </div>

            {footer && (
              <div className="palco-safe-bottom border-t border-palco-line bg-palco-surface px-5 pt-3 sm:px-7 sm:pb-5">
                {footer}
              </div>
            )}
            {!footer && <div className="palco-safe-bottom sm:hidden" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalTarget,
  );
};

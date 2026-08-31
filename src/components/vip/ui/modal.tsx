"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { VIP_MOTION } from "@/lib/vip/motion";
import { X } from "lucide-react";

export interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleClassName?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const VipModal: React.FC<VipModalProps> = ({
  isOpen,
  onClose,
  title,
  titleClassName,
  children,
  maxWidth = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title || "Detalle"}
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            variants={VIP_MOTION.modal.backdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-[#0A1C16]/70 backdrop-blur-md"
          />

          {/* Modal / Sheet Container */}
          <motion.div
            variants={VIP_MOTION.modal.sheet}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`
              relative w-full ${maxWidthStyles[maxWidth]} bg-white rounded-t-[28px] sm:rounded-[24px]
              p-5 sm:p-7 shadow-[0_24px_60px_rgba(10,28,22,0.24)] border border-[#DFE5E2]
              max-h-[88vh] flex flex-col z-10 text-[#111614] pb-[max(1.25rem,env(safe-area-inset-bottom))]
            `}
          >
            {/* Grabber indicator for mobile */}
            <div className="w-12 h-1.5 bg-[#DFE5E2] rounded-full mx-auto mb-3.5 sm:hidden shrink-0" />

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E9EFEB] mb-4 shrink-0">
                <h3 className={`font-headline-md text-base sm:text-lg font-extrabold text-[#111614] tracking-tight ${titleClassName ?? ""}`}>
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-[#F6F8F7] hover:bg-[#ECEFEA] text-[#4E5C56] hover:text-[#111614] flex items-center justify-center transition-colors cursor-pointer border border-[#DFE5E2]/60 active:scale-95 shrink-0"
                  aria-label="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content Body */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

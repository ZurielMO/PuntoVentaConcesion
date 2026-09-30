"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { formatVipMxn } from "@/lib/vip/money";
import { motion, AnimatePresence } from "motion/react";

export const VipCartFloatingBar: React.FC = () => {
  const { items, totalItems, subtotal } = useVipCart();

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 28 }}
        className="fixed bottom-[74px] md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none"
      >
        <div className="max-w-md mx-auto pointer-events-auto">
          <Link
            href="/servicio-palcos/carrito"
            className="flex items-center justify-between bg-gradient-to-r from-[#041A12] via-[#062319] to-[#0A3224] text-white px-5 py-3.5 rounded-2xl shadow-[0_16px_40px_rgba(4,26,18,0.4)] transition-all hover:scale-[1.01] active:scale-[0.98] group cursor-pointer border border-[#C5A059]/35 select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-[#D4AF37] border border-[#C5A059]/30 shadow-xs">
                <ShoppingBag className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-[family-name:var(--font-montserrat)] text-base sm:text-lg font-extrabold text-white">
                    {formatVipMxn(subtotal)}
                  </span>
                </div>
                <span className="text-[11px] text-[#C9D5CF] font-semibold">
                  {totalItems} {totalItems === 1 ? "artículo agregado" : "artículos agregados"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-[family-name:var(--font-montserrat)] text-xs sm:text-sm font-black bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#062319] px-4 py-2 rounded-xl shadow-xs group-hover:brightness-105 transition-all border border-[#FFF8E7]/40">
              <span>Ir al Carrito</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

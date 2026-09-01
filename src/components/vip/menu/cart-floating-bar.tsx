"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { motion, AnimatePresence } from "motion/react";

export const VipCartFloatingBar: React.FC = () => {
  const { items, totalItems, total } = useVipCart();

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
            className="flex items-center justify-between bg-gradient-to-r from-[#102D24] via-[#187B56] to-[#102D24] text-white px-5 py-3.5 rounded-2xl shadow-[0_14px_36px_rgba(10,28,22,0.35)] transition-all hover:scale-[1.01] active:scale-[0.98] group cursor-pointer border border-[#187B56]/40 select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/10 shadow-xs">
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-headline-md text-base sm:text-lg font-extrabold text-white">
                    ${total}.00 MXN
                  </span>
                </div>
                <span className="text-[11px] text-[#D3DCD7] font-semibold">
                  {totalItems} {totalItems === 1 ? "artículo agregado" : "artículos agregados"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-headline-md text-xs sm:text-sm font-extrabold bg-[#9E7844] text-white px-4 py-2 rounded-xl shadow-xs group-hover:bg-[#B3894E] transition-all border border-[#C5A059]/30">
              <span>Ir al Carrito</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils, ShoppingBag } from "lucide-react";
import { useVipCart } from "@/hooks/vip/use-vip-cart";
import { motion } from "motion/react";

export const VipBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { totalItems } = useVipCart();

  const navItems = [
    { href: "/servicio-palcos/inicio", label: "Menú", icon: Utensils },
    {
      href: "/servicio-palcos/carrito",
      label: "Carrito",
      icon: ShoppingBag,
      badge: totalItems > 0 ? totalItems : undefined,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-[#DFE5E2] px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(10,28,22,0.06)]"
      aria-label="Navegación principal del servicio a palcos"
    >
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isMenu = item.href === "/servicio-palcos/inicio";
          const isActive = isMenu
            ? pathname === item.href || pathname.startsWith("/servicio-palcos/restaurante")
            : pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative min-h-[44px] flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all select-none
                ${isActive ? "text-[#187B56] font-bold" : "text-[#7E8E87] hover:text-[#111614] font-medium"}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="vipBottomNavActivePill"
                  className="absolute inset-0 bg-[#187B56]/10 rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />

                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-4 px-1 rounded-full bg-[#9E7844] text-white text-[9px] font-extrabold flex items-center justify-center border border-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] font-label-sm font-semibold mt-0.5 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

"use client";

import React from "react";
import { Star } from "lucide-react";
import { motion } from "motion/react";

interface VipBadgeHeaderProps {
  nombre: string;
  email?: string;
  nivel: string;
}

function initialsFromName(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "IN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export const VipBadgeHeader: React.FC<VipBadgeHeaderProps> = ({ nombre, email, nivel }) => {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center pt-2 pb-4 text-center"
    >
      <div className="relative">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-3 border-[#187B56] shadow-md bg-[#187B56] text-white flex items-center justify-center font-extrabold text-2xl">
          {initialsFromName(nombre)}
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#9E7844] text-white flex items-center justify-center border-2 border-white shadow-md">
          <Star className="w-4 h-4 fill-current stroke-[2.5]" />
        </div>
      </div>

      <h2 className="font-headline-md text-xl sm:text-2xl font-extrabold text-[#171A19] mt-4">
        {nombre}
      </h2>
      <span className="font-label-md text-xs sm:text-sm font-bold text-[#9E7844] mt-1 bg-[#9E7844]/10 px-3 py-0.5 rounded-full border border-[#9E7844]/25">
        {nivel}
      </span>
      {email ? <p className="font-body-md text-xs text-[#66706B] mt-1">{email}</p> : null}
    </motion.section>
  );
};

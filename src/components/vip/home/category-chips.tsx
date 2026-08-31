"use client";

import React from "react";
import type { VipCategory } from "@/lib/vip/types";
import { Utensils, Coffee, Wine, Sparkles } from "lucide-react";

interface CategoryChipsProps {
  categories: VipCategory[];
  activeCategory: VipCategory;
  onSelectCategory: (cat: VipCategory) => void;
}

export const VipCategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "comida":
      case "hamburguesas":
        return <Utensils className="w-3.5 h-3.5" />;
      case "snacks":
        return <Coffee className="w-3.5 h-3.5" />;
      case "bebidas":
        return <Wine className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <nav className="overflow-x-auto no-scrollbar py-1" aria-label="Filtro de categorías">
      <ul className="flex items-center gap-2">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <li key={cat}>
              <button
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`
                  inline-flex items-center gap-2 min-h-[42px] px-4 rounded-xl font-label-md text-xs sm:text-sm font-semibold
                  whitespace-nowrap transition-all duration-150 cursor-pointer select-none active:scale-95
                  ${
                    isSelected
                      ? "bg-[#187B56] text-white shadow-[0_4px_12px_rgba(24,123,86,0.25)] font-bold border border-[#187B56]"
                      : "bg-white text-[#4E5C56] border border-[#DFE5E2] hover:border-[#187B56]/60 hover:text-[#111614] hover:bg-[#F6F8F7]"
                  }
                `}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

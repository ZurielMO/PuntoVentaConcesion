"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { VipProduct } from "@/lib/vip/types";
import { productAvailability, type VipProductAvailability } from "@/lib/vip/availability";
import { VipProductDetailModal } from "@/components/vip/menu/product-detail-modal";
import { useVipCart } from "./use-vip-cart";
import { useVipPublicSalesOpen } from "./use-vip-public-sales";

interface SheetContext {
  /** Abre el detalle del producto (hoja inferior en el teléfono). */
  openProduct: (product: VipProduct, restaurantName?: string) => void;
  /** Agrega directo si no hay opciones que elegir; si las hay, abre el detalle. */
  quickAdd: (product: VipProduct, restaurantName?: string) => void;
  availabilityOf: (product: VipProduct) => VipProductAvailability;
}

const ProductSheetContext = createContext<SheetContext | null>(null);

const hasChoices = (product: VipProduct) => (product.gruposOpciones || []).some((group) => group.opciones.length > 0);

export function VipProductSheetProvider({ children }: { children: React.ReactNode }) {
  const { addItem } = useVipCart();
  const sales = useVipPublicSalesOpen();
  const [open, setOpen] = useState<{ product: VipProduct; restaurantName?: string } | null>(null);
  // El producto se conserva mientras la hoja se anima al cerrar.
  const [visible, setVisible] = useState(false);

  const availabilityOf = useCallback((product: VipProduct) => productAvailability(product, sales), [sales]);

  const openProduct = useCallback((product: VipProduct, restaurantName?: string) => {
    setOpen({ product, restaurantName });
    setVisible(true);
  }, []);

  const add = useCallback(
    (product: VipProduct, options?: Parameters<typeof addItem>[1]) => {
      const availability = productAvailability(product, sales);
      if (!availability.canAdd) return false;
      // Misma regla que antes: con preventa abierta se arma el pedido aunque el POS no tenga existencia.
      return addItem(product, { ...options, permitirSinStock: sales.preordersEnabled });
    },
    [addItem, sales],
  );

  const quickAdd = useCallback(
    (product: VipProduct, restaurantName?: string) => {
      if (hasChoices(product)) openProduct(product, restaurantName);
      else add(product, { cantidad: 1 });
    },
    [add, openProduct],
  );

  const value = useMemo(() => ({ openProduct, quickAdd, availabilityOf }), [openProduct, quickAdd, availabilityOf]);

  return (
    <ProductSheetContext.Provider value={value}>
      {children}
      <VipProductDetailModal
        product={open?.product || null}
        restaurantName={open?.restaurantName}
        isOpen={visible}
        onClose={() => setVisible(false)}
        availability={open ? productAvailability(open.product, sales) : { state: "loading", canAdd: false }}
        onAddToCart={(product, quantity, selectedOptions, notes) => {
          const added = add(product, { cantidad: quantity, opcionesSeleccionadas: selectedOptions, instrucciones: notes });
          if (added) setVisible(false);
        }}
      />
    </ProductSheetContext.Provider>
  );
}

export function useVipProductSheet() {
  const context = useContext(ProductSheetContext);
  if (!context) throw new Error("useVipProductSheet must be used within VipProductSheetProvider");
  return context;
}

"use client";

import React, { createContext, useCallback, useContext, useState, useEffect, useMemo } from "react";
import type { VipCartItem, VipProduct } from "@/lib/vip/types";
import { vipToast } from "./use-vip-toast";

interface AddItemOptions {
  opcionesSeleccionadas?: {
    grupoTitulo: string;
    opcionNombre: string;
    precioExtra: number;
    id?: string;
  }[];
  instrucciones?: string;
  cantidad?: number;
}

interface VipCartContextType {
  items: VipCartItem[];
  addItem: (producto: VipProduct, options?: AddItemOptions) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  totalItems: number;
  subtotal: number;
  cargoServicio: number;
  descuento: number;
  total: number;
  restaurantId: string | null;
  restaurantNombre: string | null;
  setRestaurantInfo: (id: string, nombre: string) => void;
}

const VipCartContext = createContext<VipCartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "vip_arena_cart_v1";

export function VipCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<VipCartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantNombre, setRestaurantNombre] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const setRestaurantInfo = (id: string, nombre: string) => {
    setRestaurantId(id);
    setRestaurantNombre(nombre);
  };

  const addItem = (producto: VipProduct, options?: AddItemOptions) => {
    if (producto.disponible === false) {
      vipToast.error("Producto agotado", {
        id: `vip-cart-stock-${producto.id}`,
        description: "No hay inventario en el POS para venderlo.",
      });
      return;
    }
    const qty = options?.cantidad && options.cantidad > 0 ? options.cantidad : 1;
    const extrasPrice =
      options?.opcionesSeleccionadas?.reduce((sum, opt) => sum + opt.precioExtra, 0) || 0;
    const precioUnitario = producto.precio + extrasPrice;

    const optionsKey = JSON.stringify(options?.opcionesSeleccionadas || []);
    const existing = items.find(
      (it) =>
        it.producto.id === producto.id &&
        JSON.stringify(it.opcionesSeleccionadas || []) === optionsKey,
    );
    const nextQty = (existing?.cantidad || 0) + qty;

    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex(
        (it) =>
          it.producto.id === producto.id &&
          JSON.stringify(it.opcionesSeleccionadas || []) === optionsKey,
      );

      if (existingIdx > -1) {
        const updated = [...prevItems];
        const prevItem = updated[existingIdx];
        const newQty = prevItem.cantidad + qty;
        updated[existingIdx] = {
          ...prevItem,
          cantidad: newQty,
          subtotal: newQty * precioUnitario,
          instrucciones: options?.instrucciones || prevItem.instrucciones,
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          producto,
          cantidad: qty,
          opcionesSeleccionadas: options?.opcionesSeleccionadas,
          instrucciones: options?.instrucciones,
          precioUnitario,
          subtotal: qty * precioUnitario,
        },
      ];
    });

    vipToast.success("Agregado al carrito", {
      id: `vip-cart-add-${producto.id}`,
      description: `${producto.nombre} (${nextQty}x)`,
    });
  };

  const removeItem = (itemId: string) => {
    let removedName = "";
    setItems((prev) => {
      const itemToRemove = prev.find((i) => i.id === itemId);
      if (itemToRemove) removedName = itemToRemove.producto.nombre;
      return prev.filter((i) => i.id !== itemId);
    });
    if (removedName) {
      vipToast.info("Producto eliminado", {
        id: `vip-cart-remove-${itemId}`,
        description: removedName,
      });
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            cantidad: newQuantity,
            subtotal: newQuantity * item.precioUnitario,
          };
        }
        return item;
      }),
    );
  };

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItemsCount = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.subtotal, 0),
    [items],
  );

  const cargoServicio = 0;
  const descuento = 0;
  const total = subtotal;

  return (
    <VipCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
        totalItems: totalItemsCount,
        subtotal,
        cargoServicio,
        descuento,
        total,
        restaurantId,
        restaurantNombre,
        setRestaurantInfo,
      }}
    >
      {children}
    </VipCartContext.Provider>
  );
}

export function useVipCart() {
  const context = useContext(VipCartContext);
  if (!context) {
    throw new Error("useVipCart must be used within a VipCartProvider");
  }
  return context;
}

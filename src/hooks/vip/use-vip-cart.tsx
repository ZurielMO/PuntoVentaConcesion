"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { VipCartItem, VipProduct } from "@/lib/vip/types";
import { vipServiceFeeFromSubtotal } from "@/lib/vip/money";
import { vipToast } from "./use-vip-toast";
import {
  VIP_PURCHASE_UNAVAILABLE_HINT,
  VIP_PURCHASE_UNAVAILABLE_TITLE,
} from "@/lib/vip/purchase-availability";

interface AddItemOptions {
  opcionesSeleccionadas?: {
    grupoTitulo: string;
    opcionNombre: string;
    precioExtra: number;
    id?: string;
  }[];
  instrucciones?: string;
  cantidad?: number;
  /** La preventa puede armar el pedido aunque el POS marque el producto agotado. */
  permitirSinStock?: boolean;
}

/** NOW = entrega durante el partido en curso; PREORDER = pedido programado a un partido. */
export type VipOrderMode = "NOW" | "PREORDER";

/** Último producto agregado, para que la barra del carrito confirme sin un toast. */
export interface VipCartAddSignal {
  key: number;
  nombre: string;
  cantidad: number;
}

interface VipCartContextType {
  /** El carrito guardado ya se leyó del dispositivo. Antes de esto `items` está vacío. */
  ready: boolean;
  orderMode: VipOrderMode;
  setOrderMode: (mode: VipOrderMode) => void;
  items: VipCartItem[];
  addItem: (producto: VipProduct, options?: AddItemOptions) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  updateInstructions: (itemId: string, instrucciones: string) => void;
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
  lastAdded: VipCartAddSignal | null;
}

const VipCartContext = createContext<VipCartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "vip_arena_cart_v1";
const ORDER_MODE_STORAGE_KEY = "vip_order_mode_v1";

const sameLine = (a: VipCartItem, productId: string, optionsKey: string, noteKey: string) =>
  a.producto.id === productId &&
  JSON.stringify(a.opcionesSeleccionadas || []) === optionsKey &&
  (a.instrucciones || "").trim() === noteKey;

export function VipCartProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [orderMode, setOrderModeState] = useState<VipOrderMode>("NOW");
  const [items, setItems] = useState<VipCartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantNombre, setRestaurantNombre] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<VipCartAddSignal | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // El servidor renderiza sin carrito; el guardado se lee al montar para no romper la hidratación.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      // Carrito ilegible: se empieza vacío.
    }
    try {
      if (sessionStorage.getItem(ORDER_MODE_STORAGE_KEY) === "PREORDER") setOrderModeState("PREORDER");
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, ready]);

  const setOrderMode = useCallback((mode: VipOrderMode) => {
    setOrderModeState(mode);
    try {
      sessionStorage.setItem(ORDER_MODE_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  const setRestaurantInfo = useCallback((id: string, nombre: string) => {
    setRestaurantId(id);
    setRestaurantNombre(nombre);
  }, []);

  const addItem = useCallback((producto: VipProduct, options?: AddItemOptions): boolean => {
    if (producto.disponible === false && !options?.permitirSinStock) {
      vipToast.error(VIP_PURCHASE_UNAVAILABLE_TITLE, {
        id: `vip-cart-stock-${producto.id}`,
        description: VIP_PURCHASE_UNAVAILABLE_HINT,
      });
      return false;
    }
    const qty = options?.cantidad && options.cantidad > 0 ? options.cantidad : 1;
    const extrasPrice =
      options?.opcionesSeleccionadas?.reduce((sum, opt) => sum + opt.precioExtra, 0) || 0;
    const precioUnitario = producto.precio + extrasPrice;
    const optionsKey = JSON.stringify(options?.opcionesSeleccionadas || []);
    const noteKey = (options?.instrucciones || "").trim();

    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex((it) => sameLine(it, producto.id, optionsKey, noteKey));
      if (existingIdx > -1) {
        const updated = [...prevItems];
        const prevItem = updated[existingIdx];
        const newQty = prevItem.cantidad + qty;
        updated[existingIdx] = {
          ...prevItem,
          cantidad: newQty,
          subtotal: newQty * precioUnitario,
          instrucciones: noteKey || prevItem.instrucciones,
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
          instrucciones: noteKey || undefined,
          precioUnitario,
          subtotal: qty * precioUnitario,
        },
      ];
    });
    setLastAdded({ key: Date.now(), nombre: producto.nombre, cantidad: qty });
    return true;
  }, []);

  const removeItem = useCallback((itemId: string) => {
    const current = itemsRef.current;
    const index = current.findIndex((i) => i.id === itemId);
    if (index < 0) return;
    const removed = current[index];
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    vipToast.info("Producto eliminado", {
      id: `vip-cart-remove-${itemId}`,
      description: removed.producto.nombre,
      action: {
        label: "Deshacer",
        onClick: () =>
          setItems((prev) => {
            if (prev.some((i) => i.id === removed.id)) return prev;
            const next = [...prev];
            next.splice(Math.min(index, next.length), 0, removed);
            return next;
          }),
      },
    });
  }, []);

  const updateQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        removeItem(itemId);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, cantidad: newQuantity, subtotal: newQuantity * item.precioUnitario }
            : item,
        ),
      );
    },
    [removeItem],
  );

  const updateInstructions = useCallback((itemId: string, instrucciones: string) => {
    const next = instrucciones.slice(0, 500);
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, instrucciones: next } : item)));
  }, []);

  const clearCart = useCallback(() => {
    // Se borra también el guardado de inmediato: la página de pago exitoso vacía el carrito
    // en su primer efecto, antes de que este proveedor termine de leer el almacenamiento.
    try {
      localStorage.setItem(CART_STORAGE_KEY, "[]");
    } catch {
      // ignore
    }
    setItems([]);
  }, []);

  const totalItemsCount = useMemo(() => items.reduce((acc, item) => acc + item.cantidad, 0), [items]);
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.subtotal, 0), [items]);

  const cargoServicio = vipServiceFeeFromSubtotal(subtotal);
  const descuento = 0;
  const total = Number((subtotal + cargoServicio).toFixed(2));

  return (
    <VipCartContext.Provider
      value={{
        ready,
        orderMode,
        setOrderMode,
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateInstructions,
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
        lastAdded,
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

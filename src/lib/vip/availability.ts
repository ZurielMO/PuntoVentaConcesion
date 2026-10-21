import type { VipProduct, VipRestaurant } from "./types";

/**
 * Traducción de los estados reales del backend a lo que ve el aficionado.
 * Las reglas de quién puede agregar qué son las mismas que ya existían
 * (`canOrder` y `permitirSinStock` con preventa); aquí solo se nombran.
 */
export interface VipSalesState {
  ready: boolean;
  canOrder: boolean;
  liveOrdersOpen: boolean;
  preordersEnabled: boolean;
  preordersOpen: boolean;
}

export type VipProductAvailability =
  /** Se puede agregar. */
  | { state: "available"; canAdd: true; label?: undefined }
  /** Sin existencia para entrega inmediata, pero la preventa lo permite. */
  | { state: "preorder-only"; canAdd: true; label: string }
  | { state: "sold-out"; canAdd: false; label: string }
  | { state: "closed"; canAdd: false; label: string }
  | { state: "loading"; canAdd: false; label?: undefined };

export function productAvailability(product: Pick<VipProduct, "disponible">, sales: VipSalesState): VipProductAvailability {
  if (!sales.ready) return { state: "loading", canAdd: false };
  if (!sales.canOrder) return { state: "closed", canAdd: false, label: "No disponible por ahora" };
  if (product.disponible === false) {
    if (!sales.preordersEnabled) return { state: "sold-out", canAdd: false, label: "Agotado" };
    if (sales.liveOrdersOpen) return { state: "preorder-only", canAdd: true, label: "Solo en preventa" };
  }
  return { state: "available", canAdd: true };
}

export type VipRestaurantBadge = { tone: "live" | "preorder" | "muted"; label: string } | null;

/**
 * Solo marca lo que distingue a un establecimiento de los demás. El estado general
 * (preventa, servicio cerrado) ya lo dice la banda de inicio; repetirlo en cada tarjeta es ruido.
 */
export function restaurantBadge(restaurant: Pick<VipRestaurant, "productos" | "disponible">, sales: VipSalesState): VipRestaurantBadge {
  if (!sales.ready) return null;
  if (restaurant.disponible === false) return { tone: "muted", label: "Cerrado por ahora" };
  if (!sales.canOrder || !sales.liveOrdersOpen) return null;
  const inStock = restaurant.productos.filter((product) => product.disponible !== false).length;
  if (inStock === 0) {
    return sales.preordersEnabled ? { tone: "preorder", label: "Solo preventa" } : { tone: "muted", label: "Agotado hoy" };
  }
  return null;
}

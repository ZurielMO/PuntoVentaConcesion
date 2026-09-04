export const VIP_STADIUM_ZONES = ["Oriente", "Poniente"] as const;
export type StadiumZone = (typeof VIP_STADIUM_ZONES)[number];

export const VIP_ZONE_FLOORS: Record<StadiumZone, readonly number[]> = {
  Oriente: [1, 2, 3],
  Poniente: [1, 2],
};

export const vipFloorLabel = (floor: number): string => `Piso ${floor}`;

export const isVipStadiumZone = (value: string): value is StadiumZone =>
  (VIP_STADIUM_ZONES as readonly string[]).includes(value);

export const floorsForZone = (zona: StadiumZone): readonly number[] => VIP_ZONE_FLOORS[zona];

export const normalizeVipFloor = (zona: string, nivel: string): string | null => {
  if (!isVipStadiumZone(zona)) return null;
  const match = String(nivel || "").trim().match(/(\d+)/);
  const floor = match ? Number(match[1]) : NaN;
  if (!VIP_ZONE_FLOORS[zona].includes(floor)) return null;
  return vipFloorLabel(floor);
};

export interface VipLocation {
  id?: string;
  zona: StadiumZone;
  zonaId?: string;
  palco: string;
  nivel?: string;
  notas?: string;
}

export type VipCategory =
  | "Todos"
  | "Comida"
  | "Snacks"
  | "Bebidas"
  | "Combos"
  | "Recomendados"
  | "Hamburguesas"
  | string;

export interface VipProductOption {
  id: string;
  nombre: string;
  precioExtra: number;
}

export interface VipProductOptionGroup {
  id: string;
  titulo: string;
  requerido: boolean;
  maxSeleccion?: number;
  opciones: VipProductOption[];
}

export interface VipProduct {
  id: string;
  concesionId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  categoria: string;
  disponible: boolean;
  esRecomendado?: boolean;
  tiempoEstimadoMin?: number;
  gruposOpciones?: VipProductOptionGroup[];
  opcionesDisponibles?: Array<{ id: string; name: string; price: number }>;
  extrasDisponibles?: Array<{ id: string; name: string; price: number }>;
}

export interface VipRestaurant {
  id: string;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  imagen: string;
  portada: string;
  logo: string;
  categoria: string;
  tipo?: string;
  precioMinimo: number;
  tiempoEntrega: string;
  distanciaMinutos: number;
  disponible: boolean;
  etiquetaRapido?: boolean;
  destacado?: boolean;
  productos: VipProduct[];
  categorias: VipCategory[];
}

export interface VipCartItemOption {
  grupoTitulo: string;
  opcionNombre: string;
  precioExtra: number;
  id?: string;
}

export interface VipCartItem {
  id: string; // unique item instance id
  producto: VipProduct;
  cantidad: number;
  opcionesSeleccionadas?: VipCartItemOption[];
  extrasSeleccionados?: VipCartItemOption[];
  instrucciones?: string;
  precioUnitario: number;
  subtotal: number;
}

export type VipPaymentMethodType = "CARD" | "CASH" | "POINTS";

export interface VipPaymentMethod {
  id: string;
  tipo: VipPaymentMethodType;
  titulo: string;
  detalle: string;
  icono: string;
  predeterminado?: boolean;
}

export const VIP_STRIPE_PAYMENT_METHOD: VipPaymentMethod = {
  id: "stripe-checkout",
  tipo: "CARD",
  titulo: "Pago con tarjeta",
  detalle: "Pago seguro con tarjeta",
  icono: "credit_card",
  predeterminado: true,
};

/**
 * Estados unificados de orden VIP (compatibles con Frontend y Backend)
 */
export type VipOrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "RECIBIDO"
  | "RECEIVED"
  | "ACCEPTED"
  | "PREPARANDO"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "EN_CAMINO"
  | "ON_THE_WAY"
  | "ENTREGADO"
  | "DELIVERED"
  | "CANCELADO"
  | "CANCELLED"
  | "REFUNDED"
  | "PAYMENT_FAILED";

export const isVipNewStatus = (status: VipOrderStatus): boolean =>
  status === "RECEIVED" || status === "RECIBIDO";

export const isVipOnTheWayStatus = (status: VipOrderStatus): boolean =>
  status === "ACCEPTED" ||
  status === "PREPARING" ||
  status === "PREPARANDO" ||
  status === "READY_FOR_PICKUP" ||
  status === "PICKED_UP" ||
  status === "EN_CAMINO" ||
  status === "ON_THE_WAY";

export const isVipHistoryStatus = (status: VipOrderStatus): boolean =>
  status === "ENTREGADO" ||
  status === "DELIVERED" ||
  status === "CANCELADO" ||
  status === "CANCELLED" ||
  status === "REFUNDED";

export const isVipDeliverableStatus = isVipOnTheWayStatus;

export interface VipTrackingStep {
  estado: VipOrderStatus;
  titulo: string;
  descripcion: string;
  hora: string;
  completado: boolean;
  activo: boolean;
}

export interface VipRunner {
  id: string;
  runnerId?: string;
  nombre: string;
  telefono: string;
  foto?: string;
}

export interface VipOrderFulfillment {
  concessionId: string;
  concessionName: string;
  itemIds?: string[];
}

export const uniqueOrderConcessionNames = (order: Pick<VipOrder, "fulfillments" | "restauranteNombre">): string[] => {
  const names: string[] = [];
  const seen = new Set<string>();
  const push = (value: string) => {
    const name = value.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(name);
  };
  for (const row of order.fulfillments || []) push(row.concessionName || row.concessionId || "");
  for (const part of String(order.restauranteNombre || "").split(" · ")) push(part);
  return names;
};

export const formatOrderConcessions = (order: Pick<VipOrder, "fulfillments" | "restauranteNombre">): string =>
  uniqueOrderConcessionNames(order).join(" · ") || "Servicio Palcos";

export const concessionLabelForItem = (order: VipOrder, item: VipCartItem): string => {
  const match = (order.fulfillments || []).find(
    (row) =>
      row.itemIds?.includes(item.id) ||
      row.itemIds?.includes(item.producto.id) ||
      row.concessionId === item.producto.concesionId,
  );
  return match?.concessionName || item.producto.concesionId || order.restauranteNombre;
};

export const groupOrderItemsByConcession = (
  order: VipOrder,
): Array<{ name: string; items: VipCartItem[] }> => {
  const names = uniqueOrderConcessionNames(order);
  if (names.length <= 1) {
    return [{ name: names[0] || order.restauranteNombre, items: order.items }];
  }
  const groups = new Map<string, { name: string; items: VipCartItem[] }>();
  for (const item of order.items) {
    const name = concessionLabelForItem(order, item);
    const existing = groups.get(name);
    if (existing) existing.items.push(item);
    else groups.set(name, { name, items: [item] });
  }
  return [...groups.values()];
};

export const orderIncludesConcession = (order: VipOrder, concessionId: string): boolean => {
  if (!concessionId || concessionId === "ALL") return true;
  if (order.restauranteId === concessionId) return true;
  if ((order.fulfillments || []).some((row) => row.concessionId === concessionId)) return true;
  if (order.items.some((item) => item.producto.concesionId === concessionId)) return true;
  const needle = concessionId.toLowerCase();
  return uniqueOrderConcessionNames(order).some((name) => name.toLowerCase().includes(needle));
};

/** Folio corto para KDS/PDA: PALCO-20260904-XWV6VU → XWV6VU */
export const shortVipOrderNumber = (numero: string): string => {
  const trimmed = String(numero || "").replace(/^#/, "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split("-").filter(Boolean);
  if (parts.length >= 3) return parts.at(-1) ?? trimmed;
  return trimmed;
};

export interface VipOrder {
  id: string;
  numeroPedido: string;
  restauranteId: string;
  restauranteNombre: string;
  restauranteLogo: string;
  ubicacion: VipLocation;
  items: VipCartItem[];
  fulfillments?: VipOrderFulfillment[];
  subtotal: number;
  cargoServicio: number;
  descuento: number;
  propina: number;
  total: number;
  metodoPago: VipPaymentMethod;
  estado: VipOrderStatus;
  tiempoEstimadoMin: number;
  createdAt: string;
  updatedAt?: string;
  timeline: VipTrackingStep[];
  trackingToken?: string;
  checkoutUrl?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  repartidor?: VipRunner;
  notas?: string;
}

export interface VipUserProfile {
  nombre: string;
  email: string;
  telefono: string;
  nivel: string;
  avatarUrl: string;
  ubicacionPredeterminada: VipLocation;
  metodosPago: VipPaymentMethod[];
  puntosClub: number;
}

// Interfaces para backend / Central VIP
export interface VipCheckoutInput {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  delivery: {
    zona: string;
    palco: string;
    nivel?: string;
    notes?: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
    selectedOptions?: string[];
    extras?: string[];
    notes?: string;
  }>;
  tip?: number;
}

export interface VipCheckoutResponse {
  orderId: string;
  orderNumber: string;
  checkoutUrl?: string | null;
  checkoutSessionId?: string | null;
  trackingToken: string;
  total: number;
  currency: string;
}

export interface VipConfirmCheckoutResponse {
  orderId: string;
  orderNumber: string;
  status: VipOrderStatus;
  paymentStatus: string;
  paid: boolean;
}

export interface VipAbandonCheckoutResponse {
  orderId: string;
  orderNumber: string;
  status: VipOrderStatus;
  paymentStatus: string;
  released: boolean;
  paid: boolean;
}

export interface VipTrackingResponse {
  id: string;
  orderNumber: string;
  jornadaId: string;
  customer: { name: string; email: string };
  delivery: {
    locationId: string;
    zonaId: string;
    zona: string;
    palco: string;
    nivel: string;
    notes: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    concessionId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    selectedOptions: Array<{ id: string; name: string; price: number }>;
    extras: Array<{ id: string; name: string; price: number }>;
    notes: string | null;
    lineTotal: number;
  }>;
  subtotal: number;
  serviceFee: number;
  tip: number;
  total: number;
  currency: string;
  status: VipOrderStatus;
  paymentStatus: string;
  runner: { id: string; name: string; phone: string | null } | null;
  timestamps: Record<string, string | null>;
  createdAt: string;
  updatedAt: string;
}

export interface VipAdminOrderFilter {
  status?: VipOrderStatus;
  fecha?: string;
  zona?: StadiumZone;
  concessionId?: string;
  sucursalId?: string;
  runnerId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

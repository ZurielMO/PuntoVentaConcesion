import { api, ApiError, type ApiResponse } from "@/lib/api/client";
import type {
  VipRestaurant,
  VipProduct,
  VipOrder,
  VipLocation,
  StadiumZone,
  VipCheckoutInput,
  VipCheckoutResponse,
  VipConfirmCheckoutResponse,
  VipAbandonCheckoutResponse,
  VipTrackingResponse,
  VipOrderStatus,
  VipAdminOrderFilter,
  VipCartItem,
  VipTrackingStep,
} from "./types";
import { VIP_STRIPE_PAYMENT_METHOD, isVipStadiumZone } from "./types";

function firstImage(value: unknown): string {
  if (Array.isArray(value)) {
    const url = value.find((item) => typeof item === "string" && item.trim());
    return typeof url === "string" ? url : "";
  }
  return typeof value === "string" ? value : "";
}

interface VipBackendConcession {
  id: string;
  name?: string;
  nombre?: string;
  type?: string;
  tipo?: string;
  activo?: boolean;
  images?: string[];
  imagenes?: string[];
  products?: Array<{
    id: string;
    concessionId?: string;
    name?: string;
    nombre?: string;
    unit?: string;
    images?: string[];
    imagenes?: string[];
    price: number | string;
    currency?: string;
    available?: boolean;
    activo?: boolean;
    options?: Array<{ id: string; name: string; price: number }>;
    extras?: Array<{ id: string; name: string; price: number }>;
  }>;
  productos?: Array<{
    id: string;
    nombre: string;
    precio: number | string;
    imagenes?: string[];
    activo?: boolean;
    categoria?: string;
    descripcion?: string;
  }>;
}

interface VipBackendLocation {
  id: string;
  zonaId: string;
  zona: string;
  palco: string;
  nivel: string;
}

const CATALOG_TTL_MS = 20_000;
let restaurantsCache: { at: number; data: VipRestaurant[] } | null = null;

function mapVipConcession(c: VipBackendConcession): VipRestaurant {
  const concessionName = c.name || c.nombre || c.id;
  const concessionImage = firstImage(c.images || c.imagenes);
  const concessionType = c.type || c.tipo || "GENERAL";
  const rawProds = c.products || c.productos || [];

  const products: VipProduct[] = rawProds.flatMap((p) => {
    const prodName = ("name" in p ? p.name : p.nombre) || "Producto";
    const rawPrice = "price" in p ? p.price : "precio" in p ? p.precio : undefined;
    const price = Number(rawPrice);
    if (!p.id || !Number.isFinite(price) || price < 0) return [];
    const pOptions = "options" in p && Array.isArray(p.options) ? p.options : [];
    const pExtras = "extras" in p && Array.isArray(p.extras) ? p.extras : [];
    const categoria =
      ("categoria" in p ? p.categoria : undefined) ||
      (concessionType === "CERVECERIA" ? "Bebidas" : "Comida");
    return [{
      id: p.id,
      concesionId: c.id,
      nombre: prodName,
      descripcion: ("descripcion" in p ? p.descripcion : undefined) || "",
      precio: price,
      imagen: firstImage(("images" in p ? p.images : undefined) || ("imagenes" in p ? p.imagenes : undefined)),
      categoria,
      disponible: "available" in p ? p.available !== false : "activo" in p ? p.activo !== false : true,
      opcionesDisponibles: pOptions,
      extrasDisponibles: pExtras,
      gruposOpciones:
        pOptions.length > 0
          ? [
              {
                id: `opt-${p.id}`,
                titulo: "Opciones",
                requerido: false,
                opciones: pOptions.map((o) => ({
                  id: o.id,
                  nombre: o.name,
                  precioExtra: o.price,
                })),
              },
            ]
          : undefined,
    }];
  });

  const categories = ["Todos", ...new Set(products.map((item) => item.categoria))];
  const precioMinimo = products.length > 0 ? Math.min(...products.map((item) => item.precio)) : 0;

  return {
    id: c.id,
    nombre: concessionName,
    subtitulo: "Concesión oficial · Estadio León",
    descripcion: `Menú de ${concessionName} con entrega en palco.`,
    imagen: concessionImage,
    portada: concessionImage,
    logo: concessionImage,
    categoria: concessionType === "CERVECERIA" ? "Bebidas" : "Comida",
    tipo: concessionType,
    precioMinimo,
    tiempoEntrega: "12-20 min",
    distanciaMinutos: 0,
    disponible: c.activo !== false,
    productos: products,
    categorias: categories,
  };
}

/**
 * VIP Arena Service
 * Conexión completa con endpoints de Backend:
 * - Public Catalog: GET /vip/concessions, GET /vip/concessions/:id
 * - Public Locations: GET /vip/locations
 * - Client Checkout & Tracking: POST /vip/checkout, POST /vip/checkout/abandon, GET /vip/orders/:id/tracking
 * - Staff / Central VIP KDS: GET /vip/admin/orders, PATCH /vip/admin/orders/:id/status, etc.
 * Con fallback resiliente en caso de offline / demo.
 */
export class VipService {
  /**
   * Obtiene concesiones y productos activos del catálogo VIP.
   */
  static async getRestaurants(token?: string | null): Promise<VipRestaurant[]> {
    if (restaurantsCache && Date.now() - restaurantsCache.at < CATALOG_TTL_MS) {
      return restaurantsCache.data;
    }
    try {
      const vipRes = await api.get<ApiResponse<VipBackendConcession[]>>("/vip/concessions", token);
      if (vipRes.data && Array.isArray(vipRes.data) && vipRes.data.length > 0) {
        const data = vipRes.data.map(mapVipConcession);
        restaurantsCache = { at: Date.now(), data };
        return data;
      }
    } catch {
      // Catálogo VIP no disponible: no inventar restaurantes.
    }

    return [];
  }

  /**
   * Obtiene un restaurante por ID o slug.
   */
  static async getRestaurantById(id: string, token?: string | null): Promise<VipRestaurant | null> {
    const cached = restaurantsCache?.data.find(
      (row) => row.id === id || row.nombre.toLowerCase().replace(/\s+/g, "-") === id,
    );
    if (cached && restaurantsCache && Date.now() - restaurantsCache.at < CATALOG_TTL_MS) {
      return cached;
    }
    try {
      const res = await api.get<ApiResponse<VipBackendConcession>>(
        `/vip/concessions/${encodeURIComponent(id)}`,
        token,
      );
      if (res.data?.id) {
        return mapVipConcession(res.data);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
    }
    const list = await this.getRestaurants(token);
    return list.find((r) => r.id === id || r.nombre.toLowerCase().replace(/\s+/g, "-") === id) || null;
  }

  /**
   * Obtiene las ubicaciones y palcos VIP oficiales desde el backend.
   */
  static async getLocations(token?: string | null): Promise<VipLocation[]> {
    try {
      const res = await api.get<ApiResponse<VipBackendLocation[]>>("/vip/locations", token);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((loc) => {
          const zonaRaw = String(loc.zona || "");
          return {
            id: loc.id,
            zonaId: loc.zonaId,
            zona: isVipStadiumZone(zonaRaw) ? zonaRaw : "Poniente",
            palco: loc.palco,
            nivel: loc.nivel,
          };
        });
      }
    } catch {
      // Catálogo oficial incompleto: no inventar palcos.
    }
    return [];
  }

  /**
   * Inicia el Checkout VIP oficial enviando la orden a POST /vip/checkout
   * con Idempotency-Key para garantizar transaccionalidad bancaria y de inventario.
   */
  static async createCheckout(
    input: VipCheckoutInput,
    token?: string | null,
  ): Promise<VipCheckoutResponse> {
    const idempotencyKey = `vip_chk_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const res = await api.postWithOptions<ApiResponse<VipCheckoutResponse>>(
      "/vip/checkout",
      input,
      {
        token,
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );
    if (!res.data?.checkoutUrl) {
      throw new ApiError(502, "No se pudo obtener la URL de pago.", "VIP_PAYMENT_FAILED");
    }
    return res.data;
  }

  /**
   * Confirma el pago consultando la sesión de cobro (backup del webhook, necesario en local).
   */
  static async confirmCheckout(
    sessionId: string,
  ): Promise<VipConfirmCheckoutResponse> {
    const res = await api.post<ApiResponse<VipConfirmCheckoutResponse>>(
      "/vip/checkout/confirm",
      { sessionId },
    );
    if (!res.data?.orderId) {
      throw new ApiError(502, "No se pudo confirmar el pago VIP.", "VIP_PAYMENT_FAILED");
    }
    return res.data;
  }

  /**
   * Libera la reserva de inventario si el invitado cancela el cobro antes de pagar.
   */
  static async abandonCheckout(input: {
    orderId?: string;
    sessionId?: string;
    trackingToken?: string;
  }): Promise<VipAbandonCheckoutResponse> {
    const body: Record<string, string> = {};
    if (input.sessionId?.trim()) body.sessionId = input.sessionId.trim();
    if (input.orderId?.trim()) body.orderId = input.orderId.trim();
    if (input.trackingToken?.trim()) body.trackingToken = input.trackingToken.trim();
    const res = await api.post<ApiResponse<VipAbandonCheckoutResponse>>(
      "/vip/checkout/abandon",
      body,
    );
    if (!res.data?.orderId) {
      throw new ApiError(502, "No se pudo liberar la reserva de palcos.", "VIP_PAYMENT_FAILED");
    }
    return res.data;
  }

  /**
   * Consulta el estado de seguimiento en vivo con token de seguridad.
   */
  static async getTracking(
    orderId: string,
    trackingToken: string,
    token?: string | null,
  ): Promise<VipTrackingResponse | null> {
    try {
      const res = await api.get<ApiResponse<VipTrackingResponse>>(
        `/vip/orders/${encodeURIComponent(orderId)}/tracking?token=${encodeURIComponent(trackingToken)}`,
        token,
      );
      if (res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * --- MÉTODOS DE CENTRAL VIP (STAFF & KDS) ---
   */

  /**
   * Lista órdenes activas para la pantalla Central VIP / KDS.
   */
  static async getAdminOrders(
    filters: VipAdminOrderFilter = {},
    token?: string | null,
  ): Promise<{ data: VipOrder[]; count: number }> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.fecha) params.set("fecha", filters.fecha);
    if (filters.zona) params.set("zona", filters.zona);
    if (filters.concessionId) params.set("concessionId", filters.concessionId);
    if (filters.sucursalId) params.set("sucursalId", filters.sucursalId);
    if (filters.runnerId) params.set("runnerId", filters.runnerId);
    params.set("limit", String(filters.limit || 100));

    try {
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get<ApiResponse<Record<string, unknown>[]>>(`/vip/admin/orders${query}`, token);
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map((row) => mapBackendVipOrder(row));
        return { data: mapped, count: mapped.length };
      }
    } catch (err) {
      console.warn("Error al cargar órdenes de admin desde backend:", err);
    }

    const localOrders = this.getOrders().filter(
      (order) => !filters.zona || order.ubicacion.zona === filters.zona,
    );
    return { data: localOrders, count: localOrders.length };
  }

  static async unlockCentralZone(
    password: string,
    zona: StadiumZone,
    token?: string | null,
  ): Promise<StadiumZone> {
    const res = await api.post<ApiResponse<{ zona: StadiumZone }>>(
      "/vip/admin/central-zone/unlock",
      { password, zona },
      token,
    );
    const unlocked = res.data?.zona;
    if (unlocked !== "Oriente" && unlocked !== "Poniente") {
      throw new ApiError(400, "No se pudo confirmar la zona de Central.", "VIP_ZONE_REQUIRED");
    }
    return unlocked;
  }

  /**
   * Obtiene el detalle de una orden en Central VIP.
   */
  static async getAdminOrderById(orderId: string, token?: string | null): Promise<VipOrder | null> {
    try {
      const res = await api.get<ApiResponse<Record<string, unknown>>>(`/vip/admin/orders/${encodeURIComponent(orderId)}`, token);
      if (res.data) return mapBackendVipOrder(res.data);
    } catch {
      // Fallback
    }
    return this.getOrders().find((o) => o.id === orderId) || null;
  }

  /**
   * Transiciona el estado de una orden en el KDS (e.g. RECIBIDO -> PREPARANDO -> READY_FOR_PICKUP).
   */
  static async updateAdminOrderStatus(
    orderId: string,
    status: VipOrderStatus,
    metadata?: Record<string, unknown>,
    token?: string | null,
  ): Promise<boolean> {
    try {
      await api.patch(
        `/vip/admin/orders/${encodeURIComponent(orderId)}/status`,
        { status, metadata },
        token,
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Asigna un runner/repartidor a la orden en Central VIP.
   */
  static async assignAdminRunner(
    orderId: string,
    runner: { runnerId: string; name: string; phone?: string },
    token?: string | null,
  ): Promise<boolean> {
    try {
      await api.patch(
        `/vip/admin/orders/${encodeURIComponent(orderId)}/runner`,
        runner,
        token,
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cancela una orden desde Central VIP con motivo especificado.
   */
  static async cancelAdminOrder(
    orderId: string,
    reason: string,
    token?: string | null,
  ): Promise<boolean> {
    try {
      await api.post(
        `/vip/admin/orders/${encodeURIComponent(orderId)}/cancel`,
        { reason },
        token,
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reembolsa una orden desde Central VIP.
   */
  static async refundAdminOrder(
    orderId: string,
    reason: string,
    token?: string | null,
  ): Promise<boolean> {
    try {
      await api.post(
        `/vip/admin/orders/${encodeURIComponent(orderId)}/refund`,
        { reason },
        token,
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la comanda formateada para impresión térmica en cocina/barra.
   */
  static async getAdminPrintData(orderId: string, token?: string | null): Promise<Record<string, unknown> | null> {
    try {
      const res = await api.get<ApiResponse<Record<string, unknown>>>(
        `/vip/admin/orders/${encodeURIComponent(orderId)}/print-data`,
        token,
      );
      if (res.data) return res.data;
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * --- MÉTODOS LOCALES Y PERSISTENCIA OFFLINE ---
   */

  static getOrders(): VipOrder[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("vip_guest_orders_v1");
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  }

  static saveOrders(orders: VipOrder[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("vip_guest_orders_v1", JSON.stringify(orders));
    } catch {
      // ignore
    }
  }

  static getLocation(): VipLocation {
    return { zona: "Poniente", palco: "", nivel: "" };
  }

  static saveLocation(_location: VipLocation): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("vip_arena_location");
    } catch {
      // ignore
    }
  }
}

const PENDING_CHECKOUT_KEY = "vip_pending_checkout";

export type VipPendingCheckout = {
  orderId: string;
  orderNumber: string;
  trackingToken: string;
  checkoutSessionId?: string | null;
};

export function savePendingCheckout(payload: VipPendingCheckout): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
  if (payload.orderId && payload.trackingToken) {
    saveGuestTrackingToken(payload.orderId, payload.trackingToken);
  }
}

export function readPendingCheckout(): VipPendingCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    return raw ? (JSON.parse(raw) as VipPendingCheckout) : null;
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
}

function timestampToTime(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^\d{1,2}:\d{2}/.test(value)) return value;
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return value;
    const date = new Date(parsed);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  if (typeof value === "object") {
    const rec = value as { toMillis?: () => number; _seconds?: number; seconds?: number };
    const millis = typeof rec.toMillis === "function"
      ? rec.toMillis()
      : typeof rec._seconds === "number"
        ? rec._seconds * 1000
        : typeof rec.seconds === "number"
          ? rec.seconds * 1000
          : NaN;
    if (!Number.isFinite(millis)) return "";
    const date = new Date(millis);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return "";
}

const TRACKING_TOKENS_KEY = "vip_guest_tracking_tokens_v1";

export function saveGuestTrackingToken(orderId: string, token: string): void {
  if (typeof window === "undefined" || !orderId.trim() || !token.trim()) return;
  try {
    const raw = localStorage.getItem(TRACKING_TOKENS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[orderId] = token;
    localStorage.setItem(TRACKING_TOKENS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function readGuestTrackingToken(orderId: string): string {
  if (typeof window === "undefined" || !orderId.trim()) return "";
  try {
    const raw = localStorage.getItem(TRACKING_TOKENS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return typeof map[orderId] === "string" ? map[orderId] : "";
  } catch {
    return "";
  }
}

const GUEST_TIMELINE_STEPS: Array<{ estado: VipOrderStatus; titulo: string; descripcion: string; timeKeys: string[] }> = [
  {
    estado: "RECEIVED",
    titulo: "Pedido recibido",
    descripcion: "Confirmado en cocina del estadio",
    timeKeys: ["receivedAt", "paidAt"],
  },
  {
    estado: "ACCEPTED",
    titulo: "Aceptado",
    descripcion: "Cocina tomó el pedido",
    timeKeys: ["acceptedAt"],
  },
  {
    estado: "PREPARING",
    titulo: "Preparado",
    descripcion: "El pedido quedó listo en historial",
    timeKeys: ["preparingAt"],
  },
];

const STATUS_LEVEL: Record<string, number> = {
  PENDING_PAYMENT: 0,
  PAID: 1,
  RECIBIDO: 1,
  RECEIVED: 1,
  ACCEPTED: 2,
  PREPARANDO: 3,
  PREPARING: 3,
  READY_FOR_PICKUP: 3,
  PICKED_UP: 3,
  EN_CAMINO: 3,
  ON_THE_WAY: 3,
  ENTREGADO: 3,
  DELIVERED: 3,
  CANCELADO: 0,
  CANCELLED: 0,
  REFUNDED: 0,
  PAYMENT_FAILED: 0,
};

export function etaMinutesForVipStatus(status: VipOrderStatus): number {
  if (
    status === "PREPARING" ||
    status === "PREPARANDO" ||
    status === "READY_FOR_PICKUP" ||
    status === "PICKED_UP" ||
    status === "EN_CAMINO" ||
    status === "ON_THE_WAY" ||
    status === "ENTREGADO" ||
    status === "DELIVERED" ||
    status === "CANCELADO" ||
    status === "CANCELLED" ||
    status === "REFUNDED"
  ) {
    return 0;
  }
  if (status === "ACCEPTED") return 10;
  return 15;
}

export function isVipGuestTrackingTerminal(status?: VipOrderStatus): boolean {
  return (
    status === "DELIVERED" ||
    status === "ENTREGADO" ||
    status === "CANCELLED" ||
    status === "CANCELADO" ||
    status === "REFUNDED" ||
    status === "PAYMENT_FAILED"
  );
}

export function buildVipGuestTimeline(
  status: VipOrderStatus,
  timestamps: Record<string, string | null | unknown> = {},
  previous: VipTrackingStep[] = [],
): VipTrackingStep[] {
  const currentLevel = STATUS_LEVEL[status] ?? 1;
  return GUEST_TIMELINE_STEPS.map((step) => {
    const level = STATUS_LEVEL[step.estado] ?? 1;
    const previousStep = previous.find((row) => row.estado === step.estado);
    const hora =
      step.timeKeys.map((key) => timestampToTime(timestamps[key])).find(Boolean) ||
      previousStep?.hora ||
      "";
    const completado = currentLevel >= 3 ? level <= currentLevel : level < currentLevel;
    return {
      estado: step.estado,
      titulo: step.titulo,
      descripcion: step.descripcion,
      hora,
      completado,
      activo: level === currentLevel && currentLevel < 3,
    };
  });
}

export function applyVipTracking(
  order: VipOrder | undefined,
  tracking: VipTrackingResponse,
  trackingToken: string,
): VipOrder {
  const mapped = mapBackendVipOrder({
    ...tracking,
    trackingToken,
  } as unknown as Record<string, unknown>);
  return {
    ...(order || mapped),
    id: tracking.id || order?.id || mapped.id,
    numeroPedido: tracking.orderNumber || order?.numeroPedido || mapped.numeroPedido,
    estado: tracking.status,
    trackingToken: trackingToken || order?.trackingToken,
    tiempoEstimadoMin: etaMinutesForVipStatus(tracking.status),
    updatedAt: tracking.updatedAt || order?.updatedAt,
    timeline: buildVipGuestTimeline(tracking.status, tracking.timestamps, order?.timeline),
    repartidor: mapped.repartidor || order?.repartidor,
    items: order?.items?.length ? order.items : mapped.items,
    ubicacion: order?.ubicacion?.palco ? order.ubicacion : mapped.ubicacion,
    subtotal: tracking.subtotal ?? order?.subtotal ?? mapped.subtotal,
    cargoServicio: tracking.serviceFee ?? order?.cargoServicio ?? mapped.cargoServicio,
    propina: tracking.tip ?? order?.propina ?? mapped.propina,
    total: tracking.total ?? order?.total ?? mapped.total,
    nombreCliente: tracking.customer?.name || order?.nombreCliente || mapped.nombreCliente,
  };
}

export function mapBackendVipOrder(raw: Record<string, unknown>): VipOrder {
  const status = String(raw.status || raw.estado || "RECEIVED") as VipOrder["estado"];
  const delivery = (raw.delivery || raw.ubicacion || {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const fulfillments = Array.isArray(raw.fulfillments)
    ? (raw.fulfillments as Array<Record<string, unknown>>)
    : [];
  const firstFulfillment = fulfillments[0] || {};
  const concessionIds = Array.isArray(raw.concessionIds) ? raw.concessionIds : [];
  const runner = (raw.runner || raw.repartidor || null) as Record<string, unknown> | null;
  const customer = (raw.customer || {}) as Record<string, unknown>;

  const items: VipCartItem[] = itemsRaw.map((itemUnknown, idx) => {
    const item = itemUnknown as Record<string, unknown>;
    const nested = item.producto as VipProduct | undefined;
    const name = String(nested?.nombre || item.name || "Producto");
    const productId = String(nested?.id || item.productId || `item-${idx}`);
    const itemId = String(item.id || `${productId}-${idx}`);
    const quantity = Number(item.cantidad || item.quantity || 1);
    const unitPrice = Number(item.precioUnitario || item.unitPrice || 0);
    const lineTotal = Number(item.subtotal || item.lineTotal || unitPrice * quantity);
    const selectedOptions = Array.isArray(item.opcionesSeleccionadas)
      ? (item.opcionesSeleccionadas as VipCartItem["opcionesSeleccionadas"])
      : Array.isArray(item.selectedOptions)
        ? (item.selectedOptions as Array<{ id?: string; name?: string; price?: number }>).map((option) => ({
            grupoTitulo: "",
            opcionNombre: String(option.name || ""),
            precioExtra: Number(option.price || 0),
            id: option.id,
          }))
        : [];
    const matchedFulfillment = fulfillments.find((fulfillment) => {
      const ids = Array.isArray(fulfillment.itemIds) ? fulfillment.itemIds.map((id) => String(id)) : [];
      return ids.includes(itemId) || ids.includes(productId) || String(fulfillment.concessionId || "") === String(item.concessionId || nested?.concesionId || "");
    });
    return {
      id: itemId,
      producto: {
        ...(nested || {
          id: productId,
          concesionId: "",
          nombre: name,
          descripcion: "",
          precio: unitPrice,
          imagen: "",
          categoria: "",
          disponible: true,
        }),
        id: productId,
        nombre: nested?.nombre || name,
        concesionId: String(nested?.concesionId || item.concessionId || matchedFulfillment?.concessionId || ""),
        precio: nested?.precio ?? unitPrice,
      },
      cantidad: quantity,
      opcionesSeleccionadas: selectedOptions,
      instrucciones: String(item.instrucciones || item.notes || "") || undefined,
      precioUnitario: unitPrice,
      subtotal: lineTotal,
    };
  });

  const concessionNames = [
    ...new Set(
      fulfillments
        .map((fulfillment) => String(fulfillment.concessionName || "").trim())
        .filter(Boolean),
    ),
  ];

  return {
    id: String(raw.id || ""),
    numeroPedido: String(raw.orderNumber || raw.numeroPedido || ""),
    restauranteId: String(raw.restauranteId || concessionIds[0] || firstFulfillment.concessionId || ""),
    restauranteNombre:
      concessionNames.join(" · ") || String(raw.restauranteNombre || firstFulfillment.concessionName || "Servicio Palcos"),
    restauranteLogo: String(raw.restauranteLogo || ""),
    ubicacion: {
      zona: (() => {
        const zonaRaw = String(delivery.zona || "");
        return isVipStadiumZone(zonaRaw) ? zonaRaw : "Poniente";
      })(),
      palco: String(delivery.palco || ""),
      nivel: delivery.nivel ? String(delivery.nivel) : undefined,
      notas: delivery.notes
        ? String(delivery.notes)
        : delivery.notas
          ? String(delivery.notas)
          : undefined,
    },
    items,
    fulfillments: fulfillments
      .map((fulfillment) => ({
        concessionId: String(fulfillment.concessionId || ""),
        concessionName: String(fulfillment.concessionName || ""),
        itemIds: Array.isArray(fulfillment.itemIds)
          ? fulfillment.itemIds.map((itemId) => String(itemId))
          : undefined,
      }))
      .filter((fulfillment) => fulfillment.concessionId),
    subtotal: Number(raw.subtotal || 0),
    cargoServicio: Number(raw.serviceFee || raw.cargoServicio || 0),
    descuento: Number(raw.descuento || 0),
    propina: Number(raw.tip || raw.propina || 0),
    total: Number(raw.total || 0),
    metodoPago: VIP_STRIPE_PAYMENT_METHOD,
    estado: status,
    tiempoEstimadoMin: Number(raw.tiempoEstimadoMin || 15),
    createdAt: timestampToTime(raw.createdAt),
    trackingToken: raw.trackingToken ? String(raw.trackingToken) : undefined,
    nombreCliente: String(raw.nombreCliente || customer.name || ""),
    telefonoCliente: String(raw.telefonoCliente || customer.phone || ""),
    repartidor: runner
      ? {
          id: String(runner.id || runner.runnerId || ""),
          nombre: String(runner.name || runner.nombre || ""),
          telefono: String(runner.phone || runner.telefono || ""),
        }
      : undefined,
    notas: delivery.notes ? String(delivery.notes) : undefined,
    timeline: Array.isArray(raw.timeline) ? (raw.timeline as VipOrder["timeline"]) : [],
  };
}

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type {
  VipOrder,
  VipCartItem,
  VipLocation,
  VipPaymentMethod,
  VipOrderStatus,
  VipCheckoutInput,
  StadiumZone,
} from "@/lib/vip/types";
import { VipService, savePendingCheckout, saveGuestTrackingToken } from "@/lib/vip/vip-service";
import { useAuth } from "@/hooks/use-auth";
import { vipToast } from "./use-vip-toast";
import { ApiError } from "@/lib/api/client";

interface CreateOrderParams {
  restauranteId: string;
  restauranteNombre: string;
  restauranteLogo: string;
  customer: { name: string; email: string; phone: string };
  delivery: { zona: VipLocation["zona"]; palco: string; nivel?: string; notas?: string };
  items: VipCartItem[];
  subtotal: number;
  cargoServicio: number;
  descuento: number;
  propina: number;
  total: number;
  metodoPago: VipPaymentMethod;
}

interface VipOrdersContextType {
  orders: VipOrder[];
  activeOrder: VipOrder | null;
  createOrder: (params: CreateOrderParams) => Promise<VipOrder>;
  reorder: (orderId: string, addToCart: (items: VipCartItem[]) => void) => void;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  getOrderById: (orderId: string) => VipOrder | undefined;
  advanceOrderStatus: (orderId: string, nextStatus: VipOrderStatus) => Promise<void>;
  assignRunner: (orderId: string, runner: { id: string; name: string; phone: string }) => Promise<void>;
  refreshOrders: (fecha?: string, zona?: StadiumZone) => Promise<void>;
  patchOrderStatus: (orderId: string, status: VipOrderStatus) => void;
  upsertGuestTrackedOrder: (order: VipOrder) => void;
}

const VipOrdersContext = createContext<VipOrdersContextType | undefined>(undefined);

export function VipOrdersProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [orders, setOrders] = useState<VipOrder[]>(() => VipService.getOrders());

  const refreshOrders = useCallback(async (fecha?: string, zona?: StadiumZone) => {
    if (!token || !zona) return;
    try {
      const { data } = await VipService.getAdminOrders(
        {
          fecha: fecha || new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }),
          zona,
          limit: 100,
        },
        token,
      );
      setOrders(data);
    } catch {
      // Fallback
    }
  }, [token]);

  const patchOrderStatus = useCallback((orderId: string, status: VipOrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, estado: status } : order)),
    );
  }, []);

  const upsertGuestTrackedOrder = useCallback((next: VipOrder) => {
    if (!next.id) return;
    setOrders((prev) => {
      const index = prev.findIndex(
        (order) => order.id === next.id || order.numeroPedido.replace("#", "") === next.numeroPedido.replace("#", ""),
      );
      if (index < 0) return [next, ...prev];
      const current = prev[index];
      if (
        current.estado === next.estado &&
        (current.updatedAt || "") === (next.updatedAt || "") &&
        (current.repartidor?.id || "") === (next.repartidor?.id || "")
      ) {
        return prev;
      }
      const merged = [...prev];
      merged[index] = {
        ...current,
        ...next,
        items: current.items?.length ? current.items : next.items,
        trackingToken: current.trackingToken || next.trackingToken,
      };
      return merged;
    });
  }, []);

  useEffect(() => {
    VipService.saveOrders(orders);
  }, [orders]);

  const activeOrder = orders.find(
    (o) =>
      o.estado === "RECIBIDO" ||
      o.estado === "RECEIVED" ||
      o.estado === "ACCEPTED" ||
      o.estado === "PREPARANDO" ||
      o.estado === "PREPARING",
  ) || null;

  const getOrderById = useCallback(
    (orderId: string) => {
      return orders.find(
        (o) => o.id === orderId || o.numeroPedido.replace("#", "") === orderId.replace("#", ""),
      );
    },
    [orders],
  );

  const advanceOrderStatus = useCallback(
    async (orderId: string, nextStatus: VipOrderStatus) => {
      // Try updating in backend if token available
      try {
        await VipService.updateAdminOrderStatus(orderId, nextStatus, undefined, token);
      } catch {
        // Fallback local
      }

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;

          const now = new Date();
          const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

          const updatedTimeline = order.timeline.map((step) => {
            if (step.estado === nextStatus) {
              return { ...step, completado: false, activo: true, hora: timeStr };
            }
            if (
              (nextStatus === "ACCEPTED" && (step.estado === "RECIBIDO" || step.estado === "RECEIVED")) ||
              ((nextStatus === "PREPARANDO" || nextStatus === "PREPARING") &&
                (step.estado === "RECIBIDO" || step.estado === "RECEIVED" || step.estado === "ACCEPTED"))
            ) {
              return { ...step, completado: true, activo: false };
            }
            return step;
          });

          return {
            ...order,
            estado: nextStatus === "ACCEPTED" ? "ON_THE_WAY" : nextStatus,
            tiempoEstimadoMin: 0,
            timeline: updatedTimeline,
          };
        }),
      );
    },
    [token],
  );

  const assignRunner = useCallback(
    async (orderId: string, runner: { id: string; name: string; phone: string }) => {
      try {
        await VipService.assignAdminRunner(
          orderId,
          { runnerId: runner.id, name: runner.name, phone: runner.phone },
          token,
        );
      } catch {
        // Fallback local
      }

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            estado: "EN_CAMINO",
            repartidor: {
              id: runner.id,
              nombre: runner.name,
              telefono: runner.phone,
            },
          };
        }),
      );
      vipToast.success("Repartidor asignado", {
        description: `${runner.name} está entregando el pedido.`,
      });
    },
    [token],
  );

  // El estado operativo lo mueve la central / webhook, no timers del navegador.

  const createOrder = async (params: CreateOrderParams): Promise<VipOrder> => {
    const palco = params.delivery.palco.trim();
    if (!palco) {
      throw new ApiError(
        400,
        "Indica el palco al momento de pagar.",
        "VIP_INVALID_LOCATION",
      );
    }

    const checkoutInput: VipCheckoutInput = {
      customer: {
        name: params.customer.name.trim(),
        email: params.customer.email.trim(),
        phone: params.customer.phone.trim(),
      },
      delivery: {
        zona: params.delivery.zona,
        palco,
        nivel: params.delivery.nivel?.trim() || undefined,
        notes: params.delivery.notas || undefined,
      },
      items: params.items.map((i) => ({
        productId: i.producto.id,
        quantity: i.cantidad,
        selectedOptions: (i.opcionesSeleccionadas || [])
          .map((o) => o.id || i.producto.opcionesDisponibles?.find((opt) => opt.name === o.opcionNombre)?.id)
          .filter((id): id is string => Boolean(id)),
        extras: (i.extrasSeleccionados || [])
          .map((e) => e.id || i.producto.extrasDisponibles?.find((opt) => opt.name === e.opcionNombre)?.id)
          .filter((id): id is string => Boolean(id)),
        notes: i.instrucciones || undefined,
      })),
      tip: params.propina,
    };

    const backendResult = await VipService.createCheckout(checkoutInput);
    savePendingCheckout({
      orderId: backendResult.orderId,
      orderNumber: backendResult.orderNumber,
      trackingToken: backendResult.trackingToken,
      checkoutSessionId: backendResult.checkoutSessionId,
    });
    saveGuestTrackingToken(backendResult.orderId, backendResult.trackingToken);

    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newOrder: VipOrder = {
      id: backendResult.orderId,
      numeroPedido: backendResult.orderNumber,
      restauranteId: params.restauranteId,
      restauranteNombre: params.restauranteNombre,
      restauranteLogo: params.restauranteLogo,
      ubicacion: {
        zona: params.delivery.zona,
        palco,
        nivel: params.delivery.nivel,
      },
      items: params.items,
      subtotal: params.subtotal,
      cargoServicio: params.cargoServicio,
      descuento: params.descuento,
      propina: params.propina,
      total: backendResult.total,
      metodoPago: params.metodoPago,
      estado: "PENDING_PAYMENT",
      tiempoEstimadoMin: 15,
      createdAt: timeStr,
      trackingToken: backendResult.trackingToken,
      checkoutUrl: backendResult.checkoutUrl || undefined,
      nombreCliente: params.customer.name.trim(),
      telefonoCliente: params.customer.phone.trim(),
      timeline: [
        {
          estado: "PENDING_PAYMENT",
          titulo: "Pago con tarjeta",
          descripcion: "Completa el pago para enviar la orden a cocina",
          hora: timeStr,
          completado: false,
          activo: true,
        },
        {
          estado: "RECEIVED",
          titulo: "Pedido recibido",
          descripcion: "Orden confirmada en cocina",
          hora: "",
          completado: false,
          activo: false,
        },
        {
          estado: "ACCEPTED",
          titulo: "Aceptado",
          descripcion: "Cocina aceptó el pedido",
          hora: "",
          completado: false,
          activo: false,
        },
        {
          estado: "PREPARING",
          titulo: "Preparado",
          descripcion: "El pedido quedó en historial como preparado",
          hora: "",
          completado: false,
          activo: false,
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const reorder = (orderId: string, addToCart: (items: VipCartItem[]) => void) => {
    const order = getOrderById(orderId);
    if (!order) return;

    addToCart(order.items);
    vipToast.success("Productos añadidos al carrito", {
      description: `Se agregaron ${order.items.length} productos de ${order.restauranteNombre}.`,
    });
  };

  const cancelOrder = async (orderId: string, reason = "Cancelado por el usuario") => {
    await VipService.cancelAdminOrder(orderId, reason, token);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return { ...o, estado: "CANCELADO" as const };
        }
        return o;
      }),
    );
    vipToast.success("Pedido cancelado");
  };

  return (
    <VipOrdersContext.Provider
      value={{
        orders,
        activeOrder,
        createOrder,
        reorder,
        cancelOrder,
        getOrderById,
        advanceOrderStatus,
        assignRunner,
        refreshOrders,
        patchOrderStatus,
        upsertGuestTrackedOrder,
      }}
    >
      {children}
    </VipOrdersContext.Provider>
  );
}

export function useVipOrders() {
  const context = useContext(VipOrdersContext);
  if (!context) {
    throw new Error("useVipOrders must be used within a VipOrdersProvider");
  }
  return context;
}

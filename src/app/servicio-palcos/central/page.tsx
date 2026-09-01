"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ScanLine, Camera } from "lucide-react";
import { CentralHeader } from "@/components/vip/central/central-header";
import { CentralTabs, type CentralTab } from "@/components/vip/central/central-tabs";
import { KdsTicketCard } from "@/components/vip/central/kds-ticket-card";
import { IncomingOrderAlert } from "@/components/vip/central/incoming-order-alert";
import { OrderDetailsModal } from "@/components/vip/central/order-details-modal";
import { VipCentralZoneUnlock } from "@/components/vip/central/zone-unlock-modal";
import { useVipOrders } from "@/hooks/vip/use-vip-orders";
import { useVipCentralZone } from "@/hooks/vip/use-vip-central-zone";
import { usePdaScanner } from "@/hooks/vip/use-pda-scanner";
import { useIncomingOrderAlert } from "@/hooks/vip/use-incoming-order-alert";
import { VipService } from "@/lib/vip/vip-service";
import type { VipOrder, VipOrderStatus } from "@/lib/vip/types";
import {
  isVipDeliverableStatus,
  isVipHistoryStatus,
  isVipNewStatus,
  isVipOnTheWayStatus,
  orderIncludesConcession,
} from "@/lib/vip/types";
import { parseVipScanPayload } from "@/lib/vip/scan";
import { canConnectUsbPrinter, connectUsbPrinter, printOrderTickets } from "@/lib/vip/print-ticket";
import { vipToast } from "@/hooks/vip/use-vip-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";

function findScannedOrder(orders: VipOrder[], raw: string): VipOrder | undefined {
  const needle = parseVipScanPayload(raw).replace(/^#/, "").toLowerCase();
  if (!needle) return undefined;
  return orders.find(
    (order) =>
      order.id.toLowerCase() === needle ||
      order.numeroPedido.replace("#", "").toLowerCase() === needle,
  );
}

export default function VipCentralPage() {
  const { loading: authLoading, token } = useAuth();
  const { canAccessVipCentral } = usePermissions();
  const { orders, advanceOrderStatus, cancelOrder, refreshOrders, getOrderById } = useVipOrders();
  const { zona, ready: zonaReady, setZona } = useVipCentralZone();
  const [changingZona, setChangingZona] = useState(false);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedConcession, setSelectedConcession] = useState<string>("ALL");
  const [fecha, setFecha] = useState(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }),
  );
  const [concessions, setConcessions] = useState<Array<{ id: string; name: string }>>([]);
  const [scanValue, setScanValue] = useState("");
  const [usbPrinterAvailable, setUsbPrinterAvailable] = useState(false);
  const [isPda, setIsPda] = useState(false);
  const [detailsModalOrder, setDetailsModalOrder] = useState<VipOrder | null>(null);
  const [tab, setTab] = useState<CentralTab>("nuevas");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadCatalog() {
      try {
        const list = await VipService.getRestaurants();
        if (mounted && list && list.length > 0) {
          setConcessions(list.map((r) => ({ id: r.id, name: r.nombre })));
        }
      } catch {
        // Fallback
      }
    }
    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setUsbPrinterAvailable(canConnectUsbPrinter());
  }, []);

  useEffect(() => {
    if (!zona) return;
    refreshOrders(fecha, zona).catch(() => {});
  }, [fecha, refreshOrders, zona]);

  useEffect(() => {
    if (!autoRefresh || !zona) return;
    const interval = setInterval(() => {
      refreshOrders(fecha, zona).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshOrders, fecha, zona]);

  const handleManualRefresh = async () => {
    if (!zona) return;
    setIsRefreshing(true);
    await refreshOrders(fecha, zona);
    setTimeout(() => {
      setIsRefreshing(false);
      vipToast.info("Órdenes actualizadas", { description: "KDS sincronizado en tiempo real." });
    }, 500);
  };

  const filteredOrders = useMemo(() => {
    if (selectedConcession === "ALL") return orders;
    return orders.filter((o) => orderIncludesConcession(o, selectedConcession));
  }, [orders, selectedConcession]);

  const newOrders = useMemo(
    () => filteredOrders.filter((o) => isVipNewStatus(o.estado)).slice().reverse(),
    [filteredOrders],
  );
  const onTheWayOrders = useMemo(
    () => filteredOrders.filter((o) => isVipOnTheWayStatus(o.estado)),
    [filteredOrders],
  );
  const historyOrders = useMemo(
    () => filteredOrders.filter((o) => isVipHistoryStatus(o.estado)),
    [filteredOrders],
  );

  const newCount = newOrders.length;
  const onTheWayCount = onTheWayOrders.length;
  const historyCount = historyOrders.length;
  const incomingOrder = newOrders[0] ?? null;

  useIncomingOrderAlert(Boolean(zona && canAccessVipCentral && !authLoading && incomingOrder));

  useEffect(() => {
    if (newCount > 0) setTab("nuevas");
  }, [newCount]);

  let tabOrders = historyOrders;
  if (tab === "nuevas") tabOrders = newOrders;
  else if (tab === "camino") tabOrders = onTheWayOrders;

  let emptyLabel = "Sin pedidos en historial";
  if (tab === "nuevas") emptyLabel = "Sin pedidos nuevos";
  else if (tab === "camino") emptyLabel = "Sin pedidos en camino";

  const handleAdvanceStatus = async (orderId: string, nextStatus: VipOrderStatus) => {
    const current = getOrderById(orderId);
    const printing =
      nextStatus === "ACCEPTED" && current
        ? printOrderTickets({ ...current, estado: "ON_THE_WAY" })
        : null;
    if (nextStatus === "ACCEPTED") setAcceptingId(orderId);
    try {
      await advanceOrderStatus(orderId, nextStatus);
      if (nextStatus === "ACCEPTED" && current) {
        vipToast.success("Pedido aceptado", {
          description: "Queda en camino. Los tickets se envían a la impresora de la PDA.",
        });
        try {
          await printing;
        } catch {
          vipToast.info("Aceptado. Usa Imprimir ticket si la PDA no lanzó la impresión.");
        }
      } else if (nextStatus === "DELIVERED") {
        vipToast.success("Pedido entregado");
        setDetailsModalOrder(null);
      } else {
        vipToast.success("Estado actualizado");
      }
    } finally {
      if (nextStatus === "ACCEPTED") setAcceptingId(null);
    }
  };

  const handleOpenDetails = (order: VipOrder) => {
    setDetailsModalOrder(order);
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    await cancelOrder(orderId, reason);
  };

  const handleScannedCode = useCallback(
    async (raw: string) => {
      const parsed = parseVipScanPayload(raw);
      let order = findScannedOrder(orders, raw);
      if (!order && parsed) {
        order = (await VipService.getAdminOrderById(parsed, token)) || undefined;
      }
      if (order && zona && order.ubicacion.zona !== zona) {
        vipToast.error(`Esa orden es de ${order.ubicacion.zona}, no de ${zona}.`);
        return;
      }
      if (!order) {
        vipToast.error("No encontramos esa orden en Central Palcos.");
        return;
      }
      if (isVipNewStatus(order.estado)) {
        vipToast.info("Esta orden aún no está aceptada.");
      } else if (!isVipDeliverableStatus(order.estado) && isVipHistoryStatus(order.estado)) {
        vipToast.info("Esta orden ya está cerrada.");
      } else if (isVipOnTheWayStatus(order.estado)) {
        setTab("camino");
      }
      setDetailsModalOrder(order);
      setScanValue("");
    },
    [orders, token, zona],
  );

  usePdaScanner(handleScannedCode, canAccessVipCentral && !authLoading && Boolean(zona));

  useEffect(() => {
    setIsPda(Boolean(window.Android?.isPdaApp?.() && window.Android.scanQr));
  }, []);

  useEffect(() => {
    window.onVipQrScanned = (code) => {
      void handleScannedCode(code);
    };
    return () => {
      delete window.onVipQrScanned;
    };
  }, [handleScannedCode]);

  useEffect(() => {
    if (!detailsModalOrder) return;
    const latest = orders.find((order) => order.id === detailsModalOrder.id);
    if (latest && latest.estado !== detailsModalOrder.estado) {
      setDetailsModalOrder(latest);
    }
  }, [orders, detailsModalOrder]);

  if (authLoading || !zonaReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F6] text-[#66706B] text-lg">
        Cargando…
      </div>
    );
  }

  if (!canAccessVipCentral) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F5F7F6] px-6 text-center">
        <h1 className="font-headline-md text-3xl font-extrabold text-[#171A19]">Central Palcos</h1>
        <p className="font-body-md text-lg text-[#66706B] max-w-sm leading-snug">
          Esta vista es solo para personal del estadio. Los invitados pueden ordenar desde el menú sin cuenta.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/login?next=/servicio-palcos/central"
            className="h-14 px-5 rounded-xl bg-[#187B56] text-white font-bold text-lg flex items-center justify-center"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/servicio-palcos/inicio"
            className="h-14 px-5 rounded-xl border border-[#E2E8E5] bg-white text-[#171A19] font-bold text-lg flex items-center justify-center"
          >
            Ir al menú
          </Link>
        </div>
      </div>
    );
  }

  if (!zona) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F5F7F6] px-6">
        <VipCentralZoneUnlock
          token={token}
          title="¿De qué lado está esta Central?"
          description="Oriente y Poniente reciben pedidos distintos. Confirma el lado de este dispositivo."
          confirmLabel="Activar esta Central"
          onUnlocked={setZona}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#F5F7F6] text-[#171A19] touch-manipulation">
      <CentralHeader
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        selectedConcession={selectedConcession}
        onSelectConcession={setSelectedConcession}
        fecha={fecha}
        onSelectFecha={setFecha}
        concessions={concessions}
        zona={zona}
        onChangeZona={() => setChangingZona(true)}
        usbPrinterAvailable={usbPrinterAvailable}
        onConnectPrinter={async () => {
          try {
            await connectUsbPrinter();
            vipToast.success("Impresora USB lista para la PDA");
          } catch {
            vipToast.error("No se pudo conectar la impresora USB.");
          }
        }}
      />

      <main className="flex-1 min-h-0 w-full mx-auto px-3 pt-3 pb-[8.25rem] flex flex-col gap-3 overflow-hidden">
        {tab === "camino" && (
          <form
            className="bg-white rounded-2xl border border-[#E2E8E5] px-3.5 py-3 flex items-center gap-2.5 shadow-sm shrink-0"
            onSubmit={(event) => {
              event.preventDefault();
              if (scanValue.trim()) handleScannedCode(scanValue);
            }}
          >
            <ScanLine className="w-7 h-7 text-[#187B56] shrink-0" />
            <input
              data-vip-scanner="true"
              value={scanValue}
              onChange={(event) => setScanValue(event.target.value)}
              className="flex-1 min-h-14 bg-transparent text-lg font-semibold text-[#171A19] placeholder:text-[#8A9992] outline-none"
              placeholder="Escanea el QR del ticket"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="min-h-14 px-4 rounded-xl bg-[#187B56] text-white text-base font-bold"
            >
              Abrir
            </button>
            {isPda && (
              <button
                type="button"
                onClick={() => window.Android?.scanQr?.()}
                className="min-h-14 px-3.5 rounded-xl bg-[#0A1C16] text-white text-base font-bold flex items-center justify-center"
                aria-label="Cámara"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}
          </form>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3.5 pr-0.5">
          {tabOrders.length === 0 ? (
            <div className="flex-1 min-h-[180px] flex items-center justify-center p-6 text-center border-2 border-dashed border-[#CCD5D1] rounded-2xl bg-white/60">
              <p className="font-body-md text-lg text-[#66706B]">{emptyLabel}</p>
            </div>
          ) : (
            tabOrders.map((order) => (
              <KdsTicketCard
                key={order.id}
                order={order}
                onAdvance={handleAdvanceStatus}
                onSelectOrder={handleOpenDetails}
              />
            ))
          )}
        </div>
      </main>

      <CentralTabs
        tab={tab}
        onChange={setTab}
        newCount={newCount}
        onTheWayCount={onTheWayCount}
        historyCount={historyCount}
      />

      {incomingOrder && (
        <IncomingOrderAlert
          order={incomingOrder}
          queueRemaining={Math.max(0, newCount - 1)}
          accepting={acceptingId === incomingOrder.id}
          onAccept={() => {
            void handleAdvanceStatus(incomingOrder.id, "ACCEPTED");
          }}
          onOpenDetails={() => handleOpenDetails(incomingOrder)}
        />
      )}

      <OrderDetailsModal
        order={detailsModalOrder}
        isOpen={!!detailsModalOrder}
        onClose={() => setDetailsModalOrder(null)}
        onAdvance={handleAdvanceStatus}
        onCancel={handleCancelOrder}
      />

      {changingZona && (
        <div className="fixed inset-0 z-[90] bg-[#102D24]/70 flex items-center justify-center p-4">
          <VipCentralZoneUnlock
            token={token}
            title="Cambiar lado de esta Central"
            description="Los pedidos del otro lado dejarán de verse en este dispositivo."
            confirmLabel="Cambiar zona"
            currentZona={zona}
            onUnlocked={(next) => {
              setZona(next);
              setChangingZona(false);
            }}
            onCancel={() => setChangingZona(false)}
          />
        </div>
      )}
    </div>
  );
}

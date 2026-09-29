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
import { VipPublicSalesModal } from "@/components/vip/central/public-sales-modal";
import { PreorderBoard } from "@/components/vip/central/preorder-board";
import { useVipOrders } from "@/hooks/vip/use-vip-orders";
import { useVipCentralZone } from "@/hooks/vip/use-vip-central-zone";
import { useVipCentralPreorders } from "@/hooks/vip/use-vip-central-preorders";
import { usePdaScanner } from "@/hooks/vip/use-pda-scanner";
import { useIncomingOrderAlert } from "@/hooks/vip/use-incoming-order-alert";
import { VipService } from "@/lib/vip/vip-service";
import type { VipOrder, VipOrderStatus } from "@/lib/vip/types";
import {
  isVipDeliverableStatus,
  isVipHistoryStatus,
  isVipNewStatus,
  isVipOnTheWayStatus,
  isVipPreorderOrder,
  orderIncludesConcession,
} from "@/lib/vip/types";
import { isVipTerminalStatus } from "@/lib/vip/preorder";
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

const PREORDER_STATUS_TOAST: Partial<Record<VipOrderStatus, string>> = {
  PREPARING: "Preventa en preparación",
  DELIVERED: "Preventa entregada",
};

export default function VipCentralPage() {
  const { loading: authLoading, token } = useAuth();
  const { canAccessVipCentral } = usePermissions();
  const { orders, advanceOrderStatus, cancelOrder, refreshOrders, getOrderById, patchOrderStatus } = useVipOrders();
  const { zona, ready: zonaReady, setZona } = useVipCentralZone();
  const [changingZona, setChangingZona] = useState(false);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [pendingSales, setPendingSales] = useState<boolean | null>(null);
  const [preordersEnabled, setPreordersEnabled] = useState<boolean | null>(null);
  const [pendingPreorders, setPendingPreorders] = useState<boolean | null>(null);
  const [preorderBusyIds, setPreorderBusyIds] = useState<ReadonlySet<string>>(() => new Set());

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

  const loadPublicSales = useCallback(async () => {
    if (!token) return;
    try {
      const open = await VipService.getAdminPublicSales(token);
      setAcceptingOrders(open);
    } catch {
      // Se conserva el último estado conocido.
    }
  }, [token]);

  const loadPreorderSettings = useCallback(async () => {
    if (!token) return;
    try {
      const settings = await VipService.getAdminPreorderSettings(token);
      setPreordersEnabled(settings.enabled);
    } catch {
      // Se conserva el último estado conocido.
    }
  }, [token]);

  const preorders = useVipCentralPreorders({
    token,
    zona,
    enabled: canAccessVipCentral && !authLoading,
    autoRefresh,
    viewing: tab === "preventas",
  });
  const refreshPreorders = preorders.refresh;

  useEffect(() => {
    if (!zona) return;
    refreshOrders(fecha, zona).catch(() => {});
    loadPublicSales().catch(() => {});
  }, [fecha, refreshOrders, zona, loadPublicSales]);

  useEffect(() => {
    if (!zona || !canAccessVipCentral) return;
    void loadPreorderSettings();
  }, [zona, canAccessVipCentral, loadPreorderSettings]);

  useEffect(() => {
    if (!autoRefresh || !zona) return;
    const interval = setInterval(() => {
      refreshOrders(fecha, zona).catch(() => {});
      loadPublicSales().catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshOrders, fecha, zona, loadPublicSales]);

  const handleManualRefresh = async () => {
    if (!zona) return;
    setIsRefreshing(true);
    await Promise.all([refreshOrders(fecha, zona), loadPublicSales(), refreshPreorders(), loadPreorderSettings()]);
    setTimeout(() => {
      setIsRefreshing(false);
      vipToast.info("Órdenes actualizadas", { description: "KDS sincronizado en tiempo real." });
    }, 500);
  };

  const filteredOrders = useMemo(() => {
    if (selectedConcession === "ALL") return orders;
    return orders.filter((o) => orderIncludesConcession(o, selectedConcession));
  }, [orders, selectedConcession]);

  // Las preventas viven en su propia pestaña: nunca entran a la cola de aceptación ni disparan la alerta.
  const liveOrders = useMemo(() => filteredOrders.filter((o) => !isVipPreorderOrder(o)), [filteredOrders]);
  const newOrders = useMemo(
    () => liveOrders.filter((o) => isVipNewStatus(o.estado)).slice().reverse(),
    [liveOrders],
  );
  const onTheWayOrders = useMemo(
    () => liveOrders.filter((o) => isVipOnTheWayStatus(o.estado)),
    [liveOrders],
  );
  const historyOrders = useMemo(
    () => filteredOrders.filter((o) => isVipHistoryStatus(o.estado)),
    [filteredOrders],
  );

  const boardPreorders = useMemo(() => {
    if (selectedConcession === "ALL") return preorders.orders;
    return preorders.orders.filter((o) => orderIncludesConcession(o, selectedConcession));
  }, [preorders.orders, selectedConcession]);
  const activePreorderCount = useMemo(
    () => boardPreorders.filter((o) => !isVipTerminalStatus(o.estado)).length,
    [boardPreorders],
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

  const setPreorderBusy = (orderId: string, busy: boolean) => {
    setPreorderBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(orderId);
      else next.delete(orderId);
      return next;
    });
  };

  /** Las preventas no pasan por `advanceOrderStatus`: ese flujo convierte ACCEPTED en ON_THE_WAY y oculta errores. */
  const advancePreorder = async (order: VipOrder, nextStatus: VipOrderStatus, quiet = false): Promise<boolean> => {
    if (preorderBusyIds.has(order.id)) return false;
    setPreorderBusy(order.id, true);
    try {
      await VipService.transitionAdminOrder(order.id, nextStatus, token);
      preorders.patchStatus(order.id, nextStatus);
      patchOrderStatus(order.id, nextStatus);
      setDetailsModalOrder((current) => {
        if (current?.id !== order.id) return current;
        return nextStatus === "DELIVERED" ? null : { ...current, estado: nextStatus };
      });
      if (!quiet) vipToast.success(PREORDER_STATUS_TOAST[nextStatus] || "Estado actualizado");
      if (nextStatus === "PREPARING") {
        try {
          await printOrderTickets({ ...order, estado: "PREPARING" });
        } catch {
          if (!quiet) vipToast.info("Usa Imprimir ticket si la PDA no lanzó la impresión.");
        }
      }
      return true;
    } catch (error) {
      if (!quiet) {
        vipToast.error(error instanceof Error ? error.message : "No se pudo actualizar la preventa.");
      }
      return false;
    } finally {
      setPreorderBusy(order.id, false);
      void refreshPreorders();
    }
  };

  const handlePreorderAdvanceMany = async (batch: VipOrder[], nextStatus: VipOrderStatus) => {
    let done = 0;
    for (const order of batch) {
      if (await advancePreorder(order, nextStatus, true)) done += 1;
    }
    if (done === batch.length) {
      vipToast.success(`${done} preventas en preparación`, { description: "Los tickets se envían a la impresora." });
    } else {
      vipToast.error(`Se actualizaron ${done} de ${batch.length} preventas.`, {
        description: "Revisa las que siguen como programadas.",
      });
    }
  };

  const handleModalAdvance = (orderId: string, nextStatus: VipOrderStatus) => {
    const target = detailsModalOrder;
    if (target?.id === orderId && isVipPreorderOrder(target)) {
      void advancePreorder(target, nextStatus);
      return;
    }
    void handleAdvanceStatus(orderId, nextStatus);
  };

  const handleOpenDetails = (order: VipOrder) => {
    setDetailsModalOrder(order);
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await cancelOrder(orderId, reason);
    } catch (error) {
      vipToast.error(error instanceof Error ? error.message : "No se pudo cancelar el pedido.");
    } finally {
      if (preorders.orders.some((order) => order.id === orderId)) void refreshPreorders();
    }
  };

  const handleScannedCode = useCallback(
    async (raw: string) => {
      const parsed = parseVipScanPayload(raw);
      let order = findScannedOrder(orders, raw) || findScannedOrder(preorders.orders, raw);
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
      if (!isVipDeliverableStatus(order.estado) && isVipHistoryStatus(order.estado)) {
        vipToast.info("Esta orden ya está cerrada.");
      } else if (isVipPreorderOrder(order)) {
        setTab("preventas");
      } else if (isVipNewStatus(order.estado)) {
        vipToast.info("Esta orden aún no está aceptada.");
      } else if (isVipOnTheWayStatus(order.estado)) {
        setTab("camino");
      }
      setDetailsModalOrder(order);
      setScanValue("");
    },
    [orders, preorders.orders, token, zona],
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
    const latest =
      preorders.orders.find((order) => order.id === detailsModalOrder.id) ||
      orders.find((order) => order.id === detailsModalOrder.id);
    if (latest && latest.estado !== detailsModalOrder.estado) {
      setDetailsModalOrder(latest);
    }
  }, [orders, preorders.orders, detailsModalOrder]);

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

  const liveQueue =
    tabOrders.length === 0 ? (
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
    );

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
        acceptingOrders={acceptingOrders}
        onRequestPublicSales={setPendingSales}
        preordersEnabled={preordersEnabled}
        onRequestPreorders={setPendingPreorders}
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
            className="bg-white rounded-2xl border border-[#E2E8E5] px-3 py-2.5 flex items-center gap-2 shadow-sm shrink-0 min-w-0 w-full"
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
              className="flex-1 min-w-0 min-h-12 bg-transparent text-base font-semibold text-[#171A19] placeholder:text-[#8A9992] outline-none"
              placeholder="Escanea el QR del ticket"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="min-h-12 px-3 rounded-xl bg-[#187B56] text-white text-sm font-bold shrink-0"
            >
              Abrir
            </button>
            {isPda && (
              <button
                type="button"
                onClick={() => window.Android?.scanQr?.()}
                className="min-h-12 px-3 rounded-xl bg-[#0A1C16] text-white text-sm font-bold shrink-0 flex items-center justify-center"
                aria-label="Cámara"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}
          </form>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3.5 pr-0.5">
          {tab === "preventas" ? (
            <PreorderBoard
              orders={boardPreorders}
              loading={preorders.loading}
              error={preorders.error}
              onRetry={() => void refreshPreorders()}
              preordersEnabled={preordersEnabled}
              onTogglePreorders={setPendingPreorders}
              onAdvance={(order, status) => void advancePreorder(order, status)}
              onAdvanceMany={(batch, status) => void handlePreorderAdvanceMany(batch, status)}
              onOpenDetails={handleOpenDetails}
              busyIds={preorderBusyIds}
            />
          ) : (
            liveQueue
          )}
        </div>
      </main>

      <CentralTabs
        tab={tab}
        onChange={setTab}
        newCount={newCount}
        onTheWayCount={onTheWayCount}
        preorderCount={activePreorderCount}
        preorderUnseen={preorders.unseenCount}
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
        onAdvance={handleModalAdvance}
        onCancel={handleCancelOrder}
      />

      {pendingPreorders !== null && (
        <VipPublicSalesModal
          acceptingOrders={pendingPreorders}
          title={pendingPreorders ? "Abrir preventa" : "Cerrar preventa"}
          description={
            pendingPreorders
              ? "Con la contraseña de zona, los palcos podrán programar pedidos para los próximos partidos."
              : "Los palcos dejan de poder programar pedidos nuevos. Las preventas ya pagadas se conservan y se entregan normal."
          }
          onCancel={() => setPendingPreorders(null)}
          onConfirm={async (password) => {
            try {
              const settings = await VipService.setAdminPreorderSettings(password, pendingPreorders, token);
              setPreordersEnabled(settings.enabled);
              setPendingPreorders(null);
              vipToast.success(settings.enabled ? "Preventa abierta" : "Preventa cerrada");
            } catch (error) {
              vipToast.error(error instanceof Error ? error.message : "Contraseña incorrecta.");
            }
          }}
        />
      )}

      {pendingSales !== null && (
        <VipPublicSalesModal
          acceptingOrders={pendingSales}
          onCancel={() => setPendingSales(null)}
          onConfirm={async (password) => {
            try {
              const next = await VipService.setAdminPublicSales(password, pendingSales, token);
              setAcceptingOrders(next);
              setPendingSales(null);
              vipToast.success(next ? "Venta al público activada" : "Venta al público desactivada");
            } catch (error) {
              vipToast.error(error instanceof Error ? error.message : "Contraseña incorrecta.");
            }
          }}
        />
      )}

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

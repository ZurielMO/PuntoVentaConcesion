"use client";

import React, { useState } from "react";
import { VipModal } from "@/components/vip/ui/modal";
import { VipButton } from "@/components/vip/ui/button";
import type { VipOrder, VipOrderStatus } from "@/lib/vip/types";
import {
  formatOrderConcessions,
  groupOrderItemsByConcession,
  isVipDeliverableStatus,
  isVipNewStatus,
  uniqueOrderConcessionNames,
} from "@/lib/vip/types";
import { Printer, XCircle, MapPin, Phone, User, AlertTriangle, Check } from "lucide-react";
import { vipToast } from "@/hooks/vip/use-vip-toast";
import { printOrderTickets } from "@/lib/vip/print-ticket";

interface OrderDetailsModalProps {
  order: VipOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvance?: (orderId: string, nextStatus: VipOrderStatus) => void;
  onCancel: (orderId: string, reason: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onAdvance,
  onCancel,
}) => {
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [printing, setPrinting] = useState(false);

  if (!order) return null;

  const canDeliver = isVipDeliverableStatus(order.estado);
  const canAccept = isVipNewStatus(order.estado);
  const canCancel =
    order.estado !== "CANCELADO" &&
    order.estado !== "CANCELLED" &&
    order.estado !== "ENTREGADO" &&
    order.estado !== "DELIVERED" &&
    order.estado !== "REFUNDED";

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printOrderTickets(order);
      vipToast.info("Ticket enviado a imprimir");
    } catch {
      vipToast.error("No se pudo imprimir el ticket desde el navegador.");
    } finally {
      setPrinting(false);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      vipToast.error("Ingresa el motivo de cancelación.");
      return;
    }
    onCancel(order.id, cancelReason.trim());
    setShowCancelPrompt(false);
    onClose();
  };

  return (
    <VipModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comanda ${order.numeroPedido}`}
      titleClassName="text-xl sm:text-2xl"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 text-lg font-body-md text-[#171A19]">
        <div className="flex justify-between items-center gap-3 bg-[#F5F7F6] p-4 rounded-2xl border border-[#E2E8E5]">
          <div className="min-w-0">
            <span className="text-base uppercase font-label-sm text-[#66706B] font-bold tracking-wide">
              {uniqueOrderConcessionNames(order).length > 1 ? "Concesiones" : "Concesión"}
            </span>
            <h4 className="font-headline-md text-xl font-extrabold text-[#171A19] leading-tight">
              {formatOrderConcessions(order)}
            </h4>
            <p className="text-base text-[#66706B] mt-1 break-all">ID {order.id}</p>
          </div>
          <span className="px-3.5 py-1.5 bg-[#187B56] text-white font-headline-md font-bold text-base rounded-full shrink-0">
            {order.estado}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-xl border border-[#E2E8E5] flex items-start gap-3">
            <MapPin className="w-6 h-6 text-[#187B56] shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-[#171A19] text-xl leading-tight">
                Palco {order.ubicacion.palco} ({order.ubicacion.zona})
              </span>
              <span className="text-[#66706B] text-base block mt-1">
                {order.ubicacion.nivel || "Nivel Palcos"}
              </span>
              {order.ubicacion.notas && (
                <p className="text-[#9E7844] font-semibold text-base mt-1">
                  * {order.ubicacion.notas}
                </p>
              )}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E2E8E5] flex items-start gap-3">
            <User className="w-6 h-6 text-[#187B56] shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-[#171A19] text-xl leading-tight">
                {order.nombreCliente || "Sin nombre"}
              </span>
              <span className="text-[#66706B] text-base mt-1 flex items-center gap-1.5">
                <Phone className="w-5 h-5 shrink-0" />
                {order.telefonoCliente || "Sin teléfono"}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-[#E2E8E5] rounded-2xl overflow-hidden">
          <div className="bg-[#F5F7F6] px-4 py-2.5 font-label-md font-bold text-[#66706B] text-base uppercase tracking-wide flex justify-between border-b border-[#E2E8E5]">
            <span>Producto</span>
            <span>Subtotal</span>
          </div>
          <div className="divide-y divide-[#E2E8E5] p-2 bg-white">
            {groupOrderItemsByConcession(order).map((group) => (
              <div key={group.name}>
                {uniqueOrderConcessionNames(order).length > 1 && (
                  <p className="px-1.5 pt-3 pb-1 text-base font-extrabold uppercase tracking-wide text-[#187B56]">
                    {group.name}
                  </p>
                )}
                {group.items.map((item, idx) => (
                  <div key={item.id || idx} className="py-3 px-1.5 flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <span className="font-bold text-[#171A19] text-lg leading-snug">
                        {item.cantidad}x {item.producto.nombre}
                      </span>
                      {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
                        <p className="text-base text-[#66706B] italic pl-2 mt-0.5">
                          - {item.opcionesSeleccionadas.map((o) => o.opcionNombre).join(", ")}
                        </p>
                      )}
                      {item.instrucciones && (
                        <p className="text-base text-[#9E7844] font-semibold pl-2 mt-0.5">
                          Nota: {item.instrucciones}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-base shrink-0">${item.subtotal}.00</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#F5F7F6] p-4 rounded-xl border border-[#E2E8E5] space-y-2 text-base">
          <div className="flex justify-between text-[#66706B]">
            <span>Subtotal</span>
            <span>${order.subtotal}.00 MXN</span>
          </div>
          <div className="flex justify-between text-[#66706B]">
            <span>Cargo por servicio</span>
            <span>${order.cargoServicio}.00 MXN</span>
          </div>
          <div className="flex justify-between text-[#66706B]">
            <span>Propina</span>
            <span>${order.propina}.00 MXN</span>
          </div>
          <div className="flex justify-between text-[#171A19] font-extrabold text-xl border-t border-[#E2E8E5] pt-2 mt-1">
            <span>TOTAL</span>
            <span className="text-[#187B56]">${order.total}.00 MXN</span>
          </div>
        </div>

        {showCancelPrompt ? (
          <div className="p-3 bg-[#C43D3D]/10 rounded-xl border border-[#C43D3D]/30 space-y-2">
            <div className="flex items-center gap-2 text-[#C43D3D] font-bold text-lg">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <span>Motivo de Cancelación / Reembolso</span>
            </div>
            <input
              type="text"
              placeholder="Ej: Producto agotado en concesión / Solicitado por el cliente"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full min-h-14 p-3 rounded-lg bg-white border border-[#E2E8E5] text-lg focus:outline-none focus:border-[#C43D3D]"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCancelPrompt(false)}
                className="px-3 py-2 text-base text-[#66706B] hover:underline min-h-12"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="min-h-12 px-4 py-2 bg-[#C43D3D] text-white text-base font-bold rounded-lg"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2E8E5]">
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className="flex-1 min-w-[140px] min-h-14 py-3 px-3 bg-[#F5F7F6] hover:bg-[#EEF2F0] border border-[#E2E8E5] rounded-xl font-headline-md font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            <Printer className="w-6 h-6 text-[#187B56]" />
            <span>{printing ? "Imprimiendo…" : "Imprimir Ticket"}</span>
          </button>

          {canAccept && onAdvance && (
            <button
              type="button"
              onClick={() => onAdvance(order.id, "ACCEPTED")}
              className="flex-1 min-w-[140px] min-h-14 py-3 px-3 bg-[#187B56] text-white rounded-xl font-headline-md font-bold text-base"
            >
              Aceptar pedido
            </button>
          )}

          {canDeliver && onAdvance && (
            <button
              type="button"
              onClick={() => onAdvance(order.id, "DELIVERED")}
              className="flex-1 min-w-[140px] min-h-14 py-3 px-3 bg-[#3978A8] text-white rounded-xl font-headline-md font-bold text-base flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              Marcar entregada
            </button>
          )}

          {!showCancelPrompt && canCancel && (
            <button
              type="button"
              onClick={() => setShowCancelPrompt(true)}
              className="min-h-14 py-3 px-3 bg-[#C43D3D]/10 hover:bg-[#C43D3D]/15 text-[#C43D3D] border border-[#C43D3D]/25 rounded-xl font-headline-md font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
              <span>Cancelar</span>
            </button>
          )}

          <VipButton onClick={onClose} variant="primary" size="lg" className="flex-1 min-w-[100px]">
            Listo
          </VipButton>
        </div>
      </div>
    </VipModal>
  );
};

"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { formatJornadaLabel } from "@/lib/jornada";
import { isVentaPalcos } from "@/lib/venta-palcos";
import type { ComprobanteVenta } from "@/lib/types";

type VentaDetalleDialogProps = {
  venta: ComprobanteVenta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoNombre?: (productoId: string) => string;
  sucursalNombre?: string;
  concesionNombre?: string;
};

function TicketRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-0.5 text-[1.3rem]">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all text-right font-medium">{value}</dd>
    </div>
  );
}

export function VentaDetalleDialog({
  venta,
  open,
  onOpenChange,
  productoNombre,
  sucursalNombre,
  concesionNombre,
}: VentaDetalleDialogProps) {
  const { token } = useAuth();
  const [comprobante, setComprobante] = useState<ComprobanteVenta | null>(null);
  const [loading, setLoading] = useState(false);

  // El listado no incluye las líneas de detalle; se consulta el comprobante
  // completo (documento + subcolección detalle) al abrir el modal.
  useEffect(() => {
    if (!open || !venta?.id || !token) {
      setComprobante(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<ApiResponse<ComprobanteVenta>>(
        `${apiPaths.detalleVenta}/${venta.id}`,
        token,
      )
      .then((res) => {
        if (!cancelled) setComprobante(res.data ?? venta);
      })
      .catch(() => {
        if (!cancelled) setComprobante(venta);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, venta, token]);

  const data = comprobante ?? venta;
  const lineas = data?.detalle ?? [];
  const folio = data?.ventaId ?? data?.id ?? "—";
  const puntosCanjeados = Number(data?.puntosUsados ?? 0);
  const montoPuntos = Number(data?.montoPuntos ?? 0);
  const huboCanje = puntosCanjeados > 0;
  const esVentaPalcos = isVentaPalcos(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-x-hidden overflow-y-auto">
        <DialogHeader className="min-w-0 pr-8">
          <DialogTitle>Comprobante de venta</DialogTitle>
          <DialogDescription className="break-all">
            Folio {folio}
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="min-w-0 w-full rounded-md border bg-white px-5 py-6 shadow-sm">
            {/* Encabezado del ticket */}
            <div className="text-center">
              <p className="text-[1.6rem] font-bold uppercase tracking-wide text-green-dark">
                {concesionNombre ?? "Punto de venta"}
              </p>
              <p className="mt-1 break-words text-[1.3rem] text-muted-foreground">
                {sucursalNombre ?? data.sucursalId ?? "—"}
              </p>
              <p className="break-words text-[1.3rem] text-muted-foreground">
                {data.cajaNombre ?? "Sin caja"}
                {data.cajeroNombre ? ` · ${data.cajeroNombre}` : ""}
              </p>
              {esVentaPalcos && (
                <p className="mt-2 inline-block rounded bg-sky-100 px-2 py-0.5 text-[1.2rem] font-semibold tracking-wide text-sky-900 uppercase">
                  Venta Palcos
                </p>
              )}
            </div>

            <div className="my-4 border-t border-dashed" />

            {/* Datos del comprobante */}
            <dl className="grid gap-1">
              <TicketRow label="Folio" value={folio} />
              {data.jornadaId && (
                <TicketRow
                  label="Jornada"
                  value={formatJornadaLabel(data.jornadaId, data.inventarioId)}
                />
              )}
              <TicketRow
                label="Fecha"
                value={formatDateTime(data.fecha ?? data.createdAt)}
              />
            </dl>

            <div className="my-4 border-t border-dashed" />

            {/* Líneas del detalle */}
            {loading ? (
              <p className="py-3 text-center text-[1.3rem] text-muted-foreground">
                Cargando comprobante…
              </p>
            ) : lineas.length === 0 ? (
              <p className="py-3 text-center text-[1.3rem] text-muted-foreground">
                Sin líneas de detalle
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between gap-4 text-[1.2rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="shrink-0">Producto</span>
                  <span className="shrink-0">Importe</span>
                </div>
                {lineas.map((linea, idx) => {
                  const nombre =
                    productoNombre?.(linea.producto) ?? linea.producto;
                  const subtotal =
                    linea.subtotal ??
                    Number(linea.cantidad) * Number(linea.precio_actual);
                  return (
                    <div
                      key={`${linea.producto}-${idx}`}
                      className="min-w-0 text-[1.4rem]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="min-w-0 flex-1 break-words font-medium">
                          {nombre}
                        </span>
                        <span className="shrink-0 font-semibold">
                          {formatPrice(subtotal)}
                        </span>
                      </div>
                      <p className="text-[1.2rem] text-muted-foreground">
                        {linea.cantidad} ×{" "}
                        {formatPrice(Number(linea.precio_actual))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {huboCanje && (
              <>
                <div className="my-4 border-t border-dashed" />
                <dl className="grid gap-1">
                  <TicketRow
                    label="Puntos canjeados"
                    value={`${puntosCanjeados.toLocaleString("es-MX")} pts`}
                  />
                  <TicketRow
                    label="Valor en puntos"
                    value={`-${formatPrice(montoPuntos)}`}
                  />
                </dl>
              </>
            )}

            <div className="my-4 border-t border-dashed" />

            {/* Total */}
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-[1.4rem] font-semibold uppercase tracking-wide">
                Total
              </span>
              <span className="text-[2.2rem] font-bold text-green-dark">
                {formatPrice(Number(data.total))}
              </span>
            </div>

            {data.inventarioId && (
              <p className="mt-4 break-all text-center text-[1.1rem] text-muted-foreground">
                Inventario {data.inventarioId}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

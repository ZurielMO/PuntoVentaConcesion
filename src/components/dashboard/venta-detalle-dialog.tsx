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
import type { ComprobanteVenta } from "@/lib/types";

type VentaDetalleDialogProps = {
  venta: ComprobanteVenta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoNombre?: (productoId: string) => string;
  sucursalNombre?: string;
  concesionNombre?: string;
};

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comprobante de venta</DialogTitle>
          <DialogDescription>
            Folio {data?.ventaId ?? data?.id ?? "—"}
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="rounded-md border bg-white px-5 py-6 shadow-sm">
            {/* Encabezado del ticket */}
            <div className="text-center">
              <p className="text-[1.6rem] font-bold uppercase tracking-wide text-green-dark">
                {concesionNombre ?? "Punto de venta"}
              </p>
              <p className="mt-1 text-[1.3rem] text-muted-foreground">
                {sucursalNombre ?? data.sucursalId ?? "—"}
              </p>
              <p className="text-[1.3rem] text-muted-foreground">
                {data.cajaNombre ?? "Sin caja"}
                {data.cajeroNombre ? ` · ${data.cajeroNombre}` : ""}
              </p>
            </div>

            <div className="my-4 border-t border-dashed" />

            {/* Datos del comprobante */}
            <dl className="grid gap-1 text-[1.3rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Folio</dt>
                <dd className="font-medium">{data.ventaId ?? data.id}</dd>
              </div>
              {data.jornadaId && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Jornada</dt>
                  <dd className="font-medium">{data.jornadaId}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Fecha</dt>
                <dd className="font-medium">
                  {formatDateTime(data.fecha ?? data.createdAt)}
                </dd>
              </div>
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
              <div className="space-y-2">
                <div className="flex justify-between text-[1.2rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Producto</span>
                  <span>Importe</span>
                </div>
                {lineas.map((linea, idx) => {
                  const nombre =
                    productoNombre?.(linea.producto) ?? linea.producto;
                  const subtotal =
                    linea.subtotal ??
                    Number(linea.cantidad) * Number(linea.precio_actual);
                  return (
                    <div key={`${linea.producto}-${idx}`} className="text-[1.4rem]">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-medium">{nombre}</span>
                        <span className="font-semibold">
                          {formatPrice(subtotal)}
                        </span>
                      </div>
                      <p className="text-[1.2rem] text-muted-foreground">
                        {linea.cantidad} × {formatPrice(Number(linea.precio_actual))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="my-4 border-t border-dashed" />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-[1.4rem] font-semibold uppercase tracking-wide">
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

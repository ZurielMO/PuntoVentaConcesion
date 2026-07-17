import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CorteResumenPanel } from "@/components/dashboard/corte-resumen-panel";
import type { Corte, CorteResumen } from "@/lib/types";

function corteToResumen(corte: Corte): CorteResumen {
  return {
    totalVendido: Number(corte.totalReal ?? 0),
    totalEfectivo: Number(corte.totalEfectivo ?? corte.totalCaja ?? 0),
    totalTarjeta: Number(corte.totalTarjeta ?? 0),
    totalPuntosMonto: Number(corte.totalPuntosMonto ?? 0),
    totalPuntosCanjeados: Number(corte.totalPuntosCanjeados ?? 0),
    ventasConPuntos: Number(corte.ventasConPuntos ?? 0),
    cantidadVentas: Number(corte.cantidadVentas ?? 0),
    productos: corte.productos ?? [],
    promociones2x1: corte.promociones2x1 ?? {
      montoTotal: 0,
      montoDescuento: 0,
      unidadesGratis: 0,
      cantidadTransacciones: 0,
    },
    combos: corte.combos ?? { montoTotal: 0, cantidadVendidos: 0, items: [] },
    efectivoContado: corte.efectivoContado ?? null,
    diferenciaCaja: corte.diferenciaCaja ?? null,
    cajaNombre: corte.cajaNombre ?? null,
    cajeroNombre: null,
    corteCerrado: corte.estatus === "CERRADO",
    corteId: corte.id,
  };
}

type CorteDetalleDialogProps = {
  corte: Corte | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CorteDetalleDialog({
  corte,
  open,
  onOpenChange,
}: CorteDetalleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,56rem)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)]">
        <DialogHeader className="shrink-0 border-b border-neutral-cool px-4 py-4 pr-12 sm:px-6">
          <DialogTitle className="text-left text-[1.8rem] sm:text-[2rem]">
            Detalle del corte
          </DialogTitle>
          <DialogDescription className="text-left">
            {corte
              ? `Corte del ${corte.fecha} · ${corte.estatus}${
                  corte.cajaNombre ? ` · ${corte.cajaNombre}` : ""
                }`
              : "Sin corte seleccionado"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {corte && <CorteResumenPanel compact resumen={corteToResumen(corte)} />}
          {corte?.comentarios && (
            <p className="mt-4 rounded-sm bg-neutral-cool p-3 text-[1.3rem] leading-snug text-muted-foreground sm:text-[1.4rem]">
              {corte.comentarios}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { formatPrice } from "@/lib/format";
import {
  comisionPalcosDesdeNeto,
  COMISION_PALCOS_PERCENT,
  isVentaPalcos,
  totalCobradoPalcos,
} from "@/lib/venta-palcos";

type VentaTotalCellProps = {
  total: number;
  cajaNombre?: string | null;
  cajeroNombre?: string | null;
  ventaId?: string | null;
};

/** Total neto. En palcos agrega la comisión del 15% y el monto cobrado. */
export function VentaTotalCell({
  total,
  cajaNombre,
  cajeroNombre,
  ventaId,
}: VentaTotalCellProps) {
  const neto = Number(total);
  const palcos = isVentaPalcos({ cajaNombre, cajeroNombre, ventaId });
  const comision = palcos ? comisionPalcosDesdeNeto(neto) : 0;
  const cobrado = palcos ? totalCobradoPalcos(neto) : 0;

  return (
    <div className="min-w-0">
      <span className="font-semibold text-green-dark">{formatPrice(neto)}</span>
      {palcos && comision > 0 ? (
        <p className="mt-0.5 text-[1.15rem] font-normal leading-snug text-muted-foreground">
          Comisión {COMISION_PALCOS_PERCENT}% {formatPrice(comision)}
          <br />
          Cobrado {formatPrice(cobrado)}
        </p>
      ) : null}
    </div>
  );
}

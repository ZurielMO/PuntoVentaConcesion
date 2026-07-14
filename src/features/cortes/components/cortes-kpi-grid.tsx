"use client";

import { CircleDollarSign, ReceiptText, WalletCards } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { CountUpValue, FadeInSection } from "./cortes-motion";
import { secondaryLabelClass } from "./cortes-status";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type MetodoPago = { metodo: string; monto?: number };

export function CortesKpiGrid({
  ventasNetas,
  dineroReal,
  tickets,
  ticketPromedio,
  comision,
  onNavigateVentas,
  onNavigateDinero,
  onNavigateTickets,
  onNavigateComision,
  flash,
}: {
  ventasNetas: number;
  dineroReal: number;
  tickets: number;
  ticketPromedio: number;
  comision: number;
  onNavigateVentas: () => void;
  onNavigateDinero: () => void;
  onNavigateTickets: () => void;
  onNavigateComision: () => void;
  flash?: boolean;
}) {
  return (
    <FadeInSection className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${flash ? "motion-safe:ring-2 motion-safe:ring-primary/25 rounded-md" : ""}`}>
      <button
        type="button"
        className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onNavigateVentas}
        aria-label="Abrir detalle de ventas netas"
      >
        <StatCard
          compact
          label="Ventas netas"
          value={<CountUpValue value={ventasNetas} />}
          icon={CircleDollarSign}
          hint="Abrir reporte"
        />
      </button>
      <button
        type="button"
        className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onNavigateDinero}
        aria-label="Abrir detalle de dinero real"
      >
        <StatCard
          compact
          label="Dinero real"
          value={<CountUpValue value={dineroReal} />}
          icon={WalletCards}
          hint="Efectivo + tarjeta"
        />
      </button>
      <button
        type="button"
        className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onNavigateTickets}
        aria-label="Abrir historial de tickets"
      >
        <StatCard
          compact
          label="Tickets y promedio"
          value={`${tickets.toLocaleString("es-MX")} · ${formatPrice(ticketPromedio)}`}
          icon={ReceiptText}
          hint="Abrir historial"
        />
      </button>
      <button
        type="button"
        className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onNavigateComision}
        aria-label="Abrir detalle de comisión"
      >
        <StatCard
          compact
          label="Comisión"
          value={<CountUpValue value={comision} />}
          icon={CircleDollarSign}
          hint="Abrir cálculo"
        />
      </button>
    </FadeInSection>
  );
}

export function MetodosCobroCollapse({
  data,
  defaultOpen = false,
}: {
  data: MetodoPago[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cash = data.find((item) => item.metodo === "efectivo")?.monto;
  const card = data.find((item) => item.metodo === "tarjeta")?.monto;
  const points = data.find((item) => item.metodo === "puntos")?.monto;
  const display = (amount?: number) =>
    amount === undefined ? "Sin dato" : formatPrice(amount);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-md border border-border bg-card">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex h-auto w-full items-center justify-between px-4 py-3 text-left"
          >
            <span>
              <span className="block text-[1.45rem] font-semibold text-green-dark">
                Métodos de cobro
              </span>
              <span className={secondaryLabelClass("block")}>
                Efectivo {display(cash)} · Tarjeta {display(card)}
              </span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <dl className="grid gap-3 border-t border-border px-4 py-3 sm:grid-cols-3">
            <div>
              <dt className={secondaryLabelClass()}>Ventas en efectivo</dt>
              <dd className="font-semibold tabular-nums">{display(cash)}</dd>
            </div>
            <div>
              <dt className={secondaryLabelClass()}>Tarjeta</dt>
              <dd className="font-semibold tabular-nums">{display(card)}</dd>
            </div>
            <div>
              <dt className={secondaryLabelClass()}>Valor cubierto con puntos</dt>
              <dd className="font-semibold tabular-nums">{display(points)}</dd>
              <p className={secondaryLabelClass("mt-1 text-[1.1rem]")}>
                Los puntos no forman parte del dinero real.
              </p>
            </div>
          </dl>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

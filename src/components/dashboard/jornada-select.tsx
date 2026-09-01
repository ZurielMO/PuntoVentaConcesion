"use client";

import { cn } from "@/lib/utils";
import {
  buildJornadaSelectLabel,
  formatFechaDisplay,
  JORNADA_TODAS_ID,
  JORNADA_TODAS_LABEL,
  normalizeRama,
  ramaLabel,
  type JornadaRama,
} from "@/lib/jornada";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type JornadaSelectOption = {
  jornadaId: string;
  numero: number;
  fecha: string;
  rama?: JornadaRama | string | null;
  etiqueta?: string;
  activa?: boolean;
  equipoLocal?: string | null;
  equipoVisitante?: string | null;
};

function triggerLabel(option: JornadaSelectOption): string {
  const rama = normalizeRama(option.rama);
  let label = `J${option.numero} · ${formatFechaDisplay(option.fecha)} · ${ramaLabel(rama)}`;
  if (option.equipoLocal || option.equipoVisitante) {
    label += ` · ${option.equipoLocal ?? "—"} vs ${option.equipoVisitante ?? "—"}`;
  }
  return label;
}

type JornadaSelectProps = {
  id?: string;
  value: string;
  onValueChange: (jornadaId: string) => void;
  options: JornadaSelectOption[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Muestra opción para no filtrar por jornada (p. ej. ventas generales). */
  includeAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  triggerClassName?: string;
};

/**
 * Select de jornadas con detalle (número, fecha, rama, rival) y
 * resaltado visual para jornadas activas.
 */
export function JornadaSelect({
  id,
  value,
  onValueChange,
  options,
  loading = false,
  disabled = false,
  placeholder = "Selecciona jornada",
  includeAllOption = false,
  allOptionLabel = JORNADA_TODAS_LABEL,
  className,
  triggerClassName,
}: JornadaSelectProps) {
  const isAllSelected = value === JORNADA_TODAS_ID;
  const selected = options.find((o) => o.jornadaId === value);
  const emptyLabel = loading ? "Cargando jornadas…" : placeholder;
  const hasOptions = options.length > 0 || includeAllOption;

  return (
    <div className={cn("w-full min-w-0", className)}>
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled || loading || !hasOptions}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "h-auto min-h-10 w-full max-w-full whitespace-normal py-2 text-left text-[1.35rem] shadow-none",
            "[&>svg]:shrink-0",
            selected?.activa &&
              "border-emerald-500 bg-emerald-50 text-emerald-950",
            triggerClassName,
          )}
          aria-label="Seleccionar jornada"
        >
          {isAllSelected ? (
            <span className="truncate font-medium">{allOptionLabel}</span>
          ) : selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden pr-1">
              <span className="truncate font-medium">{triggerLabel(selected)}</span>
              {selected.activa && (
                <span className="shrink-0 rounded bg-emerald-600 px-1.5 py-0.5 text-[1.05rem] font-semibold tracking-wide text-white uppercase">
                  Activa
                </span>
              )}
            </span>
          ) : (
            <SelectValue placeholder={emptyLabel} />
          )}
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={6}
          className="z-50 w-[var(--radix-select-trigger-width)] min-w-[20rem] max-w-[min(36rem,calc(100vw-2rem))]"
        >
          {options.length === 0 && !includeAllOption ? (
            <div className="px-3 py-2 text-[1.3rem] text-muted-foreground">
              {loading ? "Cargando…" : "No hay jornadas disponibles"}
            </div>
          ) : (
            <>
              {includeAllOption && (
                <SelectItem
                  value={JORNADA_TODAS_ID}
                  textValue={allOptionLabel}
                  className="cursor-pointer py-2.5 text-[1.35rem] font-medium"
                >
                  {allOptionLabel}
                </SelectItem>
              )}
              {options.map((option) => {
              const rama = normalizeRama(option.rama);
              return (
                <SelectItem
                  key={option.jornadaId}
                  value={option.jornadaId}
                  textValue={buildJornadaSelectLabel({
                    numero: option.numero,
                    fecha: option.fecha,
                    rama,
                    equipoLocal: option.equipoLocal,
                    equipoVisitante: option.equipoVisitante,
                    activa: option.activa,
                  })}
                  className={cn(
                    "cursor-pointer py-2.5 text-[1.35rem]",
                    option.activa &&
                      "bg-emerald-50 focus:bg-emerald-100 data-highlighted:bg-emerald-100",
                  )}
                >
                  <span className="flex w-full min-w-0 flex-col gap-1.5">
                    <span className="font-medium leading-snug text-foreground">
                      Jornada {option.numero} · {formatFechaDisplay(option.fecha)}
                    </span>
                    {(option.equipoLocal || option.equipoVisitante) && (
                      <span className="text-[1.2rem] leading-snug text-muted-foreground">
                        {option.equipoLocal ?? "—"} vs{" "}
                        {option.equipoVisitante ?? "—"}
                      </span>
                    )}
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[1.1rem] font-medium",
                          rama === "femenil"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-sky-100 text-sky-800",
                        )}
                      >
                        {ramaLabel(rama)}
                      </span>
                      {option.activa && (
                        <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[1.1rem] font-semibold tracking-wide text-white uppercase">
                          Activa
                        </span>
                      )}
                    </span>
                  </span>
                </SelectItem>
              );
            })}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

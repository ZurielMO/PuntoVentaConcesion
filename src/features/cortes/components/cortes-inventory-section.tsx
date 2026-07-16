"use client";

import { useState } from "react";
import { Eye, FileDown, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CorteInventoryRow } from "../contracts";
import {
  buildInventoryCsv,
  queryInventoryRows,
  type InventoryFilter,
  type InventorySort,
} from "../view-models";
import { StatusBadge, secondaryLabelClass, type CorteStatusTone } from "./cortes-status";

function statusOf(row: CorteInventoryRow): { tone: CorteStatusTone; label: string } {
  if (row.status === "critico") return { tone: "issue", label: "Crítico" };
  if (row.status === "revision") return { tone: "pending", label: "Revisar" };
  if (row.status === "correcto") return { tone: "ok", label: "Correcto" };
  return { tone: "neutral", label: "Sin conciliación" };
}

export function CortesInventorySection({
  rows,
  loading,
  error,
  stale,
  jornadaFecha,
  onRetry,
}: {
  rows: CorteInventoryRow[];
  loading?: boolean;
  error?: string | null;
  stale?: boolean;
  requestId?: string | null;
  jornadaFecha?: string;
  onRetry?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<InventorySort>("nombre");
  const [filter, setFilter] = useState<InventoryFilter>("todos");
  const [columnView, setColumnView] = useState<"operativa" | "conciliacion" | "completa">(
    "operativa",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [moreOpen, setMoreOpen] = useState(false);
  const [selected, setSelected] = useState<CorteInventoryRow | null>(null);

  const result = queryInventoryRows({ rows, search, sort, filter, page, pageSize });
  const nullableQuantity = (value: number | null) =>
    value == null ? "N/D" : value.toLocaleString("es-MX");

  const exportCsv = () => {
    const blob = new Blob(["\uFEFF", buildInventoryCsv(result.allRows)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inventario-${jornadaFecha ?? "sin-fecha"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (error && !stale) {
    return (
      <Card role="alert" className="border-destructive/20 shadow-none">
        <CardHeader>
          <CardTitle className="text-destructive">No fue posible cargar el inventario</CardTitle>
          <CardDescription>{error}</CardDescription>
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          ) : null}
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[1.9rem] font-semibold text-green-dark">Inventario</h2>
          <p className={secondaryLabelClass("mt-1")}>
            Lectura histórica de la jornada seleccionada.
          </p>
        </div>
        {rows.length ? (
          <Button type="button" className="min-h-11" variant="outline" onClick={exportCsv}>
            <FileDown data-icon="inline-start" aria-hidden="true" />
            Exportar CSV
          </Button>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="h-72 w-full rounded-md" />
      ) : rows.length ? (
        <>
          <div className="grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Buscar" htmlFor="inventory-search">
              <Input
                id="inventory-search"
                name="inventorySearch"
                autoComplete="off"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Nombre o clave…"
              />
            </Field>
            <Field label="Conciliación" htmlFor="inventory-filter">
              <NativeSelect
                id="inventory-filter"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as InventoryFilter);
                  setPage(1);
                }}
              >
                <option value="todos">Todos</option>
                <option value="con-diferencia">Con diferencia</option>
                <option value="conciliados">Conciliados</option>
                <option value="sin-conciliacion">Sin conciliación física</option>
              </NativeSelect>
            </Field>
            <Field label="Ordenar" htmlFor="inventory-sort">
              <NativeSelect
                id="inventory-sort"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as InventorySort);
                  setPage(1);
                }}
              >
                <option value="nombre">Producto</option>
                <option value="inicial">Inventario inicial</option>
                <option value="vendido">Unidades vendidas</option>
                <option value="final">Final registrado</option>
                <option value="diferencia">Diferencia explícita</option>
              </NativeSelect>
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full"
                onClick={() => setMoreOpen(true)}
              >
                <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
                Más filtros
              </Button>
            </div>
          </div>

          {result.totalRows ? (
            <>
              <div className="dashboard-card hidden max-h-[42rem] overflow-auto md:block">
                <Table className="min-w-[36rem]">
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Regular</TableHead>
                      <TableHead className="text-right">Abonado</TableHead>
                      <TableHead className="text-right">Final registrado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rows.map((row) => {
                      const status = statusOf(row);
                      return (
                        <TableRow key={row.productoId}>
                          <TableCell className="max-w-56 font-medium">
                            <span className="block truncate">{row.nombre}</span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.vendidoRegular.toLocaleString("es-MX")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.abonado.toLocaleString("es-MX")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.finalRegistrado.toLocaleString("es-MX")}
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              className="min-h-11"
                              size="sm"
                              variant="outline"
                              onClick={() => setSelected(row)}
                            >
                              <Eye data-icon="inline-start" aria-hidden="true" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <ul className="flex flex-col gap-3 md:hidden">
                {result.rows.map((row) => {
                  const status = statusOf(row);
                  return (
                    <li key={row.productoId} className="rounded-md border border-border bg-card p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="font-medium">{row.nombre}</span>
                        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                      </div>
                      <dl className="mb-3 grid grid-cols-3 gap-2 text-[1.25rem]">
                        <div>
                          <dt className={secondaryLabelClass()}>Regular</dt>
                          <dd className="tabular-nums">
                            {row.vendidoRegular.toLocaleString("es-MX")}
                          </dd>
                        </div>
                        <div>
                          <dt className={secondaryLabelClass()}>Abonado</dt>
                          <dd className="tabular-nums">{row.abonado.toLocaleString("es-MX")}</dd>
                        </div>
                        <div>
                          <dt className={secondaryLabelClass()}>Final</dt>
                          <dd className="tabular-nums">
                            {row.finalRegistrado.toLocaleString("es-MX")}
                          </dd>
                        </div>
                      </dl>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => setSelected(row)}
                      >
                        Ver detalle
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Sin coincidencias</CardTitle>
                <CardDescription>Ajusta la búsqueda o el filtro.</CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className={secondaryLabelClass()} aria-live="polite">
              {result.totalRows === 1
                ? "1 producto"
                : `${result.totalRows} productos`}
              {result.totalPages > 1
                ? ` · Página ${result.page} de ${result.totalPages}`
                : null}
            </p>
            {result.totalPages > 1 ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="min-h-11"
                  variant="outline"
                  size="sm"
                  disabled={result.page <= 1}
                  onClick={() => setPage(result.page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  className="min-h-11"
                  variant="outline"
                  size="sm"
                  disabled={result.page >= result.totalPages}
                  onClick={() => setPage(result.page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Sin detalle de inventario</CardTitle>
            <CardDescription>
              Selecciona una concesión y una jornada con inventario.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Más filtros</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-4 px-1 pb-6">
            <Field label="Columnas visibles" htmlFor="inventory-columns">
              <NativeSelect
                id="inventory-columns"
                value={columnView}
                onChange={(e) =>
                  setColumnView(e.target.value as typeof columnView)
                }
              >
                <option value="operativa">Vista operativa</option>
                <option value="conciliacion">Conciliación</option>
                <option value="completa">Todas las disponibles</option>
              </NativeSelect>
            </Field>
            <Field label="Filas por página" htmlFor="inventory-page-size">
              <NativeSelect
                id="inventory-page-size"
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </NativeSelect>
            </Field>
            {columnView !== "operativa" ? (
              <p className={secondaryLabelClass()}>
                El detalle completo de conciliación está en el drawer de cada producto.
                La tabla principal permanece simplificada.
              </p>
            ) : null}
            <Badge variant="outline">Vista: {columnView}</Badge>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected?.nombre ?? "Producto"}</SheetTitle>
          </SheetHeader>
          {selected ? (
            <dl className="mt-4 grid gap-3 px-1 pb-6 sm:grid-cols-2">
              {(
                [
                  ["Inicial", selected.inicial.toLocaleString("es-MX")],
                  ["Regular", selected.vendidoRegular.toLocaleString("es-MX")],
                  ["Abonado", selected.abonado.toLocaleString("es-MX")],
                  ["Cortesías", selected.cortesias.toLocaleString("es-MX")],
                  ["Merma", nullableQuantity(selected.merma)],
                  ["Promociones", nullableQuantity(selected.promociones)],
                  ["Final registrado", selected.finalRegistrado.toLocaleString("es-MX")],
                  ["Esperado", nullableQuantity(selected.esperado)],
                  ["Físico", nullableQuantity(selected.fisico)],
                  ["Diferencia", nullableQuantity(selected.diferencia)],
                  ["Estado", statusOf(selected).label],
                ] as Array<[string, string]>
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className={secondaryLabelClass()}>{label}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

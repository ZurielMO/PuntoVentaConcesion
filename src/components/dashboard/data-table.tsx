"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Oculta la columna en la vista de tarjetas móvil. */
  hideOnMobile?: boolean;
  /** "action" muestra el contenido como botón ancho al pie de la tarjeta. */
  mobileRole?: "action" | "primary";
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  getRowKey: (row: T) => string;
  className?: string;
  /** Si se define, pagina los registros en el cliente. */
  pageSize?: number;
};

function TablePagination({
  from,
  to,
  total,
  safePage,
  totalPages,
  onPrev,
  onNext,
}: {
  from: number;
  to: number;
  total: number;
  safePage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-center text-[1.25rem] text-muted-foreground sm:text-left sm:text-[1.3rem]">
        Mostrando {from}–{to} de {total}
      </p>
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={onPrev}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <span className="min-w-[6rem] text-center text-[1.25rem] font-medium sm:min-w-[7rem] sm:text-[1.3rem]">
          {safePage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={onNext}
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "No hay registros",
  getRowKey,
  className,
  pageSize,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const effectivePageSize = pageSize && pageSize > 0 ? pageSize : undefined;

  useEffect(() => {
    setPage(1);
  }, [data, effectivePageSize]);

  const totalPages = effectivePageSize
    ? Math.max(1, Math.ceil(data.length / effectivePageSize))
    : 1;

  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    if (!effectivePageSize) return data;
    const start = (safePage - 1) * effectivePageSize;
    return data.slice(start, start + effectivePageSize);
  }, [data, effectivePageSize, safePage]);

  const mobileColumns = useMemo(
    () => columns.filter((col) => !col.hideOnMobile),
    [columns],
  );

  const mobileDataColumns = useMemo(
    () => mobileColumns.filter((col) => col.mobileRole !== "action"),
    [mobileColumns],
  );

  const mobileActionColumns = useMemo(
    () => mobileColumns.filter((col) => col.mobileRole === "action"),
    [mobileColumns],
  );

  if (loading) {
    return (
      <div className={cn("dashboard-card overflow-hidden", className)}>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("dashboard-card p-6 text-center sm:p-8", className)}>
        <p className="text-[1.35rem] text-muted-foreground sm:text-[1.4rem]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const from = effectivePageSize
    ? (safePage - 1) * effectivePageSize + 1
    : 1;
  const to = effectivePageSize
    ? Math.min(safePage * effectivePageSize, data.length)
    : data.length;

  const showPagination = Boolean(effectivePageSize && data.length > effectivePageSize);

  return (
    <div className={cn("dashboard-card overflow-hidden", className)}>
      {/* Vista móvil: tarjetas apiladas */}
      <div className="divide-y divide-border md:hidden">
        {pageRows.map((row) => (
          <article key={getRowKey(row)} className="space-y-2.5 p-4">
            {mobileDataColumns.map((col) => (
              <div
                key={col.key}
                className={cn(
                  "flex items-start justify-between gap-3",
                  col.mobileRole === "primary" && "border-b border-border/60 pb-2.5",
                )}
              >
                <span className="shrink-0 text-[1.2rem] font-medium text-muted-foreground">
                  {col.header}
                </span>
                <div
                  className={cn(
                    "min-w-0 text-right text-[1.35rem]",
                    col.mobileRole === "primary" && "font-semibold text-green-dark",
                  )}
                >
                  {col.cell(row)}
                </div>
              </div>
            ))}
            {mobileActionColumns.map((col) => (
              <div key={col.key} className="pt-1 [&_button]:w-full">
                {col.cell(row)}
              </div>
            ))}
          </article>
        ))}
      </div>

      {/* Vista escritorio: tabla */}
      <div className="hidden overflow-x-auto md:block">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <TablePagination
          from={from}
          to={to}
          total={data.length}
          safePage={safePage}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </div>
  );
}

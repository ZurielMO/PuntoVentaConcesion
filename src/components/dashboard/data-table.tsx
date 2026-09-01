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
      <div className={cn("dashboard-card p-8 text-center", className)}>
        <p className="text-[1.4rem] text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const from = effectivePageSize
    ? (safePage - 1) * effectivePageSize + 1
    : 1;
  const to = effectivePageSize
    ? Math.min(safePage * effectivePageSize, data.length)
    : data.length;

  return (
    <div className={cn("dashboard-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
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

      {effectivePageSize && data.length > effectivePageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-[1.3rem] text-muted-foreground">
            Mostrando {from}–{to} de {data.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="min-w-[7rem] text-center text-[1.3rem] font-medium">
              {safePage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

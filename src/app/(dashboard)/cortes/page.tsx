"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, FileDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/ui/field";
import { RequireRole } from "@/components/auth/require-role";
import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { CorteDetalleDialog } from "@/components/dashboard/corte-detalle-dialog";
import { CorteReporteProductosTable } from "@/components/dashboard/corte-reporte-productos-table";
import { CorteReporteComisionTable } from "@/components/dashboard/corte-reporte-comision-table";
import { CorteReporteIngresosPanel } from "@/components/dashboard/corte-reporte-ingresos-panel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCortes,
  useReporteCortes,
  type CorteFilters,
  type ReporteCortesFilters,
} from "@/hooks/use-cortes";
import { useJornadas } from "@/hooks/use-inventarios";
import { usePermissions } from "@/hooks/use-permissions";
import { useConcessions } from "@/hooks/use-concessions";
import { useSucursales } from "@/hooks/use-sucursales";
import {
  downloadReporteConcesionPdf,
  downloadReporteConsolidadoPdf,
} from "@/lib/cortes-pdf";
import { formatPrice } from "@/lib/format";
import type { Corte } from "@/lib/types";

const nullableMoney = (value?: number | null) =>
  value == null ? "—" : formatPrice(Number(value));

export default function CortesPage() {
  const perms = usePermissions();
  const canFilter = perms.isSuperAdmin || perms.isAdmin;

  const [concesionId, setConcesionId] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [fechaJornada, setFechaJornada] = useState("");
  const [numeroJornada, setNumeroJornada] = useState("");

  const { jornadaActiva, loading: jornadaLoading } = useJornadas();
  const { concessions } = useConcessions();
  const { sucursales } = useSucursales();

  const jornadaBanner = useMemo(() => {
    const entries = Object.values(jornadaActiva);
    return entries.find((j) => j.activo) ?? entries[0] ?? null;
  }, [jornadaActiva]);

  useEffect(() => {
    if (fechaJornada || !jornadaBanner?.fecha) return;
    setFechaJornada(String(jornadaBanner.fecha));
    if (jornadaBanner.jornada != null) {
      setNumeroJornada(String(jornadaBanner.jornada));
    }
  }, [jornadaBanner, fechaJornada]);

  const effectiveConcesionId = useMemo(() => {
    if (perms.isSuperAdmin && concesionId) return concesionId;
    if (perms.concesionId) return perms.concesionId;
    if (concesionId) return concesionId;
    return "";
  }, [perms.isSuperAdmin, perms.concesionId, concesionId]);

  const filters = useMemo<CorteFilters>(() => {
    const f: CorteFilters = {};
    if (effectiveConcesionId) f.concesionId = effectiveConcesionId;
    if (sucursalId) f.sucursalId = sucursalId;
    return f;
  }, [effectiveConcesionId, sucursalId]);

  const reporteFilters = useMemo<ReporteCortesFilters>(() => {
    const f: ReporteCortesFilters = { ...filters };
    if (fechaJornada) f.fecha = fechaJornada;
    const jornadaNum = Number(numeroJornada);
    if (numeroJornada !== "" && !Number.isNaN(jornadaNum)) {
      f.jornada = jornadaNum;
    }
    return f;
  }, [filters, fechaJornada, numeroJornada]);

  const { cortes, loading, error, refetch } = useCortes(filters);
  const {
    reporte,
    loading: loadingReporte,
    error: errorReporte,
    refetch: refetchReporte,
  } = useReporteCortes(reporteFilters);

  const sucursalesFiltradas = useMemo(() => {
    const activas = sucursales.filter((s) => s.activo !== false);
    if (perms.isSuperAdmin && concesionId) {
      return activas.filter((s) => s.concesion_id === concesionId);
    }
    return activas;
  }, [sucursales, perms.isSuperAdmin, concesionId]);

  const concesionActual = useMemo(
    () => concessions.find((c) => c.id === effectiveConcesionId),
    [concessions, effectiveConcesionId],
  );

  const [detalleCorte, setDetalleCorte] = useState<Corte | null>(null);

  const refreshAll = () => {
    void refetch();
    void refetchReporte();
  };

  const handleConcesionChange = (value: string) => {
    setConcesionId(value);
    setSucursalId("");
  };

  const handlePdfConcesion = () => {
    if (!reporte || !effectiveConcesionId) return;
    const nombre =
      concesionActual?.nombre ??
      reporte.resumen[0]?.nombre ??
      effectiveConcesionId;
    downloadReporteConcesionPdf(reporte, nombre);
  };

  const handlePdfConsolidado = () => {
    if (!reporte) return;
    downloadReporteConsolidadoPdf(reporte);
  };

  const showProductosTable = Boolean(effectiveConcesionId);
  const canPdfConcesion = Boolean(effectiveConcesionId && reporte);
  const canPdfConsolidado =
    perms.isSuperAdmin && !effectiveConcesionId && Boolean(reporte);

  return (
    <RequireRole authenticated>
      <PageHeader
        title="Cortes de caja"
        description="Reporte por producto, comisión por concesión y exportación a PDF."
        actions={
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {canFilter && perms.isSuperAdmin && (
            <Field label="Concesión" htmlFor="filtro-concesion">
              <NativeSelect
                id="filtro-concesion"
                value={concesionId}
                onChange={(e) => handleConcesionChange(e.target.value)}
              >
                <option value="">Todas las concesiones</option>
                {concessions
                  .filter((c) => c.activo !== false)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </NativeSelect>
            </Field>
          )}
          {canFilter && (
            <Field label="Sucursal" htmlFor="filtro-sucursal">
              <NativeSelect
                id="filtro-sucursal"
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
              >
                <option value="">Todas las sucursales</option>
                {sucursalesFiltradas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre ?? s.id}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          <Field label="Fecha jornada" htmlFor="filtro-fecha-jornada">
            <Input
              id="filtro-fecha-jornada"
              type="date"
              value={fechaJornada}
              onChange={(e) => setFechaJornada(e.target.value)}
              disabled={jornadaLoading && !fechaJornada}
            />
          </Field>
          <Field label="Número jornada" htmlFor="filtro-num-jornada">
            <Input
              id="filtro-num-jornada"
              type="number"
              min={1}
              step={1}
              value={numeroJornada}
              onChange={(e) => setNumeroJornada(e.target.value)}
              placeholder="Ej. 1"
            />
          </Field>
        </div>

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[1.8rem] font-semibold text-green-dark">
              Reporte de ventas
            </h2>
            {reporte && (
              <Badge variant="secondary">
                Jornada {reporte.jornada.numero} · {reporte.jornada.fecha}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {canPdfConcesion && (
              <Button size="sm" variant="outline" onClick={handlePdfConcesion}>
                <FileDown className="size-4" />
                PDF concesión
              </Button>
            )}
            {canPdfConsolidado && (
              <Button size="sm" variant="outline" onClick={handlePdfConsolidado}>
                <FileDown className="size-4" />
                PDF consolidado
              </Button>
            )}
          </div>
        </div>

        {errorReporte && (
          <div className="mb-4 rounded-sm border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
            {errorReporte}
          </div>
        )}

        {loadingReporte ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        ) : reporte ? (
          <div className="space-y-8">
            {reporte.ingresos && reporte.tiposVenta && reporte.promocionesAbonado && (
              <div>
                <h3 className="mb-3 text-[1.6rem] font-semibold text-green-dark">
                  Desglose de ingresos
                </h3>
                <CorteReporteIngresosPanel
                  ingresos={reporte.ingresos}
                  tiposVenta={reporte.tiposVenta}
                  promocionesAbonado={reporte.promocionesAbonado}
                />
              </div>
            )}

            {showProductosTable && (
              <div>
                <h3 className="mb-3 text-[1.6rem] font-semibold text-green-dark">
                  Desglose por producto
                </h3>
                <CorteReporteProductosTable
                  data={reporte.productos ?? []}
                  showHint
                />
              </div>
            )}

            <div>
              <h3 className="mb-3 text-[1.6rem] font-semibold text-green-dark">
                {showProductosTable
                  ? "Resumen de comisión"
                  : "Resumen por concesión"}
              </h3>
              <CorteReporteComisionTable
                data={reporte.resumen}
                showTotals={!showProductosTable}
              />
            </div>
          </div>
        ) : (
          !errorReporte && (
            <div className="dashboard-card p-8 text-center">
              <p className="text-[1.4rem] text-muted-foreground">
                No hay datos de reporte para los filtros seleccionados.
              </p>
            </div>
          )
        )}
      </section>

      <section>
        <h2 className="mb-4 text-[1.8rem] font-semibold text-green-dark">
          Historial de cortes
        </h2>

        {error && (
          <div className="mb-4 rounded-sm border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
            {error}
          </div>
        )}

        <DataTable<Corte>
          loading={loading}
          data={cortes}
          getRowKey={(c) => c.id}
          emptyMessage="No hay cortes registrados."
          columns={[
            { key: "fecha", header: "Fecha", cell: (c) => c.fecha },
            {
              key: "caja",
              header: "Caja",
              cell: (c) => c.cajaNombre ?? c.cajaId ?? "—",
            },
            {
              key: "estatus",
              header: "Estatus",
              cell: (c) => <Badge variant="secondary">{c.estatus}</Badge>,
            },
            {
              key: "totalReal",
              header: "Venta neta",
              cell: (c) => (
                <span className="font-medium">
                  {formatPrice(Number(c.totalReal))}
                </span>
              ),
            },
            {
              key: "totalEfectivo",
              header: "Efectivo",
              cell: (c) => nullableMoney(c.totalEfectivo ?? c.totalCaja),
            },
            {
              key: "totalTarjeta",
              header: "Tarjeta",
              cell: (c) => nullableMoney(c.totalTarjeta),
            },
            {
              key: "puntos",
              header: "Puntos",
              cell: (c) =>
                c.totalPuntosCanjeados
                  ? `${Number(c.totalPuntosCanjeados).toLocaleString("es-MX")} (${nullableMoney(c.totalPuntosMonto)})`
                  : "—",
            },
            {
              key: "detalle",
              header: "",
              cell: (c) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDetalleCorte(c)}
                >
                  <Eye className="size-4" />
                  Detalle
                </Button>
              ),
            },
          ]}
        />
      </section>

      <CorteDetalleDialog
        corte={detalleCorte}
        open={Boolean(detalleCorte)}
        onOpenChange={(open) => !open && setDetalleCorte(null)}
      />
    </RequireRole>
  );
}

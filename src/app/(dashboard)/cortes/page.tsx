"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, FileDown, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/ui/field";
import { RequireRole } from "@/components/auth/require-role";
import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { CorteDetalleDialog } from "@/components/dashboard/corte-detalle-dialog";
import { CorteReporteProductosTable } from "@/components/dashboard/corte-reporte-productos-table";
import { CorteReporteComisionTable } from "@/components/dashboard/corte-reporte-comision-table";
import { CorteReporteIngresosStats } from "@/components/dashboard/corte-reporte-ingresos-stats";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCortes,
  useReporteCortes,
  type CorteFilters,
} from "@/hooks/use-cortes";
import { useJornadasDisponibles } from "@/hooks/use-inventarios";
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

const formatJornadaCorte = (corte: Corte) => {
  if (corte.jornadaId) {
    const match = corte.jornadaId.match(/^(\d{4}-\d{2}-\d{2})__J(\d+)$/);
    if (match) {
      const [, fecha, num] = match;
      const [y, m, d] = fecha.split("-");
      return `Jornada ${num} · ${d}/${m}/${y}`;
    }
    return corte.jornadaId;
  }
  return corte.fecha;
};

export default function CortesPage() {
  const perms = usePermissions();
  const canFilter = perms.isSuperAdmin || perms.isAdmin;

  const [concesionId, setConcesionId] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [jornadaId, setJornadaId] = useState("");

  const { concessions } = useConcessions();
  const { sucursales } = useSucursales();

  const effectiveConcesionId = useMemo(() => {
    // SuperAdmin: empty filter means all concessions (do not fall back to user concesionId)
    if (perms.isSuperAdmin) return concesionId;
    if (perms.concesionId) return perms.concesionId;
    if (concesionId) return concesionId;
    return "";
  }, [perms.isSuperAdmin, perms.concesionId, concesionId]);

  const { jornadas, loading: jornadasLoading, refetch: refetchJornadas } =
    useJornadasDisponibles({
      concesionId: effectiveConcesionId || undefined,
      sucursalId: sucursalId || undefined,
    });

  useEffect(() => {
    if (jornadasLoading) return;
    if (jornadaId && jornadas.some((j) => j.jornadaId === jornadaId)) return;
    if (jornadas.length > 0) {
      setJornadaId(jornadas[0].jornadaId);
    } else if (jornadaId) {
      setJornadaId("");
    }
  }, [jornadas, jornadaId, jornadasLoading]);

  const filters = useMemo<CorteFilters>(() => {
    const f: CorteFilters = {};
    if (effectiveConcesionId) f.concesionId = effectiveConcesionId;
    if (sucursalId) f.sucursalId = sucursalId;
    if (jornadaId) f.jornadaId = jornadaId;
    return f;
  }, [effectiveConcesionId, sucursalId, jornadaId]);

  const { cortes, loading, error, refetch } = useCortes(filters);
  const {
    reporte,
    loading: loadingReporte,
    error: errorReporte,
    refetch: refetchReporte,
  } = useReporteCortes(filters);

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

  const jornadaSeleccionada = useMemo(
    () => jornadas.find((j) => j.jornadaId === jornadaId),
    [jornadas, jornadaId],
  );

  const [detalleCorte, setDetalleCorte] = useState<Corte | null>(null);

  const refreshAll = () => {
    void refetchJornadas();
    void refetch();
    void refetchReporte();
  };

  const handleConcesionChange = (value: string) => {
    setConcesionId(value);
    setSucursalId("");
    setJornadaId("");
  };

  const handleSucursalChange = (value: string) => {
    setSucursalId(value);
    setJornadaId("");
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
              onChange={(e) => handleSucursalChange(e.target.value)}
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
        <Field label="Jornada" htmlFor="filtro-jornada">
          <NativeSelect
            id="filtro-jornada"
            value={jornadaId}
            onChange={(e) => setJornadaId(e.target.value)}
            disabled={jornadasLoading}
          >
            <option value="">
              {jornadasLoading ? "Cargando jornadas…" : "Selecciona jornada"}
            </option>
            {jornadas.map((j) => (
              <option key={j.jornadaId} value={j.jornadaId}>
                {j.etiqueta}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[1.8rem] font-semibold text-green-dark">
              Reporte de ventas
            </h2>
            {(reporte || jornadaSeleccionada) && (
              <Badge variant="secondary">
                {jornadaSeleccionada?.etiqueta ??
                  `Jornada ${reporte?.jornada.numero} · ${reporte?.jornada.fecha}`}
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

        {!jornadaId && !jornadasLoading && (
          <div className="dashboard-card mb-4 p-6 text-center text-[1.4rem] text-muted-foreground">
            Selecciona una jornada para ver el reporte.
          </div>
        )}

        {loadingReporte ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-48 w-full rounded-md" />
          </div>
        ) : reporte && jornadaId ? (
          <div className="space-y-8">
            {reporte.ingresos && (
              <div>
                <h3 className="mb-3 text-[1.6rem] font-semibold text-green-dark">
                  Resumen de ingresos
                </h3>
                <CorteReporteIngresosStats ingresos={reporte.ingresos} />
                <div className="mt-3 flex items-start gap-2 rounded-sm border border-green-soft bg-green-muted p-3 text-[1.3rem] text-green-dark">
                  <Info className="mt-0.5 size-4 shrink-0 text-green-accent" />
                  <p className="min-w-0 leading-snug">
                    La venta neta es efectivo + tarjeta. Los puntos canjeados no
                    son dinero real ni base de comisión.
                  </p>
                </div>
              </div>
            )}

            {showProductosTable && (
              <div>
                <h3 className="mb-3 text-[1.6rem] font-semibold text-green-dark">
                  Desglose por producto
                </h3>
                <CorteReporteProductosTable
                  data={reporte.productos ?? []}
                  totales={reporte.productoTotales}
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
          jornadaId &&
          !errorReporte && (
            <div className="dashboard-card p-8 text-center">
              <p className="text-[1.4rem] text-muted-foreground">
                No hay datos de reporte para la jornada seleccionada.
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
          emptyMessage={
            jornadaId
              ? "No hay cortes para esta jornada."
              : "Selecciona una jornada para ver el historial."
          }
          columns={[
            {
              key: "jornada",
              header: "Jornada",
              cell: (c) => formatJornadaCorte(c),
            },
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

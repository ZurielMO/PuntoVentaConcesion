"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Eye,
  MapPin,
  Minus,
  Package,
  RefreshCw,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Warehouse,
} from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { formatCompactNumber } from "@/components/charts/chart-theme";
import { SegmentedControl } from "@/components/charts/segmented-control";
import { DashboardBanner } from "@/components/dashboard/dashboard-banner";
import { DataTable } from "@/components/dashboard/data-table";
import {
  JornadaSelect,
  type JornadaSelectOption,
} from "@/components/dashboard/jornada-select";
import { StatCard } from "@/components/dashboard/stat-card";
import { VentaDetalleDialog } from "@/components/dashboard/venta-detalle-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useConcessions } from "@/hooks/use-concessions";
import { useCortes, useDetalleVentas } from "@/hooks/use-cortes";
import { useEquipoVendedores } from "@/hooks/use-equipo";
import { useJornadas, useJornadasDisponibles } from "@/hooks/use-inventarios";
import { useProducts } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { useUsers } from "@/hooks/use-users";
import { useZonas } from "@/hooks/use-zonas";
import {
  aggregateProductosFromCortes,
  computeVariacion,
  groupVentasByConcesion,
  groupVentasByJornada,
  groupVentasByJornadaConcesion,
  groupVentasBySucursal,
  groupVentasByZona,
  sumVentas,
} from "@/lib/dashboard-stats";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  formatFechaDisplay,
  formatJornadaLabel,
  normalizeRama,
  parseJornadaId,
  ramaLabel,
} from "@/lib/jornada";
import { buildJornadaSelectOptions } from "@/lib/jornada-select-options";
import { concesionHubPath } from "@/lib/concesion-routes";
import type { ComprobanteVenta, Concession } from "@/lib/types";

function ChartPlaceholder({ tall = false }: { tall?: boolean }) {
  return (
    <div className="dashboard-card p-5">
      <Skeleton className="mb-4 h-7 w-64" />
      <Skeleton className={tall ? "h-[320px] w-full" : "h-[280px] w-full"} />
    </div>
  );
}

const JornadaTrendChart = dynamic(
  () =>
    import("@/components/charts/jornada-trend-chart").then(
      (m) => m.JornadaTrendChart,
    ),
  { ssr: false, loading: () => <ChartPlaceholder tall /> },
);

const RankingBarChart = dynamic(
  () =>
    import("@/components/charts/ranking-bar-chart").then((m) => m.RankingBarChart),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

const DonutChart = dynamic(
  () => import("@/components/charts/donut-chart").then((m) => m.DonutChart),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

type ProductoMetrica = "importe" | "unidades";

const METRICAS_PRODUCTO: { value: ProductoMetrica; label: string }[] = [
  { value: "importe", label: "Importe" },
  { value: "unidades", label: "Unidades" },
];

export default function SuperAdminDashboardPage() {
  const { posUser } = useAuth();
  const { concessions, loading: loadingCon } = useConcessions();
  const { users, loading: loadingUsers } = useUsers();
  const { zonas, loading: loadingZonas } = useZonas();
  const { sucursales, loading: loadingSuc } = useSucursales();
  const { products, loading: loadingProducts } = useProducts();
  const { ventas, loading: loadingVentas, refetch: refetchVentas } =
    useDetalleVentas();
  const { vendedores } = useEquipoVendedores();
  const [detalleVenta, setDetalleVenta] = useState<ComprobanteVenta | null>(null);

  const [concesionId, setConcesionId] = useState("");
  const [jornadaId, setJornadaId] = useState("");
  const [productoMetrica, setProductoMetrica] =
    useState<ProductoMetrica>("importe");

  const { activas } = useJornadas();
  const {
    jornadas,
    loading: loadingJornadas,
    refetch: refetchJornadas,
  } = useJornadasDisponibles({ concesionId: concesionId || undefined });

  const jornadaOptions = useMemo<JornadaSelectOption[]>(
    () => buildJornadaSelectOptions(jornadas, activas),
    [jornadas, activas],
  );

  useEffect(() => {
    if (loadingJornadas) return;
    if (jornadaId && jornadaOptions.some((j) => j.jornadaId === jornadaId)) {
      return;
    }
    const activaOpt = jornadaOptions.find((j) => j.activa);
    if (activaOpt) {
      setJornadaId(activaOpt.jornadaId);
    } else if (jornadaOptions.length > 0) {
      setJornadaId(jornadaOptions[0].jornadaId);
    } else if (jornadaId) {
      setJornadaId("");
    }
  }, [jornadaOptions, jornadaId, loadingJornadas]);

  const jornadaSeleccionada = useMemo(
    () => jornadaOptions.find((j) => j.jornadaId === jornadaId),
    [jornadaOptions, jornadaId],
  );

  const ramaSeleccionada = useMemo(() => {
    if (jornadaSeleccionada?.rama != null) {
      return normalizeRama(jornadaSeleccionada.rama);
    }
    return parseJornadaId(jornadaId)?.rama ?? "varonil";
  }, [jornadaSeleccionada, jornadaId]);

  const equipoLabel = ramaLabel(ramaSeleccionada);

  const {
    cortes,
    loading: loadingCortes,
    refetch: refetchCortes,
  } = useCortes({
    concesionId: concesionId || undefined,
    jornadaId: jornadaId || undefined,
  });

  const activeConcessions = useMemo(
    () => concessions.filter((c) => c.activo !== false),
    [concessions],
  );
  const activeUsers = users.filter((u) => u.activo !== false);
  const sucursalesActivas = sucursales.filter((s) => s.activo !== false);
  const totalCajas = sucursalesActivas.reduce(
    (acc, s) => acc + (s.cajas?.filter((c) => c.activo !== false).length ?? 0),
    0,
  );

  const concesionNombre = (id?: string | null) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  const sucursalNombre = (id?: string | null) =>
    sucursales.find((s) => s.id === id)?.nombre ?? id ?? "—";

  const productoNombre = (id: string) =>
    products.find((p) => p.id === id)?.nombre ?? id;

  // Tendencia y "vs anterior": solo jornadas de la misma rama.
  const ventasConcesion = useMemo(
    () =>
      concesionId ? ventas.filter((v) => v.concesionId === concesionId) : ventas,
    [ventas, concesionId],
  );

  const ventasMismaRama = useMemo(
    () =>
      ventasConcesion.filter((v) => {
        const parsed = parseJornadaId(v.jornadaId);
        return parsed != null && parsed.rama === ramaSeleccionada;
      }),
    [ventasConcesion, ramaSeleccionada],
  );

  const ventasFiltradas = useMemo(
    () =>
      jornadaId
        ? ventasConcesion.filter((v) => v.jornadaId === jornadaId)
        : [],
    [ventasConcesion, jornadaId],
  );

  const jornadaStats = useMemo(
    () => groupVentasByJornada(ventasMismaRama),
    [ventasMismaRama],
  );

  const porJornadaConcesion = useMemo(
    () => groupVentasByJornadaConcesion(ventasMismaRama, concessions),
    [ventasMismaRama, concessions],
  );

  const porConcesion = useMemo(
    () => groupVentasByConcesion(ventasFiltradas, concessions),
    [ventasFiltradas, concessions],
  );

  const porZona = useMemo(
    () => groupVentasByZona(ventasFiltradas, sucursales, zonas),
    [ventasFiltradas, sucursales, zonas],
  );

  const porSucursal = useMemo(
    () => groupVentasBySucursal(ventasFiltradas, sucursales),
    [ventasFiltradas, sucursales],
  );

  const productos = useMemo(
    () => aggregateProductosFromCortes(cortes),
    [cortes],
  );

  const productosData = useMemo(() => {
    const ordenados = [...productos].sort((a, b) =>
      productoMetrica === "importe"
        ? b.subtotal - a.subtotal
        : b.cantidad - a.cantidad,
    );
    return ordenados.map((p) => ({
      id: p.productoId,
      nombre: p.nombre,
      valor: productoMetrica === "importe" ? p.subtotal : p.cantidad,
    }));
  }, [productos, productoMetrica]);

  const ventaPeriodo = useMemo(() => sumVentas(ventasFiltradas), [ventasFiltradas]);
  const ticketPromedio =
    ventasFiltradas.length > 0 ? ventaPeriodo / ventasFiltradas.length : 0;

  const { jornadaActualStat, jornadaAnteriorStat } = useMemo(() => {
    if (jornadaStats.length === 0 || !jornadaId) {
      return { jornadaActualStat: null, jornadaAnteriorStat: null };
    }
    const index = jornadaStats.findIndex((s) => s.jornadaId === jornadaId);
    if (index < 0) {
      return { jornadaActualStat: null, jornadaAnteriorStat: null };
    }
    return {
      jornadaActualStat: jornadaStats[index],
      jornadaAnteriorStat: index > 0 ? jornadaStats[index - 1] : null,
    };
  }, [jornadaStats, jornadaId]);

  const variacion = computeVariacion(
    jornadaActualStat?.total ?? 0,
    jornadaAnteriorStat?.total ?? 0,
  );

  const variacionIcon =
    variacion.direccion === "up"
      ? TrendingUp
      : variacion.direccion === "down"
        ? TrendingDown
        : Minus;

  const variacionIconClass =
    variacion.pct == null
      ? "bg-neutral-cool text-muted-foreground"
      : variacion.direccion === "up"
        ? "bg-green-soft text-green-accent"
        : variacion.direccion === "down"
          ? "bg-red-50 text-[var(--red)]"
          : "bg-neutral-cool text-muted-foreground";

  const concesionLider = porConcesion[0];
  const zonaLider = porZona[0];

  const ventaPorConcesionId = useMemo(
    () => new Map(porConcesion.map((item) => [item.id, item.total])),
    [porConcesion],
  );

  const contextoJornada = jornadaId
    ? formatJornadaLabel(jornadaId)
    : "Sin jornada";
  const contextoConcesion = concesionId
    ? concesionNombre(concesionId)
    : "Todas las concesiones";
  const contexto = `${contextoConcesion} · ${contextoJornada}`;

  const bannerSubtitle = useMemo(() => {
    if (zonas.length === 0) {
      return "Empieza definiendo las zonas del estadio, luego configura cada concesión paso a paso.";
    }
    if (jornadaSeleccionada) {
      return `Panel de plataforma — datos estadísticos del equipo ${ramaLabel(jornadaSeleccionada.rama)} · Jornada ${jornadaSeleccionada.numero} · ${formatFechaDisplay(jornadaSeleccionada.fecha)}.`;
    }
    if (jornadaId) {
      const parsed = parseJornadaId(jornadaId);
      if (parsed) {
        return `Panel de plataforma — datos estadísticos del equipo ${ramaLabel(parsed.rama)} · Jornada ${parsed.numero} · ${formatFechaDisplay(parsed.fecha)}.`;
      }
    }
    return "Panel de plataforma — analítica de ventas por jornada, concesión y zona.";
  }, [zonas.length, jornadaSeleccionada, jornadaId]);

  const bannerAction = useMemo(() => {
    if (zonas.length === 0) {
      return (
        <Button asChild variant="on-dark" size="sm">
          <Link href="/superAdmin/zonas">Configurar zonas del estadio</Link>
        </Button>
      );
    }
    if (activeConcessions.length === 0) {
      return (
        <Button asChild variant="on-dark" size="sm">
          <Link href="/superAdmin/concesiones/nueva">Configurar primera concesión</Link>
        </Button>
      );
    }
    return (
      <Button asChild variant="on-dark" size="sm">
        <Link href="/superAdmin/concesiones/nueva">Nueva concesión</Link>
      </Button>
    );
  }, [zonas.length, activeConcessions.length]);

  const handleConcesionChange = (value: string) => {
    setConcesionId(value);
    // Las jornadas disponibles cambian con la concesión: re-selecciona activa.
    setJornadaId("");
  };

  const refreshAll = () => {
    void refetchJornadas();
    void refetchVentas();
    void refetchCortes();
  };

  return (
    <RequireRole superAdminOnly>
      <div className="space-y-6">
        <DashboardBanner
          title={`Hola, ${posUser?.nombre ?? "SuperAdmin"}`}
          subtitle={bannerSubtitle}
          action={bannerAction}
        />

        {zonas.length === 0 && (
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-[1.4rem] text-amber-900">
            Paso 0: crea las zonas del estadio antes de registrar sucursales.{" "}
            <Link href="/superAdmin/zonas" className="font-medium underline">
              Ir a zonas
            </Link>
          </div>
        )}

        <div className="dashboard-card p-5">
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <Field label="Concesión" htmlFor="dash-concesion">
              <NativeSelect
                id="dash-concesion"
                value={concesionId}
                onChange={(e) => handleConcesionChange(e.target.value)}
              >
                <option value="">Todas las concesiones</option>
                {activeConcessions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Jornada" htmlFor="dash-jornada">
              <JornadaSelect
                id="dash-jornada"
                value={jornadaId}
                onValueChange={setJornadaId}
                options={jornadaOptions}
                loading={loadingJornadas}
              />
            </Field>
            <Button variant="outline" onClick={refreshAll}>
              <RefreshCw className="size-4" />
              Actualizar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Venta de la jornada"
            value={loadingVentas ? "—" : formatPrice(ventaPeriodo)}
            icon={ShoppingCart}
            hint={
              loadingVentas
                ? undefined
                : `${formatCompactNumber(ventasFiltradas.length)} comprobantes · ticket prom. ${formatPrice(ticketPromedio)}`
            }
          />
          <StatCard
            label="vs jornada anterior"
            value={
              loadingVentas
                ? "—"
                : variacion.pct == null
                  ? "Sin comparativo"
                  : `${variacion.pct > 0 ? "+" : ""}${variacion.pct.toFixed(1)}%`
            }
            icon={variacionIcon}
            iconClassName={variacionIconClass}
            hint={
              jornadaAnteriorStat
                ? `${jornadaAnteriorStat.label} · ${formatPrice(jornadaAnteriorStat.total)}`
                : "Aún no hay una jornada previa con ventas"
            }
          />
          <StatCard
            label="Concesión líder"
            value={loadingVentas ? "—" : (concesionLider?.nombre ?? "Sin ventas")}
            icon={Trophy}
            hint={
              concesionLider
                ? `${formatPrice(concesionLider.total)} · ${concesionLider.participacion.toFixed(1)}% del total`
                : undefined
            }
          />
          <StatCard
            label="Zona líder"
            value={loadingVentas ? "—" : (zonaLider?.nombre ?? "Sin ventas")}
            icon={MapPin}
            hint={
              zonaLider
                ? `${formatPrice(zonaLider.total)} · ${zonaLider.participacion.toFixed(1)}% del total`
                : undefined
            }
          />
        </div>

        <JornadaTrendChart
          stats={jornadaStats}
          porConcesion={porJornadaConcesion}
          loading={loadingVentas}
          ramaLabel={jornadaId ? equipoLabel : undefined}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <RankingBarChart
            title="Comparativa entre concesiones"
            subtitle={contextoJornada}
            data={porConcesion.map((item) => ({
              id: item.id,
              nombre: item.nombre,
              valor: item.total,
            }))}
            loading={loadingVentas}
            multicolor
            emptyMessage="Sin ventas para el filtro seleccionado"
            footer={
              <ul className="space-y-1 text-[1.3rem]">
                {porConcesion.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="truncate text-muted-foreground">
                      {item.nombre}
                    </span>
                    <span className="ml-auto shrink-0 font-semibold text-green-dark">
                      {item.participacion.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            }
          />
          <DonutChart
            title="Ventas por zona del estadio"
            subtitle={contexto}
            data={porZona.map((item) => ({
              id: item.id,
              nombre: item.nombre,
              valor: item.total,
            }))}
            loading={loadingVentas}
            emptyMessage="Sin ventas para el filtro seleccionado"
            footer={
              <div className="flex items-center justify-between text-[1.3rem]">
                <span className="text-muted-foreground">
                  {porZona.length} zona{porZona.length === 1 ? "" : "s"} con venta
                </span>
                <span className="font-semibold text-green-dark">
                  {formatPrice(ventaPeriodo)}
                </span>
              </div>
            }
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <RankingBarChart
            title="Ventas por sucursal"
            subtitle={contexto}
            data={porSucursal.map((item) => ({
              id: item.id,
              nombre: item.nombre,
              valor: item.total,
            }))}
            loading={loadingVentas}
            emptyMessage="Sin ventas para el filtro seleccionado"
            footer={
              <p className="text-[1.3rem] text-muted-foreground">
                Top {Math.min(porSucursal.length, 8)} de {porSucursal.length}{" "}
                sucursales con venta
              </p>
            }
          />
          <RankingBarChart
            title="Top productos"
            subtitle="Calculado con el resumen de los cortes de caja"
            data={productosData}
            loading={loadingCortes}
            valueLabel={productoMetrica === "importe" ? "Importe" : "Unidades"}
            formatValue={
              productoMetrica === "importe"
                ? formatPrice
                : (value) => formatCompactNumber(value)
            }
            axisFormatter={
              productoMetrica === "importe" ? undefined : formatCompactNumber
            }
            emptyMessage="Aún no hay cortes con resumen de productos"
            actions={
              <SegmentedControl
                value={productoMetrica}
                options={METRICAS_PRODUCTO}
                onChange={setProductoMetrica}
                ariaLabel="Métrica de productos"
              />
            }
            footer={
              <p className="text-[1.3rem] text-muted-foreground">
                {cortes.length} corte{cortes.length === 1 ? "" : "s"} considerado
                {cortes.length === 1 ? "" : "s"} en {contextoJornada.toLowerCase()}
              </p>
            }
          />
        </div>

        <div>
          <h2 className="mb-3 text-[1.8rem] font-semibold text-green-dark">
            Resumen de plataforma
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              compact
              label="Concesiones activas"
              value={loadingCon ? "—" : activeConcessions.length}
              icon={Building2}
            />
            <StatCard
              compact
              label="Usuarios"
              value={loadingUsers ? "—" : activeUsers.length}
              icon={Users}
            />
            <StatCard
              compact
              label="Zonas"
              value={loadingZonas ? "—" : zonas.length}
              icon={MapPin}
            />
            <StatCard
              compact
              label="Sucursales / cajas"
              value={loadingSuc ? "—" : `${sucursalesActivas.length} / ${totalCajas}`}
              icon={Store}
              hint="Puntos de venta registrados"
            />
            <StatCard
              compact
              label="Productos"
              value={loadingProducts ? "—" : products.length}
              icon={Package}
            />
            <StatCard
              compact
              label="Vendedores"
              value={vendedores.length}
              icon={Users}
            />
            <StatCard
              compact
              label="Ventas registradas"
              value={loadingVentas ? "—" : formatCompactNumber(ventas.length)}
              icon={ShoppingCart}
              hint={loadingVentas ? undefined : formatPrice(sumVentas(ventas))}
            />
            <StatCard
              compact
              label="Inventarios"
              value="Ver reporte"
              icon={Warehouse}
              hint="Consulta por concesión"
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[1.8rem] font-semibold text-green-dark">
                Concesiones
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/superAdmin/concesiones">Ver todas</Link>
              </Button>
            </div>
            <DataTable<Concession>
              loading={loadingCon}
              data={activeConcessions.slice(0, 6)}
              getRowKey={(r) => r.id}
              emptyMessage="No hay concesiones registradas"
              columns={[
                {
                  key: "nombre",
                  header: "Nombre",
                  cell: (r) => <span className="font-medium">{r.nombre}</span>,
                },
                {
                  key: "venta",
                  header: "Venta",
                  cell: (r) => formatPrice(ventaPorConcesionId.get(r.id) ?? 0),
                },
                {
                  key: "activo",
                  header: "Estado",
                  cell: (r) => (
                    <Badge variant={r.activo ? "default" : "secondary"}>
                      {r.activo ? "Activa" : "Inactiva"}
                    </Badge>
                  ),
                },
                {
                  key: "config",
                  header: "",
                  cell: (r) => (
                    <Button asChild size="sm" variant="outline">
                      <Link href={concesionHubPath(r.id)}>Configurar</Link>
                    </Button>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[1.8rem] font-semibold text-green-dark">
                Ventas recientes
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/ventas">Ver reporte</Link>
              </Button>
            </div>
            <DataTable<ComprobanteVenta>
              loading={loadingVentas}
              data={ventasFiltradas.slice(0, 6)}
              getRowKey={(r) => r.id}
              emptyMessage="Sin ventas registradas"
              columns={[
                {
                  key: "fecha",
                  header: "Fecha",
                  cell: (r) => formatDateTime(r.fecha ?? r.createdAt),
                },
                {
                  key: "concesion",
                  header: "Concesión",
                  cell: (r) => concesionNombre(r.concesionId),
                },
                {
                  key: "caja",
                  header: "Caja",
                  cell: (r) => r.cajaNombre ?? "—",
                },
                {
                  key: "total",
                  header: "Total",
                  mobileRole: "primary",
                  cell: (r) => formatPrice(Number(r.total)),
                },
                {
                  key: "detalle",
                  header: "",
                  mobileRole: "action",
                  cell: (r) => (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDetalleVenta(r)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <VentaDetalleDialog
          venta={detalleVenta}
          open={Boolean(detalleVenta)}
          onOpenChange={(open) => !open && setDetalleVenta(null)}
          productoNombre={productoNombre}
          sucursalNombre={
            detalleVenta ? sucursalNombre(detalleVenta.sucursalId) : undefined
          }
          concesionNombre={
            detalleVenta ? concesionNombre(detalleVenta.concesionId) : undefined
          }
        />
      </div>
    </RequireRole>
  );
}

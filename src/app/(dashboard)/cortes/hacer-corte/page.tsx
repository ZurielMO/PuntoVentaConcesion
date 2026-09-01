"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useInventarioJornadaActiva, useJornadas } from "@/hooks/use-inventarios";
import { useProducts } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { api, apiPaths, ApiError, type ApiResponse } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import {
  buildJornadaId,
  buildJornadaSelectLabel,
  normalizeFechaJornada,
  parseJornadaId,
  type JornadaRama,
} from "@/lib/jornada";
import { UserRole, type Corte, type InventarioProducto } from "@/lib/types";
import {
  JornadaSelect,
  type JornadaSelectOption,
} from "@/components/dashboard/jornada-select";
import "@/styles/wizard-alta.css";

type ConteoRow = {
  productoId: string;
  nombre: string;
  inicial: number;
  finalActual: number;
  precio: number;
  /** Valor capturado en el input (string para permitir vacío). */
  conteo: string;
};

export default function HacerCortePage() {
  const { token } = useAuth();
  const perms = usePermissions();
  const { products } = useProducts();
  const { sucursales } = useSucursales();
  const { activas, loading: jornadasLoading } = useJornadas();

  const sucursalId = perms.sucursalId ?? "";
  const sucursalNombre =
    sucursales.find((s) => s.id === sucursalId)?.nombre ?? sucursalId;

  const [selectedJornadaId, setSelectedJornadaId] = useState("");

  const jornadaOptions = useMemo<JornadaSelectOption[]>(() => {
    const opts: JornadaSelectOption[] = [];
    for (const ramaOpt of ["varonil", "femenil"] as const) {
      const j = activas[ramaOpt];
      if (!j?.fecha || j.jornada == null) continue;
      const fecha = normalizeFechaJornada(String(j.fecha));
      const numero = Number(j.jornada);
      opts.push({
        jornadaId: buildJornadaId(fecha, numero, ramaOpt),
        numero,
        fecha,
        rama: ramaOpt,
        activa: true,
        equipoLocal: j.equipo_local,
        equipoVisitante: j.equipo_visitante,
        etiqueta: buildJornadaSelectLabel({
          numero,
          fecha,
          rama: ramaOpt,
          equipoLocal: j.equipo_local,
          equipoVisitante: j.equipo_visitante,
          activa: true,
        }),
      });
    }
    return opts;
  }, [activas]);

  useEffect(() => {
    if (jornadasLoading) return;
    if (
      selectedJornadaId &&
      jornadaOptions.some((j) => j.jornadaId === selectedJornadaId)
    ) {
      return;
    }
    if (jornadaOptions.length > 0) {
      setSelectedJornadaId(jornadaOptions[0].jornadaId);
    } else if (selectedJornadaId) {
      setSelectedJornadaId("");
    }
  }, [jornadasLoading, jornadaOptions, selectedJornadaId]);

  const rama: JornadaRama =
    parseJornadaId(selectedJornadaId)?.rama ?? "varonil";

  const { inventario, jornada, loading, error, refetch } =
    useInventarioJornadaActiva(sucursalId || undefined, {
      enabled: Boolean(sucursalId) && Boolean(selectedJornadaId),
      rama,
    });

  const [conteos, setConteos] = useState<Record<string, string>>({});
  const [comentarios, setComentarios] = useState("");
  const [efectivoContado, setEfectivoContado] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [corteCerrado, setCorteCerrado] = useState<Corte | null>(null);

  const productoNombre = (id: string) =>
    products.find((p) => p.id === id)?.nombre ?? id;

  const rows: ConteoRow[] = useMemo(() => {
    const invProductos: InventarioProducto[] = inventario?.productos ?? [];
    return invProductos.map((p) => {
      const inicial = Number(p.cantidad_inicial ?? 0);
      const finalActual = Number(p.cantidad_final ?? inicial);
      const catalogo = products.find((prod) => prod.id === p.producto_id);
      const precio =
        p.precio_jornada != null
          ? Number(p.precio_jornada)
          : Number(catalogo?.precio ?? 0);
      return {
        productoId: p.producto_id,
        nombre: productoNombre(p.producto_id),
        inicial,
        finalActual,
        precio,
        conteo: conteos[p.producto_id] ?? String(finalActual),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventario?.productos, products, conteos]);

  const parsedRows = rows.map((row) => {
    const value = row.conteo.trim() === "" ? NaN : Number(row.conteo);
    const valido =
      Number.isInteger(value) && value >= 0 && value <= row.inicial;
    const vendido = valido ? row.inicial - value : 0;
    return {
      ...row,
      cantidadFinal: value,
      valido,
      vendido,
      venta: valido ? vendido * row.precio : 0,
    };
  });

  const totalVendido = parsedRows.reduce((sum, r) => sum + r.vendido, 0);
  const totalVenta = parsedRows.reduce((sum, r) => sum + r.venta, 0);
  const hayInvalidos = parsedRows.some((r) => !r.valido);
  const puedeCerrar =
    !loading && rows.length > 0 && !hayInvalidos && !submitting && !corteCerrado;

  const setConteo = (productoId: string, value: string) => {
    setConteos((prev) => ({ ...prev, [productoId]: value }));
    setActionError(null);
  };

  const jornadaSeleccionada = jornadaOptions.find(
    (j) => j.jornadaId === selectedJornadaId,
  );

  const jornadaLabel = jornadaSeleccionada
    ? buildJornadaSelectLabel({
        numero: jornadaSeleccionada.numero,
        fecha: jornadaSeleccionada.fecha,
        rama: jornadaSeleccionada.rama,
        equipoLocal: jornadaSeleccionada.equipoLocal,
        equipoVisitante: jornadaSeleccionada.equipoVisitante,
        activa: true,
      })
    : jornada
      ? buildJornadaSelectLabel({
          numero: Number(jornada.jornada ?? 0),
          fecha: String(jornada.fecha ?? ""),
          rama,
          equipoLocal: jornada.equipo_local,
          equipoVisitante: jornada.equipo_visitante,
          activa: true,
        })
      : "Sin jornada activa";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!puedeCerrar) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!token) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const payload = {
        productos: parsedRows.map((r) => ({
          productoId: r.productoId,
          cantidadFinal: r.cantidadFinal,
        })),
        ...(comentarios.trim() ? { comentarios: comentarios.trim() } : {}),
        ...(efectivoContado.trim() !== ""
          ? { efectivoContado: Number(efectivoContado) }
          : {}),
      };
      const res = await api.post<ApiResponse<Corte>>(
        `${apiPaths.cortes}/cerrar-conteo`,
        payload,
        token,
      );
      setCorteCerrado(res.data ?? null);
      setConfirmOpen(false);
      await refetch();
    } catch (err) {
      setConfirmOpen(false);
      if (err instanceof ApiError && err.code === "CORTE_ALREADY_CLOSED") {
        setActionError(
          "Ya existe un corte cerrado para hoy en tu sucursal. Consulta el historial en Cortes.",
        );
      } else {
        setActionError(
          err instanceof Error ? err.message : "Error al cerrar el corte",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole roles={[UserRole.ADMIN_CERVECERIA]}>
      <div className="wizard-alta wizard-alta__shell wizard-alta__shell--fill">
        <header className="wizard-alta__hero">
          <div className="wizard-alta__hero-inner">
            <div>
              <h1>Hacer corte</h1>
              <p>
                Captura el inventario final de cada producto al terminar el
                día. La venta se calcula automáticamente con base en lo que
                falta del inventario inicial.
              </p>
            </div>
            <div className="wizard-alta__hero-actions">
              <button
                type="button"
                className="wizard-alta__exit"
                onClick={() => void refetch()}
                disabled={loading || submitting}
              >
                <RefreshCw className="size-4" />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {(error || actionError) && (
          <div className="mt-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
            {error ?? actionError}
          </div>
        )}

        {corteCerrado && (
          <div className="mt-4 flex flex-col gap-3 rounded-[8px] border border-emerald-200 bg-emerald-50 p-5 text-[1.4rem] text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold">Corte cerrado correctamente.</p>
                <p>
                  Venta total del día:{" "}
                  <strong>{formatPrice(Number(corteCerrado.totalReal ?? 0))}</strong>
                </p>
              </div>
            </div>
            <Link
              href="/cortes"
              className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm w-fit"
            >
              Ver historial de cortes
            </Link>
          </div>
        )}

        <div className="wizard-alta__panel mt-6">
          <div className="wizard-alta__panel-head">
            <div className="wizard-alta__identity">
              <div>
                <h2 className="wizard-alta__panel-title">
                  {sucursalId ? sucursalNombre : "Sin sucursal asignada"}
                </h2>
                <p className="wizard-alta__panel-sub">{jornadaLabel}</p>
              </div>
            </div>
            <div className="w-full md:min-w-[22rem] md:w-auto">
              <Field label="Jornada" htmlFor="jornada-corte">
                <JornadaSelect
                  id="jornada-corte"
                  value={selectedJornadaId}
                  onValueChange={(id) => {
                    setSelectedJornadaId(id);
                    setConteos({});
                    setCorteCerrado(null);
                    setActionError(null);
                  }}
                  options={jornadaOptions}
                  loading={jornadasLoading}
                  placeholder="Selecciona jornada activa"
                />
              </Field>
            </div>
          </div>

          <div className="wizard-alta__panel-body wizard-alta__panel-body--stack">
            {!sucursalId ? (
              <p className="wizard-alta__empty">
                Tu usuario no tiene una sucursal asignada. Contacta al
                administrador.
              </p>
            ) : loading ? (
              <p className="wizard-alta__empty">Cargando inventario…</p>
            ) : !inventario ? (
              <p className="wizard-alta__empty">
                No hay inventario abierto para la jornada activa de tu
                sucursal.
              </p>
            ) : rows.length === 0 ? (
              <p className="wizard-alta__empty">
                El inventario de la jornada no tiene productos cargados.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <section className="wizard-alta__section">
                  <div className="wizard-alta__section-head">
                    <div>
                      <h3 className="wizard-alta__section-title">
                        Conteo final por producto
                      </h3>
                      <p className="wizard-alta__section-sub">
                        Vendido = inicial − inventario final. Venta = vendido ×
                        precio.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`wizard-alta__table-wrap wizard-alta__table-wrap--cards${
                      rows.length > 8 ? " wizard-alta__table-wrap--scroll" : ""
                    }`}
                  >
                    <table className="wizard-alta__table wizard-alta__table--cards">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Inicial</th>
                          <th>Inventario final</th>
                          <th>Vendido</th>
                          <th>Precio</th>
                          <th>Venta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((row) => (
                          <tr key={row.productoId}>
                            <td className="wizard-alta__table-card-title">
                              <span className="wizard-alta__table-name">
                                {row.nombre}
                              </span>
                            </td>
                            <td
                              className="wizard-alta__table-muted"
                              data-label="Inicial"
                            >
                              {row.inicial}
                            </td>
                            <td data-label="Inventario final">
                              <Input
                                type="number"
                                min={0}
                                max={row.inicial}
                                step={1}
                                inputMode="numeric"
                                value={row.conteo}
                                onChange={(e) =>
                                  setConteo(row.productoId, e.target.value)
                                }
                                disabled={Boolean(corteCerrado) || submitting}
                                aria-label={`Inventario final de ${row.nombre}`}
                                aria-invalid={!row.valido}
                                className={`w-full max-w-[12rem] sm:w-[10rem] ${
                                  row.valido ? "" : "border-destructive"
                                }`}
                              />
                              {!row.valido && (
                                <p className="mt-1 text-[1.2rem] text-destructive">
                                  Entre 0 y {row.inicial}
                                </p>
                              )}
                            </td>
                            <td data-label="Vendido">
                              <span className="wizard-alta__chip">
                                {row.valido ? row.vendido : "—"}
                              </span>
                            </td>
                            <td
                              className="wizard-alta__table-muted"
                              data-label="Precio"
                            >
                              {formatPrice(row.precio)}
                            </td>
                            <td data-label="Venta">
                              <span className="wizard-alta__table-name">
                                {row.valido ? formatPrice(row.venta) : "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3}>
                            <span className="wizard-alta__table-name">
                              Totales
                            </span>
                          </td>
                          <td>
                            <span className="wizard-alta__chip">
                              {totalVendido}
                            </span>
                          </td>
                          <td />
                          <td>
                            <span className="wizard-alta__table-name">
                              {formatPrice(totalVenta)}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>

                <section className="wizard-alta__section mt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Efectivo contado (opcional)"
                      htmlFor="efectivoContado"
                    >
                      <Input
                        id="efectivoContado"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={efectivoContado}
                        onChange={(e) => setEfectivoContado(e.target.value)}
                        disabled={Boolean(corteCerrado) || submitting}
                      />
                    </Field>
                    <Field label="Comentarios (opcional)" htmlFor="comentarios">
                      <Input
                        id="comentarios"
                        type="text"
                        maxLength={1000}
                        placeholder="Ej. merma, incidencias del día…"
                        value={comentarios}
                        onChange={(e) => setComentarios(e.target.value)}
                        disabled={Boolean(corteCerrado) || submitting}
                      />
                    </Field>
                  </div>
                </section>

                <div className="wizard-alta__footer mt-6">
                  <button
                    type="submit"
                    className="wizard-alta__btn wizard-alta__btn--primary"
                    disabled={!puedeCerrar}
                  >
                    <ClipboardCheck className="size-4" />
                    {corteCerrado
                      ? "Corte cerrado"
                      : submitting
                        ? "Cerrando…"
                        : "Cerrar corte del día"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !open && !submitting && setConfirmOpen(false)}
      >
        <DialogContent className="wizard-alta wizard-alta__dialog !flex !max-w-[42rem] !flex-col !gap-0 !p-0">
          <div className="wizard-alta__dialog-head">
            <DialogHeader className="text-left">
              <DialogTitle className="wizard-alta__dialog-title">
                ¿Cerrar el corte del día?
              </DialogTitle>
              <DialogDescription className="wizard-alta__dialog-sub">
                Se registrará una venta total de{" "}
                <strong>{formatPrice(totalVenta)}</strong> ({totalVendido}{" "}
                unidades vendidas) con base en el inventario final capturado.
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="wizard-alta__dialog-body">
            <div className="wizard-alta__footer">
              <button
                type="button"
                className="wizard-alta__btn wizard-alta__btn--secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="wizard-alta__btn wizard-alta__btn--primary"
                onClick={() => void handleConfirm()}
                disabled={submitting}
              >
                {submitting ? "Cerrando…" : "Confirmar y cerrar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

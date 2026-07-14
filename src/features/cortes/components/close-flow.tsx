"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileDown,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { useCloseCorte } from "../api";
import type {
  CorteFilters,
  CorteMetricKey,
  CorteRole,
  CorteSummary,
  CloseCorteResult,
} from "../contracts";
import {
  buildClosePayload,
  buildCloseScopeIdentity,
  canSubmitReviewedClose,
  resetCloseReviewState,
  validateCloseContext,
} from "../view-models";
import { formatBusinessDate } from "../formatters";
import { useCortePdfExport } from "./use-pdf-export";

type CloseStep = "review" | "expected" | "count" | "difference" | "confirm" | "result";
const STEPS: Array<{ id: CloseStep; label: string }> = [
  { id: "review", label: "Verificación" },
  { id: "expected", label: "Resumen esperado" },
  { id: "count", label: "Conteo" },
  { id: "difference", label: "Diferencia" },
  { id: "confirm", label: "Confirmación" },
  { id: "result", label: "Resultado" },
];

const moneyOrNd = (available: boolean, value?: number | null) =>
  available && value != null ? formatPrice(value) : "N/D";

const quantityOrNd = (available: boolean, value?: number | null) =>
  available && value != null ? value.toLocaleString("es-MX") : "N/D";

export function CloseFlow({
  summary,
  freshnessEligible,
  filters,
  role,
  concessionId,
  branchId,
  generatedBy,
  onClosed,
  onRefresh,
  onHistory,
  onDashboard,
}: {
  summary: CorteSummary | null;
  freshnessEligible: boolean;
  filters: CorteFilters;
  role: CorteRole;
  concessionId?: string | null;
  branchId?: string | null;
  generatedBy?: string;
  onClosed: () => Promise<void> | void;
  onRefresh: () => Promise<unknown> | void;
  onHistory: () => void;
  onDashboard: () => void;
}) {
  const close = useCloseCorte(filters);
  const pdfExport = useCortePdfExport();
  const resetCloseAttempt = close.resetAttempt;
  const [step, setStep] = useState<CloseStep>("review");
  const [counted, setCounted] = useState("");
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<CloseCorteResult | null>(null);
  const [reviewedScopeIdentity, setReviewedScopeIdentity] = useState<string | null>(null);
  const operationalContext = {
    jornadaId: summary?.jornadaId ?? null,
    businessDate: summary?.businessDate ?? null,
  };
  const scopeIdentity = buildCloseScopeIdentity({
    concessionId,
    branchId,
    filters,
    operationalContext,
  });
  const currentScopeIdentity = `${scopeIdentity}|fresh:${freshnessEligible ? "yes" : "no"}`;
  const currentScopeIdentityRef = useRef(currentScopeIdentity);
  currentScopeIdentityRef.current = currentScopeIdentity;
  const [wizardScopeIdentity, setWizardScopeIdentity] = useState(currentScopeIdentity);
  const visibleStep: CloseStep = freshnessEligible && wizardScopeIdentity === currentScopeIdentity ? step : "review";
  const contextValidation = validateCloseContext({ role, filters, concessionId, branchId, summary });
  const validation = freshnessEligible
    ? contextValidation
    : { valid: false, reason: "Actualiza correctamente la caja antes de iniciar o continuar el cierre." };
  const countedNumber = counted.trim() === "" ? null : Number(counted);
  const available = (key: CorteMetricKey, value?: unknown) =>
    summary?.availability?.[key] ?? (value !== null && value !== undefined);
  const expectedAvailable = available("efectivoEsperado", summary?.efectivoEsperado);
  const difference = useMemo(
    () => countedNumber != null && Number.isFinite(countedNumber) && expectedAvailable && summary?.efectivoEsperado != null
      ? Math.round((countedNumber - summary.efectivoEsperado) * 100) / 100
      : null,
    [countedNumber, expectedAvailable, summary?.efectivoEsperado],
  );
  const countValid = countedNumber != null && Number.isFinite(countedNumber) && countedNumber >= 0;
  const commentRequired = difference != null && difference !== 0;
  const confirmationValid = countValid && (!commentRequired || comment.trim().length > 0);
  const reviewedScopeValid = canSubmitReviewedClose({
    validationValid: validation.valid,
    confirmationValid,
    reviewedScopeIdentity,
    currentScopeIdentity,
  });

  useEffect(() => {
    const reset = resetCloseReviewState(currentScopeIdentity);
    resetCloseAttempt();
    setStep(reset.step);
    setCounted(reset.counted);
    setComment(reset.comment);
    setResult(reset.result);
    setReviewedScopeIdentity(reset.reviewedScopeIdentity);
    setWizardScopeIdentity(reset.currentScopeIdentity);
  }, [currentScopeIdentity, resetCloseAttempt]);

  const advance = (next: CloseStep) => {
    if (freshnessEligible) setStep(next);
  };

  const submit = async () => {
    if (
      !freshnessEligible || !reviewedScopeValid || countedNumber == null || visibleStep !== "confirm" ||
      wizardScopeIdentity !== currentScopeIdentity || !summary?.jornadaId || !summary.businessDate
    ) return;
    const submittedScopeIdentity = currentScopeIdentity;
    try {
      const submission = await close.closeCorte(buildClosePayload(countedNumber, comment, {
        jornadaId: summary.jornadaId,
        businessDate: summary.businessDate,
      }));
      if (
        currentScopeIdentityRef.current !== submittedScopeIdentity ||
        !close.isCurrentAttempt(submission.attemptId)
      ) return;
      setResult(submission.result);
      setStep("result");
      await onClosed();
    } catch {
      // The hook rejects stale attempts and preserves a retryable current error.
    }
  };

  const downloadResultPdf = async () => {
    if (!result) return;
    await pdfExport.run("close-result", async () => {
      const { downloadCorteHistoricoPdf } = await import("@/lib/cortes-pdf");
      downloadCorteHistoricoPdf(result, {}, "close-snapshot", { generatedBy });
    });
  };

  if (summary?.corteCerrado && visibleStep !== "result") {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Caja cerrada</CardTitle>
              <CardDescription>El snapshot ya está disponible y no puede generarse un segundo cierre.</CardDescription>
            </div>
            <Badge variant="secondary">Cerrada</Badge>
          </div>
        </CardHeader>
        <CardContent><Button className="min-h-11" variant="outline" onClick={onHistory}>Abrir detalle</Button></CardContent>
      </Card>
    );
  }

  const warnings = [
    ...(summary?.warnings ?? []),
    ...(summary?.incidencias ?? []).filter((incident) => incident.bloqueante).map((incident) => incident.codigo),
  ];

  return (
    <div className="flex flex-col gap-4">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="Progreso del cierre">
        {STEPS.map((item, index) => {
          const activeIndex = STEPS.findIndex((entry) => entry.id === visibleStep);
          const complete = index < activeIndex;
          const active = item.id === visibleStep;
          return (
            <li key={item.id} aria-current={active ? "step" : undefined} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[1.2rem]">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted font-semibold" aria-hidden="true">{complete ? "✓" : index + 1}</span>
              <span className={active ? "font-semibold text-green-dark" : "text-muted-foreground"}>{item.label}</span>
            </li>
          );
        })}
      </ol>

      {visibleStep === "review" ? (
        <Card>
          <CardHeader>
            <CardTitle>Verifica la unidad de cierre</CardTitle>
            <CardDescription>La jornada y fecha operativa provienen del servidor y quedarán ligadas a esta revisión.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-[1.2rem] text-muted-foreground">Sesión</dt><dd className="font-medium">{filters.sesionCajaId ?? "N/D"}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Jornada</dt><dd className="font-medium">{summary?.jornadaId ?? "N/D"}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Fecha operativa</dt><dd className="font-medium">{summary?.businessDate ? formatBusinessDate(summary.businessDate) : "N/D"}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Caja</dt><dd className="font-medium">{summary?.cajaNombre ?? filters.cajaId ?? "N/D"}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Vendedor</dt><dd className="font-medium">{summary?.cajeroNombre ?? filters.idUser ?? "N/D"}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Hora de apertura</dt><dd className="font-medium">N/D</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Duración</dt><dd className="font-medium">N/D</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Comprobantes</dt><dd className="font-medium">{quantityOrNd(available("cantidadVentas", summary?.cantidadVentas), summary?.cantidadVentas)}</dd></div>
            </dl>
            <div className="rounded-md border border-border bg-muted p-3 text-[1.3rem]">
              <strong>Advertencias</strong>
              <p className="text-muted-foreground">{warnings.length ? warnings.join(" · ") : "Sin advertencias bloqueantes reportadas."}</p>
            </div>
            {!validation.valid ? (
              <div role="status" className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border bg-muted p-3 text-[1.3rem]">
                <span className="flex items-start gap-2"><CircleAlert aria-hidden="true" />{validation.reason}</span>
                <Button variant="outline" size="sm" onClick={() => void onRefresh()}><RefreshCw data-icon="inline-start" aria-hidden="true" />Actualizar contexto</Button>
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button className="min-h-11" disabled={!validation.valid} onClick={() => { if (!freshnessEligible) return; setReviewedScopeIdentity(currentScopeIdentity); advance("expected"); }}>
                Revisar resumen esperado<ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visibleStep === "expected" ? (
        <Card>
          <CardHeader>
            <CardTitle>Resumen esperado</CardTitle>
            <CardDescription>Valores de solo lectura. «Efectivo esperado por ventas» no incluye movimientos cuando el servidor no los expone.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-[1.2rem] text-muted-foreground">Fondo inicial</dt><dd className="font-semibold tabular-nums">{moneyOrNd(available("fondoInicial", summary?.fondoInicial), summary?.fondoInicial)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Efectivo esperado por ventas</dt><dd className="font-semibold tabular-nums">{moneyOrNd(available("totalEfectivo", summary?.totalEfectivo), summary?.totalEfectivo)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Entradas</dt><dd className="font-semibold tabular-nums">{moneyOrNd(summary?.movimientosCaja?.entradas !== undefined, summary?.movimientosCaja?.entradas)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Salidas</dt><dd className="font-semibold tabular-nums">{moneyOrNd(summary?.movimientosCaja?.salidas !== undefined, summary?.movimientosCaja?.salidas)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Retiros</dt><dd className="font-semibold tabular-nums">{moneyOrNd(summary?.movimientosCaja?.retiros !== undefined, summary?.movimientosCaja?.retiros)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Devoluciones</dt><dd className="font-semibold tabular-nums">{moneyOrNd(summary?.movimientosCaja?.devoluciones !== undefined, summary?.movimientosCaja?.devoluciones)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Movimientos netos</dt><dd className="font-semibold tabular-nums">{moneyOrNd(summary?.movimientosCaja?.neto !== undefined, summary?.movimientosCaja?.neto)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Efectivo esperado</dt><dd className="font-semibold tabular-nums">{moneyOrNd(expectedAvailable, summary?.efectivoEsperado)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Tarjeta</dt><dd className="font-semibold tabular-nums">{moneyOrNd(available("totalTarjeta", summary?.totalTarjeta), summary?.totalTarjeta)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Puntos</dt><dd className="font-semibold tabular-nums">{moneyOrNd(available("totalPuntosMonto", summary?.totalPuntosMonto), summary?.totalPuntosMonto)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Total neto</dt><dd className="font-semibold tabular-nums">{moneyOrNd(available("ventasNetas", summary?.ventasNetas), summary?.ventasNetas)}</dd></div>
            </dl>
            {!expectedAvailable ? <p role="status" className="rounded-md border border-border bg-muted p-3 text-[1.3rem] text-muted-foreground">El servidor no expone un efectivo esperado autoritativo; la diferencia preliminar se mostrará como N/D.</p> : null}
            <div className="flex flex-wrap justify-between gap-2">
              <Button className="min-h-11" variant="outline" onClick={() => setStep("review")}><ArrowLeft data-icon="inline-start" aria-hidden="true" />Volver</Button>
              <Button className="min-h-11" disabled={!freshnessEligible} onClick={() => advance("count")}>Registrar conteo<ArrowRight data-icon="inline-end" aria-hidden="true" /></Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visibleStep === "count" ? (
        <Card>
          <CardHeader><CardTitle>Registra el efectivo contado</CardTitle><CardDescription>No puedes modificar los importes esperados del servidor.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Efectivo contado" htmlFor="corte-efectivo-contado" error={!countValid && counted ? "Ingresa un importe válido y no negativo." : null}>
                <Input id="corte-efectivo-contado" name="efectivoContado" autoComplete="off" type="number" min="0" step="0.01" inputMode="decimal" value={counted} onChange={(event) => setCounted(event.target.value)} aria-invalid={!countValid && Boolean(counted)} />
              </Field>
              <Field label="Notas" htmlFor="corte-comentario" hint={commentRequired ? "Obligatorias cuando existe diferencia." : "Opcionales; máximo 1000 caracteres."}>
                <Input id="corte-comentario" name="comentarios" autoComplete="off" maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} aria-required={commentRequired} />
              </Field>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <Button className="min-h-11" variant="outline" onClick={() => setStep("expected")}><ArrowLeft data-icon="inline-start" aria-hidden="true" />Volver</Button>
              <Button className="min-h-11" disabled={!freshnessEligible || !countValid} onClick={() => advance("difference")}>Calcular diferencia<ArrowRight data-icon="inline-end" aria-hidden="true" /></Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visibleStep === "difference" ? (
        <Card>
          <CardHeader><CardTitle>Diferencia</CardTitle><CardDescription>La diferencia sólo se calcula contra el efectivo esperado autoritativo.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div><dt className="text-[1.2rem] text-muted-foreground">Importe</dt><dd className="text-[1.8rem] font-semibold tabular-nums">{difference == null ? "N/D" : formatPrice(difference)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Resultado</dt><dd className="font-semibold">{difference == null ? "Sin dato" : difference < 0 ? "Faltante" : difference > 0 ? "Sobrante" : "Sin diferencia"}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Umbral / autorización</dt><dd className="font-semibold">N/D</dd></div>
            </dl>
            {commentRequired && !comment.trim() ? <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-[1.3rem] text-destructive">Captura un motivo en Notas para continuar con esta diferencia.</p> : null}
            <div className="flex flex-wrap justify-between gap-2">
              <Button className="min-h-11" variant="outline" onClick={() => setStep("count")}><ArrowLeft data-icon="inline-start" aria-hidden="true" />Corregir conteo</Button>
              <Button className="min-h-11" disabled={!freshnessEligible || !reviewedScopeValid} onClick={() => advance("confirm")}>Revisar cierre<ArrowRight data-icon="inline-end" aria-hidden="true" /></Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visibleStep === "confirm" ? (
        <Card>
          <CardHeader><CardTitle>Confirma el cierre</CardTitle><CardDescription>Esta acción crea un snapshot inmutable. La clave idempotente evita un cierre duplicado.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div><dt className="text-[1.2rem] text-muted-foreground">Efectivo esperado</dt><dd className="text-[1.8rem] font-semibold tabular-nums">{moneyOrNd(expectedAvailable, summary?.efectivoEsperado)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Efectivo contado</dt><dd className="text-[1.8rem] font-semibold tabular-nums">{countedNumber == null ? "N/D" : formatPrice(countedNumber)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Diferencia preliminar</dt><dd className="text-[1.8rem] font-semibold tabular-nums">{difference == null ? "N/D" : formatPrice(difference)}</dd></div>
            </dl>
            {comment ? <p className="rounded-md border border-border p-3 text-[1.3rem]"><strong>Notas:</strong> {comment}</p> : null}
            {close.error ? (
              <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-[1.3rem] text-destructive">
                <CircleAlert aria-hidden="true" />
                <div>
                  <strong>No se confirmó el cierre.</strong>
                  <p>{close.errorCode === "CORTE_CONTEXT_CHANGED" ? "La jornada o fecha operativa cambió. Actualiza el contexto y vuelve a revisar el cierre." : close.error}</p>
                  {close.errorCode !== "CORTE_CONTEXT_CHANGED" ? <p>Reintentar conservará la misma clave idempotente.</p> : null}
                  {close.requestId ? <p>Referencia de soporte: {close.requestId}</p> : null}
                  {close.errorCode === "CORTE_CONTEXT_CHANGED" ? <Button className="mt-2" variant="outline" size="sm" onClick={() => void onRefresh()}><RefreshCw data-icon="inline-start" aria-hidden="true" />Actualizar contexto</Button> : null}
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap justify-between gap-2">
              <Button className="min-h-11" variant="outline" disabled={close.loading} onClick={() => setStep("difference")}><ArrowLeft data-icon="inline-start" aria-hidden="true" />Volver</Button>
              <Button className="min-h-11" disabled={!freshnessEligible || close.loading || !reviewedScopeValid || close.errorCode === "CORTE_CONTEXT_CHANGED"} onClick={() => void submit()}>
                {close.loading ? <LoaderCircle data-icon="inline-start" className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : close.error ? <RefreshCw data-icon="inline-start" aria-hidden="true" /> : null}
                {close.loading ? "Confirmando…" : close.error ? "Reintentar cierre" : "Confirmar y cerrar caja"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visibleStep === "result" && result ? (
        <Card>
          <CardHeader><div className="flex items-start gap-3"><CheckCircle2 className="text-green-accent" aria-hidden="true" /><div><CardTitle>Cierre confirmado</CardTitle><CardDescription>El snapshot quedó registrado con folio {result.id}.</CardDescription></div></div></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2"><Badge variant="secondary">{result.estatus}</Badge>{result.idempotentReplay ? <Badge variant="outline">Respuesta recuperada de forma idempotente</Badge> : null}</div>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div><dt className="text-[1.2rem] text-muted-foreground">Dinero real</dt><dd className="font-semibold tabular-nums">{formatPrice(result.totalReal)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Efectivo contado</dt><dd className="font-semibold tabular-nums">{result.efectivoContado == null ? "N/D" : formatPrice(result.efectivoContado)}</dd></div>
              <div><dt className="text-[1.2rem] text-muted-foreground">Diferencia</dt><dd className="font-semibold tabular-nums">{result.diferenciaCaja == null ? "N/D" : formatPrice(result.diferenciaCaja)}</dd></div>
            </dl>
            {pdfExport.error ? (
              <p id="corte-result-pdf-error" role="alert" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-[1.3rem] text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {pdfExport.error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                className="min-h-11"
                disabled={pdfExport.exporting}
                aria-busy={pdfExport.exporting}
                aria-describedby={pdfExport.error ? "corte-result-pdf-error" : undefined}
                onClick={() => void downloadResultPdf()}
              >
                {pdfExport.exporting ? <LoaderCircle data-icon="inline-start" className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <FileDown data-icon="inline-start" aria-hidden="true" />}
                {pdfExport.exporting ? "Generando resumen…" : "Descargar resumen PDF"}
              </Button>
              <Button className="min-h-11" variant="outline" onClick={onHistory}>Abrir detalle</Button>
              <Button className="min-h-11" variant="outline" onClick={onDashboard}>Regresar al dashboard</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

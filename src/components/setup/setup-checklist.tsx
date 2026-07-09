"use client";

import Link from "next/link";
import { ArrowRight, Check, Package } from "lucide-react";
import type { ConcesionSetupStatus } from "@/lib/concesion-setup";
import { cn } from "@/lib/utils";

type SetupChecklistProps = {
  status: ConcesionSetupStatus;
  className?: string;
  showProgress?: boolean;
};

export function SetupChecklist({
  status,
  className,
  showProgress = true,
}: SetupChecklistProps) {
  const { steps, completedCount, totalCount, progressPercent, readyForJornada } =
    status;
  const pendingCount = totalCount - completedCount;

  return (
    <div className={cn(className)}>
      {showProgress && (
        <div className="wizard-alta__setup-progress">
          <div className="wizard-alta__setup-progress-meta">
            <span className="wizard-alta__setup-progress-count">
              {completedCount}/{totalCount}
            </span>
            <span className="wizard-alta__setup-progress-label">
              {readyForJornada
                ? "configuración completa"
                : pendingCount === 1
                  ? "1 paso pendiente"
                  : `${pendingCount} pasos pendientes`}
            </span>
          </div>
          <div
            className="wizard-alta__setup-progress-track"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso de configuración"
          >
            <div
              className="wizard-alta__setup-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="wizard-alta__table-wrap">
        <table className="wizard-alta__table">
          <thead>
            <tr>
              <th>Paso</th>
              <th>Estado</th>
              <th>Detalle</th>
              <th className="wizard-alta__table-actions-col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr key={step.id}>
                <td>
                  <div className="wizard-alta__setup-step-cell">
                    <span
                      className={cn(
                        "wizard-alta__setup-step-num",
                        step.done && "wizard-alta__setup-step-num--done",
                      )}
                      aria-hidden
                    >
                      {step.done ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    <span className="wizard-alta__table-name">{step.title}</span>
                  </div>
                </td>
                <td>
                  <span
                    className={cn(
                      "wizard-alta__status-pill",
                      step.done
                        ? "wizard-alta__status-pill--on"
                        : "wizard-alta__status-pill--pending",
                    )}
                  >
                    {step.done ? "Completo" : "Pendiente"}
                  </span>
                </td>
                <td className="wizard-alta__table-muted">{step.description}</td>
                <td className="wizard-alta__table-actions-col">
                  {step.href && step.actionLabel ? (
                    <div className="wizard-alta__table-actions">
                      <Link
                        href={step.href}
                        className={cn(
                          "wizard-alta__btn wizard-alta__btn--sm",
                          step.done
                            ? "wizard-alta__btn--outline"
                            : "wizard-alta__btn--primary",
                        )}
                      >
                        {step.actionLabel}
                        {!step.done && <ArrowRight className="size-3.5" />}
                      </Link>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {readyForJornada ? (
        <div className="wizard-alta__setup-complete">
          <div>
            <p className="wizard-alta__setup-complete-title">
              Configuración completa
            </p>
            <p className="wizard-alta__setup-complete-sub">
              El día del partido, abre el inventario desde la jornada activa.
            </p>
          </div>
          <Link
            href={status.inventariosHref}
            className="wizard-alta__btn wizard-alta__btn--primary wizard-alta__btn--sm"
          >
            <Package className="size-4" />
            Ir a inventarios
          </Link>
        </div>
      ) : null}
    </div>
  );
}

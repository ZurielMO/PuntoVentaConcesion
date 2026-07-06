"use client";

import { Check } from "lucide-react";
import type { StepperItem } from "./setup-stepper";

type WizardBrandStepperProps = {
  steps: StepperItem[];
  currentStepId: string;
  completedStepIds?: string[];
};

export function WizardBrandStepper({
  steps,
  currentStepId,
  completedStepIds = [],
}: WizardBrandStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <nav className="wizard-alta__stepper" aria-label="Progreso del asistente">
      <ol className="wizard-alta__stepper-list">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isDone =
            completedStepIds.includes(step.id) || index < currentIndex;
          const isOptional =
            step.description?.toLowerCase().includes("opcional");

          return (
            <li
              key={step.id}
              className={`wizard-alta__step${isCurrent ? " wizard-alta__step--current" : ""}${isDone && !isCurrent ? " wizard-alta__step--done" : ""}`}
            >
              <div className="wizard-alta__step-btn" aria-current={isCurrent ? "step" : undefined}>
                <span className="wizard-alta__step-num">
                  {isDone && !isCurrent ? (
                    <>
                      <Check className="size-3.5" aria-hidden />
                      Paso {index + 1}
                    </>
                  ) : (
                    <>Paso {index + 1}</>
                  )}
                </span>
                <span className="wizard-alta__step-label">
                  {step.label}
                  {isOptional && (
                    <span className="wizard-alta__step-badge">Opcional</span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

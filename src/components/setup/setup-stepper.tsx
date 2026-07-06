"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepperItem = {
  id: string;
  label: string;
  description?: string;
};

type SetupStepperProps = {
  steps: StepperItem[];
  currentStepId: string;
  completedStepIds?: string[];
  className?: string;
};

export function SetupStepper({
  steps,
  currentStepId,
  completedStepIds = [],
  className,
}: SetupStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <nav aria-label="Progreso de configuración" className={cn("w-full", className)}>
      <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedStepIds.includes(step.id);
          const isCurrent = step.id === currentStepId;
          const isPast = index < currentIndex;

          return (
            <li
              key={step.id}
              className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center"
            >
              <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-[1.2rem] font-semibold transition-colors",
                    isCompleted || isPast
                      ? "border-green-accent bg-green-accent text-white"
                      : isCurrent
                        ? "border-green-accent bg-green-soft text-green-dark"
                        : "border-border bg-white text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted || isPast ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "hidden h-0.5 flex-1 sm:block sm:h-auto sm:w-full sm:flex-none sm:self-center",
                      "sm:min-w-[2rem] sm:max-w-[4rem]",
                      isPast || isCompleted ? "bg-green-accent" : "bg-border",
                    )}
                    style={{ minHeight: 0 }}
                    aria-hidden
                  />
                )}
              </div>
              <div className="min-w-0 pb-4 sm:pb-0">
                <p
                  className={cn(
                    "text-[1.3rem] font-medium leading-tight",
                    isCurrent ? "text-green-dark" : "text-foreground",
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-[1.2rem] text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

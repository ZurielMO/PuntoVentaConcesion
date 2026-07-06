"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>
              {readyForJornada
                ? "Lista para operar en jornada de partido."
                : "Completa cada paso para dejar la concesión operativa."}
            </CardDescription>
          </div>
          {showProgress && (
            <div className="text-right">
              <p className="text-[2.4rem] font-bold text-green-dark">
                {completedCount}/{totalCount}
              </p>
              <p className="text-[1.2rem] text-muted-foreground">pasos</p>
            </div>
          )}
        </div>
        {showProgress && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-cool">
            <div
              className="h-full rounded-full bg-green-accent transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-[8px] border px-4 py-3",
              step.done
                ? "border-green-soft bg-green-muted/50"
                : "border-border bg-white",
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              {step.done ? (
                <Check
                  className="mt-0.5 size-5 shrink-0 text-green-accent"
                  aria-hidden
                />
              ) : (
                <Circle
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <p className="text-[1.4rem] font-medium">{step.title}</p>
                <p className="text-[1.2rem] text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
            {step.href && step.actionLabel && (
              <Button asChild size="sm" variant={step.done ? "outline" : "default"}>
                <Link href={step.href}>{step.actionLabel}</Link>
              </Button>
            )}
          </div>
        ))}
        {readyForJornada && (
          <div className="mt-4 rounded-[8px] border border-green-soft bg-green-muted p-4">
            <p className="text-[1.4rem] font-medium text-green-dark">
              Configuración completa
            </p>
            <p className="mt-1 text-[1.2rem] text-muted-foreground">
              El día del partido, abre el inventario desde la jornada activa.
            </p>
            <Button asChild size="sm" className="mt-3" variant="outline">
              <Link href="/inventarios">Ir a inventarios</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

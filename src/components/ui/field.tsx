import type { ReactNode } from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  className?: string;
  children: ReactNode;
};

/**
 * Bloque de formulario normalizado: Label arriba, control, helper/error abajo.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-[1.3rem] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[1.3rem] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

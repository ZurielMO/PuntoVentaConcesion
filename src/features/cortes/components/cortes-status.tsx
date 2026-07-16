import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CorteStatusTone = "ok" | "pending" | "issue" | "neutral";

const TONE_BADGE: Record<CorteStatusTone, string> = {
  ok: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  pending:
    "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  issue:
    "border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  neutral: "border-transparent bg-muted text-muted-foreground",
};

const TONE_DOT: Record<CorteStatusTone, string> = {
  ok: "bg-emerald-600",
  pending: "bg-amber-500",
  issue: "bg-red-600",
  neutral: "bg-neutral-400",
};

export function statusToneClass(tone: CorteStatusTone) {
  return TONE_BADGE[tone];
}

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: CorteStatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", TONE_BADGE[tone], className)}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])}
        aria-hidden="true"
      />
      {children}
    </Badge>
  );
}

export function secondaryLabelClass(className?: string) {
  return cn("text-[1.25rem] text-foreground/70", className);
}

export function roleDisplayLabel(role: "VENDEDOR" | "ADMIN" | "SUPERADMIN") {
  if (role === "SUPERADMIN") return "Superadmin";
  if (role === "ADMIN") return "Admin";
  return "Vendedor";
}

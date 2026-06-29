import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-3xl px-[var(--outer-gutter)] py-[var(--space-5)]">
      <h1>Tickets</h1>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Módulo en construcción</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-[1.6rem] text-muted-foreground">
            La API de tickets está disponible en el backend bajo{" "}
            <code className="rounded bg-ceramic px-1">/api/tickets</code>. Este
            módulo se implementará en siguientes iteraciones.
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { RequireRole } from "@/components/auth/require-role";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import type { Ticket } from "@/lib/types";

export default function TicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Ticket[]>>(apiPaths.tickets, token);
      setTickets(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  return (
    <RequireRole authenticated>
      <div className="bg-neutral-warm py-[var(--space-5)]">
        <div className="mx-auto max-w-[900px] px-[var(--outer-gutter)]">
          <h1 className="mb-8">Tickets</h1>
          {loading && <p>Cargando…</p>}
          <div className="grid gap-4">
            {tickets.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-6">
                  <p className="font-medium">{t.fecha} · {t.metodo_pago}</p>
                  <p className="text-[1.4rem] text-muted-foreground">
                    Total: ${t.total} · {t.status}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" className="mt-6" onClick={fetchTickets}>
            Actualizar
          </Button>
          <p className="mt-4 text-[1.4rem] text-muted-foreground">
            Para registrar ventas con inventario usa{" "}
            <Link href="/ventas" className="text-green-accent underline">
              Ventas
            </Link>
            .
          </p>
        </div>
      </div>
    </RequireRole>
  );
}

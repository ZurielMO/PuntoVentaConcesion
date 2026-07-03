"use client";

import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, apiPaths, type ApiResponse } from "@/lib/api/client";
import type { Ticket } from "@/lib/types";

export default function TicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Ticket[]>>(apiPaths.tickets, token);
      setTickets(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  return (
    <RequireRole authenticated>
      <PageHeader
        title="Tickets"
        description="Registro legacy de tickets. Accesible por URL durante la transición."
        actions={
          <Button variant="outline" size="sm" onClick={() => void fetchTickets()}>
            Actualizar
          </Button>
        }
      />

      {loading && <p className="mb-4 text-muted-foreground">Cargando…</p>}

      <div className="grid gap-4">
        {tickets.map((t) => (
          <div key={t.id} className="dashboard-card p-5">
            <p className="font-medium">
              {t.fecha} · {t.metodo_pago}
            </p>
            <p className="text-[1.4rem] text-muted-foreground">
              Total: ${t.total} · {t.status}
            </p>
          </div>
        ))}
      </div>

      {!loading && tickets.length === 0 && (
        <p className="mt-4 text-[1.4rem] text-muted-foreground">No hay tickets registrados.</p>
      )}

      <Button asChild variant="outline" className="mt-6">
        <Link href="/ventas">Ir a ventas</Link>
      </Button>
    </RequireRole>
  );
}

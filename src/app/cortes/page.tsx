"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireRole } from "@/components/auth/require-role";
import { useCortes } from "@/hooks/use-cortes";

export default function CortesPage() {
  const { cortes, loading, error, refetch, createCorte } = useCortes();
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    estatus: "CERRADO",
    totalReal: "",
    totalCaja: "",
    comentarios: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCorte({
        fecha: form.fecha,
        estatus: form.estatus,
        totalReal: Number(form.totalReal),
        totalCaja: Number(form.totalCaja),
        comentarios: form.comentarios || undefined,
      });
      setForm({ ...form, totalReal: "", totalCaja: "", comentarios: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole authenticated>
      <div className="bg-neutral-warm py-[var(--space-5)]">
        <div className="mx-auto max-w-[900px] px-[var(--outer-gutter)]">
          <h1 className="mb-8">Cortes de caja</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nuevo corte</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  required
                />
                <Input
                  placeholder="Estatus"
                  value={form.estatus}
                  onChange={(e) => setForm({ ...form, estatus: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Total real"
                  value={form.totalReal}
                  onChange={(e) => setForm({ ...form, totalReal: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Total caja"
                  value={form.totalCaja}
                  onChange={(e) => setForm({ ...form, totalCaja: e.target.value })}
                  required
                />
                <Input
                  placeholder="Comentarios"
                  value={form.comentarios}
                  onChange={(e) => setForm({ ...form, comentarios: e.target.value })}
                  className="md:col-span-2"
                />
                <Button type="submit" disabled={submitting} className="md:col-span-2">
                  Registrar corte
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && <p>Cargando…</p>}
          {error && <p className="text-destructive">{error}</p>}

          <div className="grid gap-4">
            {cortes.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-6">
                  <p className="font-medium">{c.fecha} · {c.estatus}</p>
                  <p className="text-[1.4rem] text-muted-foreground">
                    Real: ${c.totalReal} · Caja: ${c.totalCaja}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" className="mt-6" onClick={() => refetch()}>
            Actualizar
          </Button>
        </div>
      </div>
    </RequireRole>
  );
}

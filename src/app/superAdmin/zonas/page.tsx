"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireRole } from "@/components/auth/require-role";
import { useZonas } from "@/hooks/use-zonas";
import type { Zona } from "@/lib/types";

export default function ZonasPage() {
  const { zonas, loading, error, refetch, createZona, updateZona, deleteZona } = useZonas();
  const [nombre, setNombre] = useState("");
  const [editing, setEditing] = useState<Zona | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateZona(editing.id, { zona: nombre });
        setEditing(null);
      } else {
        await createZona({ zona: nombre, activo: true });
      }
      setNombre("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole superAdminOnly>
      <div className="bg-neutral-warm py-[var(--space-5)]">
        <div className="mx-auto max-w-[900px] px-[var(--outer-gutter)]">
          <h1 className="mb-2">Zonas del estadio</h1>
          <p className="mb-8 text-[1.6rem] text-muted-foreground">
            Las sucursales de cada concesión se crean sobre estas zonas.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editing ? "Editar zona" : "Nueva zona"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex gap-4">
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre de la zona"
                  required
                />
                <Button type="submit" disabled={submitting}>
                  {editing ? "Guardar" : "Crear"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && <p>Cargando…</p>}
          {error && <p className="text-destructive">{error}</p>}

          <div className="grid gap-4">
            {zonas.map((z) => (
              <Card key={z.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <span className="text-[1.6rem]">{z.zona}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(z);
                        setNombre(z.zona);
                      }}
                    >
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteZona(z.id)}>
                      Desactivar
                    </Button>
                  </div>
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

"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireRole } from "@/components/auth/require-role";
import { useSucursales } from "@/hooks/use-sucursales";
import { useZonas } from "@/hooks/use-zonas";
import { usePermissions } from "@/hooks/use-permissions";

export default function SucursalesPage() {
  const perms = usePermissions();
  const { sucursales, loading, error, refetch, createSucursal } = useSucursales();
  const { zonas } = useZonas();

  const [nombre, setNombre] = useState("");
  const [zonaId, setZonaId] = useState("");
  const [cajas, setCajas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!perms.concesionId) {
      setActionError("Tu usuario no tiene concesión asignada");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await createSucursal(perms.concesionId, zonaId, {
        sucursal: {
          nombre,
          cajas: cajas
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        },
      });
      setNombre("");
      setCajas("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al crear sucursal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole adminOrAbove>
      <div className="bg-neutral-warm py-[var(--space-5)]">
        <div className="mx-auto max-w-[1000px] px-[var(--outer-gutter)]">
          <h1 className="mb-2">Sucursales</h1>
          <p className="mb-8 text-[1.6rem] text-muted-foreground">
            Crea puntos de venta en las zonas definidas por SuperAdmin.
          </p>

          {perms.canManageSucursales && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Nueva sucursal</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Nombre de sucursal"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                  <select
                    className="h-10 rounded-md border px-3 text-[1.4rem]"
                    value={zonaId}
                    onChange={(e) => setZonaId(e.target.value)}
                    required
                  >
                    <option value="">Zona</option>
                    {zonas.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.zona}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Cajas (separadas por coma)"
                    value={cajas}
                    onChange={(e) => setCajas(e.target.value)}
                    className="md:col-span-2"
                  />
                  <Button type="submit" disabled={submitting} className="md:col-span-2">
                    Crear sucursal
                  </Button>
                </form>
                {actionError && (
                  <p className="mt-3 text-destructive">{actionError}</p>
                )}
              </CardContent>
            </Card>
          )}

          {loading && <p>Cargando…</p>}
          {error && <p className="text-destructive">{error}</p>}

          <div className="grid gap-4">
            {sucursales.map((s) => (
              <Card key={s.id}>
                <CardContent className="pt-6">
                  <p className="text-[1.6rem] font-medium">{s.nombre ?? s.id}</p>
                  <p className="text-[1.4rem] text-muted-foreground">
                    Zona: {s.zona_id} · Cajas: {s.cajas?.length ?? 0}
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

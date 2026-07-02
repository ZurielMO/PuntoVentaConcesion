"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireRole } from "@/components/auth/require-role";
import { useSucursales } from "@/hooks/use-sucursales";
import { useZonas } from "@/hooks/use-zonas";
import { useEquipoVendedores } from "@/hooks/use-equipo";
import { usePermissions } from "@/hooks/use-permissions";
import type { Sucursal } from "@/lib/types";

function SucursalCajasCard({
  sucursal,
  onAddCaja,
  onRenameCaja,
  onDeleteCaja,
}: {
  sucursal: Sucursal;
  onAddCaja: (sucursalId: string, nombre: string) => Promise<void>;
  onRenameCaja: (sucursalId: string, cajaId: string, nombre: string) => Promise<void>;
  onDeleteCaja: (sucursalId: string, cajaId: string) => Promise<void>;
}) {
  const [newCaja, setNewCaja] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);

  const cajasActivas = (sucursal.cajas ?? []).filter((c) => c.activo !== false);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCaja.trim()) return;
    setBusy(true);
    try {
      await onAddCaja(sucursal.id, newCaja.trim());
      setNewCaja("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-[1.6rem] font-medium">{sucursal.nombre ?? sucursal.id}</p>
        <p className="mb-4 text-[1.4rem] text-muted-foreground">
          Zona: {sucursal.zona_id} · {cajasActivas.length} caja(s)
        </p>

        <div className="mb-4 space-y-2">
          {cajasActivas.length === 0 && (
            <p className="text-[1.3rem] text-muted-foreground">Sin cajas registradas.</p>
          )}
          {cajasActivas.map((caja) => (
            <div
              key={caja.id}
              className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
            >
              {editingId === caja.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await onRenameCaja(sucursal.id, caja.id, editName);
                        setEditingId(null);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[1.4rem]">{caja.nombre ?? caja.id}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(caja.id);
                      setEditName(caja.nombre ?? caja.id);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await onDeleteCaja(sucursal.id, caja.id);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Desactivar
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={(e) => void handleAdd(e)} className="flex gap-2">
          <Input
            placeholder="Nombre de nueva caja"
            value={newCaja}
            onChange={(e) => setNewCaja(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={busy || !newCaja.trim()}>
            Agregar caja
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SucursalesPage() {
  const perms = usePermissions();
  const {
    sucursales,
    loading,
    error,
    refetch,
    createSucursal,
    createCaja,
    updateCaja,
    deleteCaja,
  } = useSucursales();
  const { zonas } = useZonas();
  const { vendedores, assignVendedor, refetch: refetchEquipo } = useEquipoVendedores();

  const [nombre, setNombre] = useState("");
  const [zonaId, setZonaId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [assignUserId, setAssignUserId] = useState("");
  const [assignSucursalId, setAssignSucursalId] = useState("");
  const [assignCajaId, setAssignCajaId] = useState("");

  const cajasDeSucursal = sucursales.find((s) => s.id === assignSucursalId)?.cajas ?? [];

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
        sucursal: { nombre },
      });
      setNombre("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al crear sucursal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignSucursalId) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await assignVendedor(assignUserId, assignSucursalId, assignCajaId || null);
      setAssignUserId("");
      setAssignCajaId("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al asignar vendedor");
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
            Administra puntos de venta, cajas y asignación de vendedores.
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
                  <Button type="submit" disabled={submitting} className="md:col-span-2">
                    Crear sucursal
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {perms.canManageEquipo && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Equipo de caja — asignación default</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => void handleAssign(e)} className="grid gap-4 md:grid-cols-2">
                  <select
                    className="h-10 rounded-md border px-3 text-[1.4rem] md:col-span-2"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    required
                  >
                    <option value="">Vendedor</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.uid ?? v.id}>
                        {v.nombre} ({v.email})
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-10 rounded-md border px-3 text-[1.4rem]"
                    value={assignSucursalId}
                    onChange={(e) => {
                      setAssignSucursalId(e.target.value);
                      setAssignCajaId("");
                    }}
                    required
                  >
                    <option value="">Sucursal</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre ?? s.id}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-10 rounded-md border px-3 text-[1.4rem]"
                    value={assignCajaId}
                    onChange={(e) => setAssignCajaId(e.target.value)}
                  >
                    <option value="">Caja (opcional)</option>
                    {cajasDeSucursal
                      .filter((c) => c.activo !== false)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre ?? c.id}
                        </option>
                      ))}
                  </select>
                  <Button type="submit" disabled={submitting} className="md:col-span-2">
                    Asignar vendedor
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {actionError && <p className="mb-4 text-destructive">{actionError}</p>}
          {loading && <p>Cargando…</p>}
          {error && <p className="text-destructive">{error}</p>}

          <div className="grid gap-4">
            {sucursales.map((s) => (
              <SucursalCajasCard
                key={s.id}
                sucursal={s}
                onAddCaja={async (id, n) => {
                  await createCaja(id, n);
                }}
                onRenameCaja={async (id, cajaId, n) => {
                  await updateCaja(id, cajaId, { nombre: n });
                }}
                onDeleteCaja={async (id, cajaId) => {
                  await deleteCaja(id, cajaId);
                }}
              />
            ))}
          </div>

          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              void refetch();
              void refetchEquipo();
            }}
          >
            Actualizar
          </Button>
        </div>
      </div>
    </RequireRole>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { RefreshCw, Search, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { useTrabajadoresClub } from "@/hooks/use-trabajadores-club";
import { formatDateTime } from "@/lib/format";
import type { TrabajadorClub } from "@/lib/types";

export default function TrabajadoresClubPage() {
  const {
    trabajadores,
    loading,
    error,
    refetch,
    searchResult,
    searching,
    searchError,
    searchByEmail,
    addTrabajador,
    updateCortesiaCanjeada,
    removeTrabajador,
    clearSearch,
  } = useTrabajadoresClub();

  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removing, setRemoving] = useState<TrabajadorClub | null>(null);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresa un correo electrónico");
      return;
    }
    try {
      await searchByEmail(email.trim());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo buscar el usuario",
      );
    }
  };

  const handleAdd = async () => {
    if (!searchResult?.uid) return;
    setAdding(true);
    try {
      await addTrabajador(searchResult.uid);
      toast.success("Trabajador del club agregado");
      setEmail("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo agregar al trabajador",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleToggleCortesia = async (row: TrabajadorClub) => {
    setTogglingUid(row.uid);
    try {
      await updateCortesiaCanjeada(row.uid, !row.cortesiaCanjeada);
      toast.success("Cortesía actualizada");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo actualizar la cortesía",
      );
    } finally {
      setTogglingUid(null);
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await removeTrabajador(removing.uid);
      toast.success("Trabajador removido del panel");
      setRemoveDialogOpen(false);
      setRemoving(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo remover al trabajador",
      );
    }
  };

  const columns = [
    {
      key: "nombre",
      header: "Nombre",
      cell: (row: TrabajadorClub) => (
        <span className="font-medium">{row.nombre}</span>
      ),
    },
    {
      key: "email",
      header: "Correo",
      cell: (row: TrabajadorClub) => row.email,
    },
    {
      key: "telefono",
      header: "Teléfono",
      cell: (row: TrabajadorClub) => row.telefono ?? "—",
    },
    {
      key: "nivel",
      header: "Nivel",
      cell: (row: TrabajadorClub) => row.nivel ?? "—",
    },
    {
      key: "puntos",
      header: "Puntos",
      cell: (row: TrabajadorClub) => row.puntosActuales ?? 0,
    },
    {
      key: "agregado",
      header: "Agregado",
      cell: (row: TrabajadorClub) =>
        row.trabajadorClubAgregadoAt
          ? formatDateTime(row.trabajadorClubAgregadoAt)
          : "—",
    },
    {
      key: "acciones",
      header: "",
      cell: (row: TrabajadorClub) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            setRemoving(row);
            setRemoveDialogOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <RequireRole superAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Trabajadores Club"
          description="Busca clientes de la app oficial por correo y agrégalos como trabajadores del club."
        />

        <section className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="text-sm font-semibold">Buscar cliente por correo</h2>
          <form
            onSubmit={(e) => void handleSearch(e)}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Field label="Correo electrónico" className="flex-1">
              <Input
                type="email"
                placeholder="usuario@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={searching}>
                <Search className="h-4 w-4 mr-2" />
                {searching ? "Buscando…" : "Buscar"}
              </Button>
              {searchResult && (
                <Button type="button" variant="outline" onClick={clearSearch}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          {searchError && !searchResult && (
            <p className="text-sm text-destructive">{searchError}</p>
          )}

          {searchResult && (
            <div className="rounded-md border bg-muted/30 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-base">{searchResult.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {searchResult.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{searchResult.rol}</Badge>
                  {searchResult.esTrabajadorClub && (
                    <Badge>TRABAJADOR_CLUBLEON</Badge>
                  )}
                  {!searchResult.activo && (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Teléfono</dt>
                  <dd>{searchResult.telefono ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Proveedor</dt>
                  <dd>{searchResult.provider ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Puntos</dt>
                  <dd>{searchResult.puntosActuales ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Nivel</dt>
                  <dd>{searchResult.nivel ?? "—"}</dd>
                </div>
              </dl>

              {!searchResult.puedeAgregar && searchResult.motivoNoAgregar && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {searchResult.motivoNoAgregar}
                </p>
              )}

              <Button
                type="button"
                disabled={!searchResult.puedeAgregar || adding}
                onClick={() => void handleAdd()}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {adding ? "Agregando…" : "Agregar a trabajadores del club"}
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">
              Panel de trabajadores ({trabajadores.length})
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DataTable
            columns={columns}
            data={trabajadores}
            loading={loading}
            emptyMessage="Aún no hay trabajadores del club registrados."
            getRowKey={(row) => row.uid}
          />
        </section>

        <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quitar trabajador del club</DialogTitle>
              <DialogDescription>
                Se removerá el rol TRABAJADOR_CLUBLEON de{" "}
                <strong>{removing?.nombre}</strong>. Seguirá siendo CLIENTE en
                la app.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRemoveDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleRemove()}
              >
                Quitar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireRole>
  );
}

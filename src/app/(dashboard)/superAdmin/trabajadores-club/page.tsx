"use client";

import { useState, type FormEvent } from "react";
import { Eye, RefreshCw, Search, Trash2, UserPlus, X } from "lucide-react";
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
import type { CortesiaTrabajadorClub, TrabajadorClub } from "@/lib/types";

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
    fetchCortesias,
    addTrabajador,
    updateCortesiaCanjeada,
    removeTrabajador,
    clearSearch,
  } = useTrabajadoresClub();

  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removing, setRemoving] = useState<TrabajadorClub | null>(null);
  const [cortesiasDialogOpen, setCortesiasDialogOpen] = useState(false);
  const [selectedTrabajador, setSelectedTrabajador] =
    useState<TrabajadorClub | null>(null);
  const [cortesias, setCortesias] = useState<CortesiaTrabajadorClub[]>([]);
  const [cortesiasLoading, setCortesiasLoading] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

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
      toast.success("Trabajador del club agregado con cortesías del torneo");
      setEmail("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo agregar al trabajador",
      );
    } finally {
      setAdding(false);
    }
  };

  const openCortesias = async (row: TrabajadorClub) => {
    setSelectedTrabajador(row);
    setCortesiasDialogOpen(true);
    setCortesiasLoading(true);
    try {
      const data = await fetchCortesias(row.uid);
      setCortesias(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudieron cargar las cortesías",
      );
      setCortesias([]);
    } finally {
      setCortesiasLoading(false);
    }
  };

  const handleToggleCortesia = async (cortesia: CortesiaTrabajadorClub) => {
    if (!selectedTrabajador) return;
    setTogglingKey(cortesia.id);
    try {
      const updated = await updateCortesiaCanjeada(
        selectedTrabajador.uid,
        cortesia.id,
        !cortesia.cortesiaCanjeada,
      );
      setCortesias((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Cortesía actualizada");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo actualizar la cortesía",
      );
    } finally {
      setTogglingKey(null);
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
      key: "cortesias",
      header: "Cortesías",
      cell: (row: TrabajadorClub) => (
        <span>
          {row.cortesiasCanjeadas}/{row.cortesiasTotal} canjeadas
        </span>
      ),
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
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void openCortesias(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
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
        </div>
      ),
    },
  ];

  return (
    <RequireRole superAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Trabajadores Club"
          description="Busca clientes de la app oficial por correo y agrégalos como trabajadores del club con cortesías por jornada de local."
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
                </div>
              </div>

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

        <Dialog open={cortesiasDialogOpen} onOpenChange={setCortesiasDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cortesías por jornada</DialogTitle>
              <DialogDescription>
                {selectedTrabajador?.nombre} — partidos de local del torneo actual.
              </DialogDescription>
            </DialogHeader>

            {cortesiasLoading ? (
              <p className="text-sm text-muted-foreground">Cargando cortesías…</p>
            ) : cortesias.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay cortesías sincronizadas. Verifica el calendario en RTDB o espera
                al cron semanal.
              </p>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto space-y-2">
                {cortesias.map((cortesia) => (
                  <div
                    key={cortesia.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        J{cortesia.jornada}: {cortesia.equipoLocal} vs{" "}
                        {cortesia.equipoVisitante}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {cortesia.fecha}
                        {cortesia.hora ? ` · ${cortesia.hora}` : ""}
                        {cortesia.estadio ? ` · ${cortesia.estadio}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{cortesia.torneo}</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <Checkbox
                        checked={cortesia.cortesiaCanjeada}
                        disabled={togglingKey === cortesia.id}
                        onChange={() => void handleToggleCortesia(cortesia)}
                      />
                      <span className="text-sm">
                        {cortesia.cortesiaCanjeada ? "Canjeada" : "Pendiente"}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quitar trabajador del club</DialogTitle>
              <DialogDescription>
                Se removerá el rol TRABAJADOR_CLUBLEON y sus cortesías de{" "}
                <strong>{removing?.nombre}</strong>. Seguirá siendo CLIENTE en la app.
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

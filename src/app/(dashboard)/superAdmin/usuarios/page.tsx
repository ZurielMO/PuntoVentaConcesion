"use client";

import { useState, type FormEvent } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
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
import { Badge } from "@/components/ui/badge";
import {
  useUsers,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "@/hooks/use-users";
import { useConcessions } from "@/hooks/use-concessions";
import { useConcesionFilterParam } from "@/hooks/use-concesion-filter-param";
import { useSucursales } from "@/hooks/use-sucursales";
import { UserRole, type User } from "@/lib/types";

type FormState = {
  nombre: string;
  email: string;
  password: string;
  fecha_nacimiento: string;
  rol: UserRole;
  concesionId: string;
  sucursalId: string;
  activo: boolean;
};

const emptyForm = (): FormState => ({
  nombre: "",
  email: "",
  password: "",
  fecha_nacimiento: "1990-01-01",
  rol: UserRole.VENDEDOR,
  concesionId: "",
  sucursalId: "",
  activo: true,
});

export default function UsuariosPage() {
  const [concesionFilter, setConcesionFilter] = useConcesionFilterParam();
  const { users, loading, error, refetch, createUser, updateUser, deleteUser } =
    useUsers(concesionFilter || undefined);
  const { concessions } = useConcessions();
  const { sucursales } = useSucursales();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const concesionNombre = (id?: string | null) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  const sucursalesFiltradas = sucursales.filter(
    (s) => !form.concesionId || s.concesion_id === form.concesionId,
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      nombre: u.nombre ?? "",
      email: u.email ?? "",
      password: "",
      fecha_nacimiento: u.fecha_nacimiento ?? "1990-01-01",
      rol: (u.rol as UserRole) || UserRole.VENDEDOR,
      concesionId: u.concesionId ?? "",
      sucursalId: u.sucursalId ?? "",
      activo: u.activo !== false,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        const payload: UpdateUserPayload = {
          nombre: form.nombre,
          email: form.email,
          fecha_nacimiento: form.fecha_nacimiento,
          rol: form.rol,
          concesionId: form.concesionId || null,
          activo: form.activo,
          sucursalId:
            form.rol === UserRole.VENDEDOR ? form.sucursalId || null : null,
        };
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await updateUser(editing.id, payload);
        toast.success("Usuario actualizado");
      } else {
        const payload: CreateUserPayload = {
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          fecha_nacimiento: form.fecha_nacimiento,
          rol: form.rol,
          concesionId: form.concesionId,
          activo: true,
          ...(form.rol === UserRole.VENDEDOR
            ? { sucursalId: form.sucursalId }
            : {}),
        };
        await createUser(payload);
        toast.success("Usuario creado");
      }
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole superAdminOnly>
      <PageHeader
        title="Usuarios"
        description="Alta y administración de administradores y vendedores por concesión."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Agregar
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="mb-4 max-w-xs">
        <NativeSelect
          value={concesionFilter}
          onChange={(e) => setConcesionFilter(e.target.value)}
          aria-label="Filtrar por concesión"
        >
          <option value="">Todas las concesiones</option>
          {concessions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </NativeSelect>
      </div>

      {error && (
        <div className="mb-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
          {error}
        </div>
      )}

      <DataTable<User>
        loading={loading}
        data={users}
        getRowKey={(u) => u.id}
        emptyMessage="No hay usuarios registrados."
        columns={[
          {
            key: "nombre",
            header: "Nombre",
            cell: (u) => <span className="font-medium">{u.nombre}</span>,
          },
          { key: "email", header: "Email", cell: (u) => u.email },
          {
            key: "rol",
            header: "Rol",
            cell: (u) => <Badge variant="secondary">{u.rol}</Badge>,
          },
          {
            key: "concesion",
            header: "Concesión",
            cell: (u) => concesionNombre(u.concesionId),
          },
          {
            key: "estado",
            header: "Estado",
            cell: (u) => (
              <Badge variant={u.activo !== false ? "default" : "secondary"}>
                {u.activo !== false ? "Activo" : "Inactivo"}
              </Badge>
            ),
          },
          {
            key: "acciones",
            header: "Acciones",
            cell: (u) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void deleteUser(u.id)}
                >
                  Desactivar
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar usuario" : "Nuevo usuario"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Actualiza los datos del usuario."
                : "Completa los datos para dar de alta un usuario."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" htmlFor="nombre">
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </Field>
              <Field
                label={editing ? "Contraseña (opcional)" : "Contraseña"}
                htmlFor="password"
                hint={editing ? "Dejar vacío para no cambiar" : undefined}
              >
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!editing}
                />
              </Field>
              <Field label="Fecha de nacimiento" htmlFor="fecha">
                <Input
                  id="fecha"
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) =>
                    setForm({ ...form, fecha_nacimiento: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Rol" htmlFor="rol">
                <NativeSelect
                  id="rol"
                  value={form.rol}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rol: e.target.value as UserRole,
                      sucursalId: "",
                    })
                  }
                >
                  <option value={UserRole.ADMIN}>ADMIN</option>
                  <option value={UserRole.VENDEDOR}>VENDEDOR</option>
                  <option value={UserRole.SUPERADMIN}>SUPERADMIN</option>
                </NativeSelect>
              </Field>
              {form.rol !== UserRole.SUPERADMIN && (
                <Field label="Concesión" htmlFor="concesion">
                  <NativeSelect
                    id="concesion"
                    value={form.concesionId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        concesionId: e.target.value,
                        sucursalId: "",
                      })
                    }
                    required
                  >
                    <option value="">Selecciona concesión</option>
                    {concessions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
              {form.rol === UserRole.VENDEDOR && (
                <Field
                  label="Sucursal"
                  htmlFor="sucursal"
                  className="sm:col-span-2"
                >
                  <NativeSelect
                    id="sucursal"
                    value={form.sucursalId}
                    onChange={(e) =>
                      setForm({ ...form, sucursalId: e.target.value })
                    }
                    required
                  >
                    <option value="">Selecciona sucursal</option>
                    {sucursalesFiltradas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre ?? s.id}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
              {editing && (
                <label
                  className="flex items-center gap-3 text-[1.4rem] sm:col-span-2"
                  htmlFor="activo"
                >
                  <Checkbox
                    id="activo"
                    checked={form.activo}
                    onChange={(e) =>
                      setForm({ ...form, activo: e.target.checked })
                    }
                  />
                  Usuario activo
                </label>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : editing ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

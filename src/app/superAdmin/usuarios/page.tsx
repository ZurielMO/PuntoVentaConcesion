"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireRole } from "@/components/auth/require-role";
import { useUsers, type CreateUserPayload } from "@/hooks/use-users";
import { useConcessions } from "@/hooks/use-concessions";
import { useSucursales } from "@/hooks/use-sucursales";
import { UserRole } from "@/lib/types";

export default function UsuariosPage() {
  const [concesionFilter, setConcesionFilter] = useState("");
  const { users, loading, error, refetch, createUser, deleteUser } = useUsers(
    concesionFilter || undefined,
  );
  const { concessions } = useConcessions();
  const { sucursales } = useSucursales();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    fecha_nacimiento: "1990-01-01",
    rol: UserRole.VENDEDOR as UserRole.ADMIN | UserRole.VENDEDOR,
    concesionId: "",
    sucursalId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const sucursalesFiltradas = sucursales.filter(
    (s) => !form.concesionId || s.concesion_id === form.concesionId,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const payload: CreateUserPayload = {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        fecha_nacimiento: form.fecha_nacimiento,
        rol: form.rol,
        concesionId: form.concesionId,
        activo: true,
        ...(form.rol === UserRole.VENDEDOR ? { sucursalId: form.sucursalId } : {}),
      };
      await createUser(payload);
      setForm({
        nombre: "",
        email: "",
        password: "",
        fecha_nacimiento: "1990-01-01",
        rol: UserRole.VENDEDOR,
        concesionId: form.concesionId,
        sucursalId: "",
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al crear usuario");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireRole superAdminOnly>
      <div className="bg-neutral-warm py-[var(--space-5)]">
        <div className="mx-auto max-w-[1200px] px-[var(--outer-gutter)] lg:px-[var(--outer-gutter-lg)]">
          <div className="mb-8">
            <h1>Usuarios</h1>
            <p className="mt-2 text-[1.6rem] text-muted-foreground">
              Solo SuperAdmin puede dar de alta administradores y vendedores.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nuevo usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <Input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) =>
                    setForm({ ...form, fecha_nacimiento: e.target.value })
                  }
                  required
                />
                <select
                  className="h-10 rounded-md border px-3 text-[1.4rem]"
                  value={form.rol}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rol: e.target.value as UserRole.ADMIN | UserRole.VENDEDOR,
                    })
                  }
                >
                  <option value={UserRole.ADMIN}>ADMIN</option>
                  <option value={UserRole.VENDEDOR}>VENDEDOR</option>
                </select>
                <select
                  className="h-10 rounded-md border px-3 text-[1.4rem]"
                  value={form.concesionId}
                  onChange={(e) =>
                    setForm({ ...form, concesionId: e.target.value, sucursalId: "" })
                  }
                  required
                >
                  <option value="">Selecciona concesión</option>
                  {concessions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                {form.rol === UserRole.VENDEDOR && (
                  <select
                    className="h-10 rounded-md border px-3 text-[1.4rem] md:col-span-2"
                    value={form.sucursalId}
                    onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}
                    required
                  >
                    <option value="">Selecciona sucursal</option>
                    {sucursalesFiltradas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre ?? s.id}
                      </option>
                    ))}
                  </select>
                )}
                <Button type="submit" disabled={submitting} className="md:col-span-2">
                  Crear usuario
                </Button>
              </form>
              {actionError && (
                <p className="mt-3 text-[1.4rem] text-destructive">{actionError}</p>
              )}
            </CardContent>
          </Card>

          <div className="mb-4 flex gap-4">
            <select
              className="h-10 rounded-md border px-3 text-[1.4rem]"
              value={concesionFilter}
              onChange={(e) => setConcesionFilter(e.target.value)}
            >
              <option value="">Todas las concesiones</option>
              {concessions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => refetch()}>
              Actualizar
            </Button>
          </div>

          {loading && <p>Cargando…</p>}
          {error && <p className="text-destructive">{error}</p>}

          <div className="grid gap-4">
            {users.map((u) => (
              <Card key={u.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="text-[1.6rem] font-medium">{u.nombre}</p>
                    <p className="text-[1.4rem] text-muted-foreground">
                      {u.email} · {u.rol} · {u.concesionId ?? "sin concesión"}
                    </p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>
                    Desactivar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}

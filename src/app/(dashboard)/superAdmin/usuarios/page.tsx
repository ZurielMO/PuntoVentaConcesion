"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Power,
  PowerOff,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireRole } from "@/components/auth/require-role";
import {
  useUsers,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "@/hooks/use-users";
import { useConcessions } from "@/hooks/use-concessions";
import { useConcesionFilterParam } from "@/hooks/use-concesion-filter-param";
import { useActiveConcesionOptional } from "@/hooks/use-active-concesion";
import { useSucursales } from "@/hooks/use-sucursales";
import { useEquipoVendedores } from "@/hooks/use-equipo";
import { normalizeRole } from "@/lib/permissions";
import { UserRole, type User } from "@/lib/types";
import "@/styles/wizard-alta.css";

type FormState = {
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
  concesionId: string;
  sucursalId: string;
  activo: boolean;
};

type RoleFilter = "todos" | "admin" | "vendedor";

const emptyForm = (concesionId = ""): FormState => ({
  nombre: "",
  email: "",
  password: "",
  rol: UserRole.VENDEDOR,
  concesionId,
  sucursalId: "",
  activo: true,
});

const userDocId = (u: User) => u.id || u.uid || "";

export default function UsuariosPage() {
  const activeCtx = useActiveConcesionOptional();
  const [concesionFilter, setConcesionFilter] = useConcesionFilterParam();
  const { users, loading, error, refetch, createUser, updateUser, deleteUser } =
    useUsers(concesionFilter || undefined, {
      enabled: Boolean(concesionFilter),
    });
  const { concessions } = useConcessions();
  const { sucursales } = useSucursales();
  const { refetch: refetchEquipo } = useEquipoVendedores(
    concesionFilter || undefined,
    { enabled: Boolean(concesionFilter) },
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");

  const isVendedorRol = form.rol === UserRole.VENDEDOR;

  const concesionNombre = (id?: string | null) =>
    concessions.find((c) => c.id === id)?.nombre ?? id ?? "—";

  const sucursalNombre = (id?: string | null) =>
    sucursales.find((s) => s.id === id)?.nombre ?? id ?? "—";

  const cajaNombre = (sucursalId?: string | null, cajaId?: string | null) => {
    if (!sucursalId || !cajaId) return null;
    const suc = sucursales.find((s) => s.id === sucursalId);
    return suc?.cajas?.find((c) => c.id === cajaId)?.nombre ?? cajaId;
  };

  /** Solo usuarios de la concesión seleccionada (doble filtro por seguridad). */
  const usersFiltrados = useMemo(() => {
    if (!concesionFilter) return [];
    return users.filter((u) => u.concesionId === concesionFilter);
  }, [users, concesionFilter]);

  const usersVisibles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return usersFiltrados
      .filter((u) => {
        const rol = normalizeRole(String(u.rol));
        if (roleFilter === "admin" && rol !== UserRole.ADMIN) return false;
        if (roleFilter === "vendedor" && rol !== UserRole.VENDEDOR) return false;
        if (!q) return true;
        const nombre = (u.nombre ?? "").toLowerCase();
        const email = (u.email ?? "").toLowerCase();
        return nombre.includes(q) || email.includes(q);
      })
      .sort((a, b) => {
        const rolA = normalizeRole(String(a.rol));
        const rolB = normalizeRole(String(b.rol));
        const adminA = rolA === UserRole.ADMIN ? 0 : 1;
        const adminB = rolB === UserRole.ADMIN ? 0 : 1;
        if (adminA !== adminB) return adminA - adminB;
        return (a.nombre ?? "").localeCompare(b.nombre ?? "", "es", {
          sensitivity: "base",
        });
      });
  }, [usersFiltrados, search, roleFilter]);

  const sucursalesFiltradas = useMemo(
    () =>
      sucursales.filter(
        (s) =>
          s.activo !== false &&
          Boolean(concesionFilter) &&
          s.concesion_id === concesionFilter,
      ),
    [sucursales, concesionFilter],
  );

  const setConcesion = (value: string) => {
    setConcesionFilter(value);
    activeCtx?.setActiveConcesionId(value || null);
    setSearch("");
    setRoleFilter("todos");
  };

  const openCreate = () => {
    if (!concesionFilter) {
      toast.error("Selecciona una concesión primero");
      return;
    }
    setEditing(null);
    setForm(emptyForm(concesionFilter));
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    const rol =
      normalizeRole(String(u.rol)) ??
      (u.rol as UserRole) ??
      UserRole.VENDEDOR;
    setEditing(u);
    setForm({
      nombre: u.nombre ?? "",
      email: u.email ?? "",
      password: "",
      rol,
      concesionId: u.concesionId ?? concesionFilter,
      sucursalId: u.sucursalId ?? "",
      activo: u.activo !== false,
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm(concesionFilter));
    setShowPassword(false);
  };

  const handleToggleActivo = async (u: User) => {
    const id = userDocId(u);
    if (!id) {
      toast.error("Usuario sin identificador");
      return;
    }
    try {
      if (u.activo === false) {
        await updateUser(id, { activo: true });
        toast.success("Usuario reactivado");
      } else {
        await deleteUser(id);
        toast.success("Usuario desactivado");
      }
      await refetchEquipo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const concesionId = concesionFilter || form.concesionId;
    if (!concesionId) {
      toast.error("Selecciona una concesión primero");
      return;
    }
    // VENDEDOR: backend exige sucursalId en alta y en edición.
    if (isVendedorRol && !form.sucursalId) {
      toast.error("Los vendedores requieren una sucursal");
      return;
    }
    const password = form.password.trim();
    if (password && password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!editing && !password) {
      toast.error("La contraseña es obligatoria");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const userId = userDocId(editing);
        if (!userId) throw new Error("Usuario sin identificador");
        const payload: UpdateUserPayload = {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          rol: form.rol,
          concesionId,
        };
        if (password) {
          payload.password = password;
        }
        if (isVendedorRol) {
          payload.sucursalId = form.sucursalId;
          // Liberar caja de la sucursal anterior al cambiar de sucursal.
          if (form.sucursalId !== (editing.sucursalId ?? "")) {
            payload.cajaId = null;
          }
        } else {
          payload.sucursalId = null;
          payload.cajaId = null;
        }
        await updateUser(userId, payload);
        toast.success(
          password
            ? "Usuario y contraseña actualizados"
            : "Usuario actualizado",
        );
      } else {
        const payload: CreateUserPayload = {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password,
          rol: form.rol,
          concesionId,
          activo: true,
          ...(isVendedorRol ? { sucursalId: form.sucursalId } : {}),
        };
        await createUser(payload);
        toast.success("Usuario creado");
      }
      closeDialog();
      await refetchEquipo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const rolLabel = (u: User) => {
    const rol = normalizeRole(String(u.rol));
    if (rol === UserRole.ADMIN) return "Administrador";
    if (rol === UserRole.VENDEDOR) return "Vendedor";
    return String(u.rol ?? "—");
  };

  const ubicacionLabel = (u: User) => {
    const rol = normalizeRole(String(u.rol));
    if (rol === UserRole.ADMIN) return "Toda la concesión";
    const caja = cajaNombre(u.sucursalId, u.cajaId);
    const suc = sucursalNombre(u.sucursalId);
    if (!u.sucursalId) return "Sin sucursal";
    return caja ? `${suc} · ${caja}` : `${suc} · Sin caja`;
  };

  return (
    <RequireRole superAdminOnly>
      <div className="wizard-alta wizard-alta__shell wizard-alta__shell--fill">
        <header className="wizard-alta__hero">
          <div className="wizard-alta__hero-inner">
            <div>
              <h1>Usuarios</h1>
              <p>Administradores y vendedores de cada concesión.</p>
            </div>
            <div className="wizard-alta__hero-actions">
              <button
                type="button"
                className="wizard-alta__exit"
                onClick={() => {
                  void refetch();
                  void refetchEquipo();
                }}
              >
                <RefreshCw className="size-4" />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-[8px] border border-destructive/20 bg-red-50 p-4 text-[1.4rem] text-destructive">
            {error}
          </div>
        )}

        <div className="wizard-alta__layout">
          <aside className="wizard-alta__sidebar">
            <div className="wizard-alta__sidebar-filter">
              <Field label="1) Elige concesión" htmlFor="concesionFilter">
                <NativeSelect
                  id="concesionFilter"
                  value={concesionFilter}
                  onChange={(e) => setConcesion(e.target.value)}
                >
                  <option value="">Selecciona una concesión</option>
                  {concessions
                    .filter((c) => c.activo !== false)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                </NativeSelect>
              </Field>
            </div>

            {!concesionFilter ? (
              <p className="wizard-alta__empty">
                Primero elige la concesión. Después podrás crear o buscar sus
                usuarios.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className="wizard-alta__btn wizard-alta__btn--primary w-full"
                  onClick={openCreate}
                >
                  <Plus className="size-4" />
                  Nuevo usuario
                </button>
              </>
            )}
          </aside>

          <div className="wizard-alta__panel">
            {!concesionFilter ? (
              <div className="wizard-alta__panel-body">
                <p className="wizard-alta__hint">
                  1) Elige la concesión a la izquierda → 2) Pulsa{" "}
                  <strong>Nuevo usuario</strong> → 3) Asigna cajas en Sucursales
                  y cajas.
                </p>
                <p className="wizard-alta__empty">
                  Selecciona una concesión para ver la lista de usuarios.
                </p>
              </div>
            ) : (
              <>
                <div className="wizard-alta__panel-head">
                  <h2 className="wizard-alta__panel-title">
                    {concesionNombre(concesionFilter)}
                  </h2>
                  <p className="wizard-alta__panel-sub">
                    {loading
                      ? "Cargando…"
                      : `${usersFiltrados.length} usuario(s) · busca por nombre o correo`}
                  </p>
                </div>

                <div className="wizard-alta__panel-body">
                  <p className="wizard-alta__hint">
                    Crea el equipo aquí. Los vendedores necesitan sucursal; la
                    caja se asigna después en Sucursales y cajas.
                  </p>

                  {loading ? (
                    <p className="wizard-alta__empty">Cargando usuarios…</p>
                  ) : usersFiltrados.length === 0 ? (
                    <div>
                      <p className="wizard-alta__empty">
                        Aún no hay usuarios. Pulsa{" "}
                        <strong>Nuevo usuario</strong> (o el botón de abajo)
                        para crear el primero.
                      </p>
                      <button
                        type="button"
                        className="wizard-alta__btn wizard-alta__btn--primary mt-3"
                        onClick={openCreate}
                      >
                        <Plus className="size-4" />
                        Crear usuario
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="wizard-alta__toolbar">
                        <div className="wizard-alta__toolbar-search">
                          <Search className="wizard-alta__toolbar-search-icon size-4" />
                          <Input
                            id="userSearch"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre o correo…"
                            aria-label="Buscar usuarios"
                          />
                        </div>
                        <div className="wizard-alta__toolbar-filter">
                          <Field label="Rol" htmlFor="roleFilter">
                            <NativeSelect
                              id="roleFilter"
                              value={roleFilter}
                              onChange={(e) =>
                                setRoleFilter(e.target.value as RoleFilter)
                              }
                            >
                              <option value="todos">Todos</option>
                              <option value="admin">Administrador</option>
                              <option value="vendedor">Vendedor</option>
                            </NativeSelect>
                          </Field>
                        </div>
                      </div>

                      {usersVisibles.length === 0 ? (
                        <p className="wizard-alta__empty">
                          Ningún usuario coincide con la búsqueda o el filtro.
                          Prueba otro nombre, correo o rol.
                        </p>
                      ) : (
                        <div
                          className={`wizard-alta__table-wrap${
                            usersVisibles.length > 8
                              ? " wizard-alta__table-wrap--scroll"
                              : ""
                          }`}
                        >
                          <table className="wizard-alta__table">
                            <thead>
                              <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Rol</th>
                                <th>Ubicación</th>
                                <th>Estado</th>
                                <th className="wizard-alta__table-actions-col">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {usersVisibles.map((u) => {
                                const activo = u.activo !== false;
                                return (
                                  <tr
                                    key={userDocId(u) || u.email}
                                    className={
                                      activo
                                        ? undefined
                                        : "wizard-alta__table-row--off"
                                    }
                                  >
                                    <td>
                                      <span className="wizard-alta__table-name">
                                        {u.nombre}
                                      </span>
                                    </td>
                                    <td className="wizard-alta__table-muted">
                                      {u.email}
                                    </td>
                                    <td>{rolLabel(u)}</td>
                                    <td className="wizard-alta__table-muted">
                                      {ubicacionLabel(u)}
                                    </td>
                                    <td>
                                      <span
                                        className={`wizard-alta__status-pill ${
                                          activo
                                            ? "wizard-alta__status-pill--on"
                                            : "wizard-alta__status-pill--off"
                                        }`}
                                      >
                                        {activo ? "Activo" : "Desactivado"}
                                      </span>
                                    </td>
                                    <td className="wizard-alta__table-actions-col">
                                      <div className="wizard-alta__table-actions">
                                        <button
                                          type="button"
                                          className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                          onClick={() => openEdit(u)}
                                        >
                                          <Pencil className="size-3.5" />
                                          Editar
                                        </button>
                                        {activo ? (
                                          <button
                                            type="button"
                                            className="wizard-alta__btn wizard-alta__btn--danger wizard-alta__btn--sm"
                                            onClick={() =>
                                              void handleToggleActivo(u)
                                            }
                                          >
                                            <PowerOff className="size-3.5" />
                                            Desactivar
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            className="wizard-alta__btn wizard-alta__btn--outline wizard-alta__btn--sm"
                                            onClick={() =>
                                              void handleToggleActivo(u)
                                            }
                                          >
                                            <Power className="size-3.5" />
                                            Reactivar
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="wizard-alta wizard-alta__dialog wizard-alta__dialog--wide !flex !max-w-[64rem] !flex-col !gap-0 !p-0">
          <div className="wizard-alta__dialog-head">
            <DialogHeader className="text-left">
              <DialogTitle className="wizard-alta__dialog-title">
                {editing ? "Editar usuario" : "Nuevo usuario"}
              </DialogTitle>
              <DialogDescription className="wizard-alta__dialog-sub">
                {editing
                  ? `Actualiza los datos de ${concesionNombre(concesionFilter)}.`
                  : `Alta para ${concesionNombre(concesionFilter)}. Los vendedores se asignan a caja después.`}
              </DialogDescription>
            </DialogHeader>
          </div>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="wizard-alta__dialog-body"
          >
            <div className="wizard-alta__dialog-fields wizard-alta__dialog-fields--grid">
              <Field label="Nombre" htmlFor="nombre">
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  required
                  autoComplete="name"
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  required
                  autoComplete="email"
                />
              </Field>
              <Field
                label={editing ? "Contraseña (opcional)" : "Contraseña"}
                htmlFor="password"
                hint={
                  editing
                    ? "Dejar vacío para no cambiar · mínimo 6 caracteres"
                    : "Mínimo 6 caracteres"
                }
              >
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required={!editing}
                    minLength={6}
                    autoComplete="new-password"
                    placeholder={editing ? "••••••••" : undefined}
                    className="!pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--wz-muted)] transition-colors hover:text-[var(--wz-onyx)]"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
              </Field>
              <Field
                label="Rol"
                htmlFor="rol"
                className={
                  isVendedorRol ? undefined : "wizard-alta__field-span"
                }
              >
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
                  <option value={UserRole.ADMIN}>Administrador</option>
                  <option value={UserRole.VENDEDOR}>Vendedor</option>
                </NativeSelect>
              </Field>
              {isVendedorRol && (
                <Field
                  label="Sucursal"
                  htmlFor="sucursal"
                  className="wizard-alta__field-span"
                  hint="La caja se asigna después en Sucursales y cajas"
                >
                  <NativeSelect
                    id="sucursal"
                    value={form.sucursalId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sucursalId: e.target.value,
                      })
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
            </div>
            <div className="wizard-alta__footer">
              <button
                type="button"
                className="wizard-alta__btn wizard-alta__btn--secondary"
                onClick={closeDialog}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="wizard-alta__btn wizard-alta__btn--primary"
                disabled={submitting}
              >
                {submitting
                  ? "Guardando…"
                  : editing
                    ? "Guardar cambios"
                    : "Crear usuario"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}

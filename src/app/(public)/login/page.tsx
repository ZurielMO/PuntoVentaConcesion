"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, LayoutDashboard, Boxes, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useAuth } from "@/hooks/use-auth";
import { getDefaultRouteForRole } from "@/lib/permissions";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

const PANEL_FEATURES = [
  { icon: LayoutDashboard, label: "Panel unificado", detail: "KPIs y operación en un solo lugar" },
  { icon: Store, label: "Sucursales", detail: "Puntos de venta por zona del estadio" },
  { icon: Boxes, label: "Inventario", detail: "Existencias por jornada y sucursal" },
];

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPassword, user, posUser, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && user && posUser) {
      router.replace(getDefaultRouteForRole(posUser));
    }
  }, [authLoading, user, posUser, router]);

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithPassword(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      setSubmitting(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--dashboard-bg)]">
        <p className="text-[1.6rem] text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      {/* Brand / context panel */}
      <aside className="dashboard-banner relative hidden flex-col justify-between overflow-hidden p-12 lg:flex xl:p-16">
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-[2rem] font-semibold text-white">PuntoVenta</span>
          <span className="text-[1.3rem] text-white/60">Concesiones Estadio</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="!text-[3.4rem] !leading-tight !text-white xl:!text-[4rem]">
            Panel de gestión del estadio
          </h1>
          <p className="mt-4 text-[1.6rem] leading-relaxed text-white/85">
            SuperAdmin administra la plataforma. Admin opera su concesión con
            inventario, sucursales y productos desde un panel unificado.
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {PANEL_FEATURES.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-5 text-white" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-[1.5rem] font-medium text-white">{label}</p>
                  <p className="text-[1.3rem] text-white/70">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[1.3rem] text-white/55">
          © {new Date().getFullYear()} PuntoVenta — Concesiones Estadio
        </p>
      </aside>

      {/* Login form */}
      <main className="flex items-center justify-center bg-white px-[var(--outer-gutter)] py-[var(--space-6)] lg:px-[var(--space-7)]">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="text-[2rem] font-semibold text-starbucks-green">PuntoVenta</span>
            <span className="text-[1.3rem] text-muted-foreground">Concesiones Estadio</span>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-green-muted px-3 py-1 text-[1.2rem] font-medium text-green-accent ring-1 ring-green-soft">
            <ShieldCheck className="size-4" strokeWidth={2} />
            Acceso interno
          </span>

          <h2 className="mt-4 text-[2.6rem] font-semibold text-green-dark">Iniciar sesión</h2>
          <p className="mt-2 text-[1.4rem] text-muted-foreground">
            Accede con tu cuenta del punto de venta.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
            <Field label="Correo" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@concesiones.mx"
                {...register("email")}
              />
            </Field>

            <Field label="Contraseña" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-[8px] border border-destructive/20 bg-red-50 p-3 text-[1.4rem] text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting ? "Entrando…" : "Entrar al panel"}
            </Button>
          </form>

          <p className="mt-8 text-[1.3rem] text-muted-foreground">
            ¿Problemas para acceder? Contacta al administrador de tu concesión.
          </p>
        </div>
      </main>
    </div>
  );
}

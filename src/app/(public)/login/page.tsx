"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
      <div className="flex min-h-[calc(100vh-180px)] items-center justify-center">
        <p className="text-[1.6rem] text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-180px)] lg:grid-cols-2">
      <div className="dashboard-banner relative hidden flex-col justify-center overflow-hidden p-10 lg:flex lg:p-14">
        <div className="relative z-10 max-w-md">
          <p className="text-[1.3rem] font-medium uppercase tracking-wider text-white/70">
            PuntoVenta Concesiones
          </p>
          <h1 className="mt-4 !text-[3.2rem] !text-white lg:!text-[4rem]">
            Panel de gestión del estadio
          </h1>
          <p className="mt-4 text-[1.6rem] leading-relaxed text-white/85">
            SuperAdmin administra la plataforma. Admin opera su concesión desde un
            panel unificado con inventario, sucursales y productos.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-ceramic px-[var(--outer-gutter)] py-[var(--space-6)]">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-[2rem] font-semibold text-starbucks-green">PuntoVenta</p>
            <p className="mt-2 text-[1.4rem] text-muted-foreground">
              Inicia sesión en tu panel administrativo
            </p>
          </div>

          <h2 className="mb-2 text-[2.4rem] font-semibold">Iniciar sesión</h2>
          <p className="mb-6 text-[1.4rem] text-muted-foreground">
            Accede con tu cuenta del punto de venta
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field label="Correo" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </Field>

            <Field
              label="Contraseña"
              htmlFor="password"
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
            </Field>

            {error && (
              <p className="rounded-[8px] border border-destructive/20 bg-red-50 p-3 text-[1.4rem] text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Entrando…" : "Entrar al panel"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[1.4rem] text-muted-foreground">
            <Link href="/" className="text-green-accent hover:underline">
              Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

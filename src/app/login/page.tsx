"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getDefaultRouteForRole } from "@/lib/permissions";
import { isFirebaseConfigured } from "@/lib/firebase/client";

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

  useEffect(() => {
    if (posUser && user && !authLoading) {
      router.replace(getDefaultRouteForRole(posUser));
    }
  }, [posUser, user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <p className="text-[1.6rem] text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-ceramic px-[var(--outer-gutter)] py-[var(--space-5)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Accede con tu cuenta del punto de venta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isFirebaseConfigured() && (
            <p className="mb-4 rounded-[var(--card-border-radius)] bg-yellow-50 p-3 text-[1.4rem] text-yellow-800">
              Configura las variables NEXT_PUBLIC_AUTH_FIREBASE_* en .env.local
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[1.3rem] text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-[1.3rem] text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-sm bg-red-50 p-3 text-[1.4rem] text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[1.4rem] text-muted-foreground">
            <Link href="/" className="text-green-accent hover:underline">
              Volver al inicio
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

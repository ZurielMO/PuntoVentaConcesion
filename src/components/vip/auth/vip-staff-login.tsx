"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { ShieldCheck } from "lucide-react";

export type VipStaffLoginValues = {
  email: string;
  password: string;
};

interface VipStaffLoginProps {
  register: UseFormRegister<VipStaffLoginValues>;
  errors: FieldErrors<VipStaffLoginValues>;
  error: string | null;
  submitting: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function isVipStaffLoginNext(next: string | null): boolean {
  if (!next) return false;
  return next.startsWith("/servicio-palcos") || next.startsWith("/vip/");
}

export function VipStaffLogin({
  register,
  errors,
  error,
  submitting,
  onSubmit,
}: VipStaffLoginProps) {
  return (
    <div
      data-vip-root="true"
      className="flex min-h-[100dvh] flex-col bg-[#F5F7F6] text-[#171A19]"
    >
      <header className="shrink-0 bg-[#102D24] px-4 py-3.5 text-white">
        <div className="mx-auto flex max-w-md items-center gap-2.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#00FF85]/40 bg-[#187B56] text-xl">
            🦁
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold leading-tight text-white">
              Central Palcos
            </h1>
            <p className="truncate text-sm font-semibold text-[#ACB5C9]">
              Acceso del personal
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#187B56]/10 px-3 py-1 text-xs font-bold text-[#187B56] ring-1 ring-[#187B56]/20">
          <ShieldCheck className="size-3.5" strokeWidth={2.2} />
          Acceso interno
        </span>

        <h2 className="mt-3 text-2xl font-extrabold leading-tight text-[#102D24]">
          Iniciar sesión
        </h2>
        <p className="mt-1 text-sm leading-snug text-[#66706B]">
          Entra con tu cuenta del estadio para recibir pedidos.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-[#171A19]">Correo</span>
            <input
              id="vip-login-email"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@concesiones.mx"
              className="min-h-12 w-full rounded-xl border border-[#E2E8E5] bg-white px-3.5 text-base text-[#171A19] outline-none placeholder:text-[#8A9992] focus:border-[#187B56] focus:ring-2 focus:ring-[#187B56]/20"
              {...register("email")}
            />
            {errors.email?.message ? (
              <span role="alert" className="text-sm font-semibold text-[#C43D3D]">
                {errors.email.message}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-[#171A19]">Contraseña</span>
            <input
              id="vip-login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="min-h-12 w-full rounded-xl border border-[#E2E8E5] bg-white px-3.5 text-base text-[#171A19] outline-none placeholder:text-[#8A9992] focus:border-[#187B56] focus:ring-2 focus:ring-[#187B56]/20"
              {...register("password")}
            />
            {errors.password?.message ? (
              <span role="alert" className="text-sm font-semibold text-[#C43D3D]">
                {errors.password.message}
              </span>
            ) : null}
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-[#C43D3D]/20 bg-[#C43D3D]/8 px-3 py-2.5 text-sm font-semibold text-[#C43D3D]"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 min-h-12 w-full rounded-xl bg-[#187B56] text-base font-extrabold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Entrando…" : "Entrar a Central"}
          </button>
        </form>

        <p className="mt-6 text-sm leading-snug text-[#66706B]">
          ¿Problemas para acceder? Contacta al administrador de tu concesión.
        </p>
      </div>
    </div>
  );
}

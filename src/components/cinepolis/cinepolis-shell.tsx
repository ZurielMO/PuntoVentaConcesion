"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function CinepolisShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { user, posUser, logout } = useAuth();
  const email = posUser?.email ?? user?.email ?? "";

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="cinepolis-theme min-h-screen bg-[#F5F7FA] text-[#172033]">
      <header className="sticky top-0 z-30 bg-[#003DA5] text-white shadow-[0_10px_28px_rgba(0,61,165,0.22)]">
        <div className="h-2 bg-[#FFC72C]" />
        <div className="flex min-h-[7.2rem] w-full items-center justify-between gap-6 px-6 py-4 sm:px-10 lg:px-16">
          <div className="flex min-w-0 items-baseline gap-4">
            <span className="text-[3.2rem] font-bold leading-none tracking-tight md:text-[3.6rem]">
              Cinépolis
            </span>
            <span className="hidden truncate text-[1.7rem] font-medium text-white/70 sm:inline">
              Puntos Club León
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <span className="hidden max-w-[32rem] truncate text-[1.5rem] text-white/80 lg:inline">
              {email}
            </span>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex h-12 items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-5 text-[1.5rem] font-semibold text-white transition hover:bg-white/18"
            >
              <LogOut className="size-5" />
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-7 px-6 py-8 sm:px-10 md:py-10 lg:px-16">
        {children}
      </main>
    </div>
  );
}

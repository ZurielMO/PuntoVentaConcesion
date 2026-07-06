"use client";

import { AuthProvider } from "@/hooks/use-auth";
import { ActiveConcesionProvider } from "@/hooks/use-active-concesion";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ActiveConcesionProvider>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            className: "text-[1.4rem]",
          }}
        />
      </ActiveConcesionProvider>
    </AuthProvider>
  );
}

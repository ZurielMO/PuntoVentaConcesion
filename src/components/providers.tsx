"use client";

import { AuthProvider } from "@/hooks/use-auth";
import { ActiveConcesionProvider } from "@/hooks/use-active-concesion";
import { NavigationLockProvider } from "@/hooks/use-navigation-lock";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ActiveConcesionProvider>
        <NavigationLockProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              className: "text-[1.4rem]",
            }}
          />
        </NavigationLockProvider>
      </ActiveConcesionProvider>
    </AuthProvider>
  );
}

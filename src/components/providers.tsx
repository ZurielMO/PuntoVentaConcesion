"use client";

import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          className: "text-[1.4rem]",
        }}
      />
    </AuthProvider>
  );
}

import type { Metadata } from "next";
import { VipLegalShell } from "@/components/vip/legal/legal-shell";

export const metadata: Metadata = {
  title: "Política de cookies · Servicio Palcos VIP",
  description: "Almacenamiento esencial del carrito de Servicio Palcos. Sin cookies de publicidad ni analítica.",
};

export default function CookiesPage() {
  return <VipLegalShell document="cookies" />;
}

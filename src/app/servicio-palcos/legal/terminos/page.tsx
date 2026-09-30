import type { Metadata } from "next";
import { VipLegalShell } from "@/components/vip/legal/legal-shell";

export const metadata: Metadata = {
  title: "Términos y condiciones · Servicio Palcos VIP",
  description: "Términos de compra de alimentos y bebidas con entrega en palco en el Estadio León.",
};

export default function TerminosPage() {
  return <VipLegalShell document="terminos" />;
}

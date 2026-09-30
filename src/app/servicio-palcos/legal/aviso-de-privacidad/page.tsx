import type { Metadata } from "next";
import { VipLegalShell } from "@/components/vip/legal/legal-shell";

export const metadata: Metadata = {
  title: "Aviso de privacidad · Servicio Palcos VIP",
  description: "Aviso de privacidad integral del servicio de alimentos y bebidas a palcos del Estadio León.",
};

export default function AvisoDePrivacidadPage() {
  return <VipLegalShell document="aviso-de-privacidad" />;
}

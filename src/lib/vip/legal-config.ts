/**
 * Identidad del responsable de Servicio Palcos.
 * El aviso de privacidad y los términos leen solo estos datos.
 * La versión debe coincidir con VIP_LEGAL_DOCUMENT_VERSION del checkout en el backend.
 */
export const VIP_LEGAL_DOCUMENT_VERSION = "2026-09-30";

export const VIP_LEGAL_CONTROLLER = {
  legalName: "Fuerza Deportiva del Club León",
  address: "Blvd. Adolfo López Mateos, La Martinica 1810",
  phone: "477 101 7000",
  email: "recepcion@clubleon.mx",
};

export const VIP_LEGAL_PATHS = {
  terms: "/servicio-palcos/legal/terminos",
  privacy: "/servicio-palcos/legal/aviso-de-privacidad",
  cookies: "/servicio-palcos/legal/cookies",
} as const;

export type VipLegalDocumentId = "terminos" | "aviso-de-privacidad" | "cookies";

const PENDING = "Pendiente de configurar";

export function legalIdentityValue(value: string): string {
  const trimmed = value.trim();
  return trimmed || PENDING;
}

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function vipLegalVersionLabel(version = VIP_LEGAL_DOCUMENT_VERSION): string {
  const [year, month, day] = version.split("-");
  const monthName = MONTHS[Number(month) - 1] || month;
  return `${Number(day)} de ${monthName} de ${year}`;
}

"use client";

import type { ReactNode } from "react";
import { VipTopBar } from "@/components/vip/ui/top-bar";
import { VipLegalLinks } from "@/components/vip/legal/legal-links";
import {
  VipCookiePolicy,
  VipPrivacyNotice,
  VipTermsDocument,
} from "@/components/vip/legal/legal-documents";
import type { VipLegalDocumentId } from "@/lib/vip/legal-config";
import { useRouter } from "next/navigation";

const DOCUMENTS: Record<VipLegalDocumentId, { title: string; eyebrow: string; body: ReactNode }> = {
  terminos: {
    title: "Términos y condiciones",
    eyebrow: "Compra en palco",
    body: <VipTermsDocument />,
  },
  "aviso-de-privacidad": {
    title: "Aviso de privacidad",
    eyebrow: "Datos personales",
    body: <VipPrivacyNotice />,
  },
  cookies: {
    title: "Política de cookies",
    eyebrow: "Almacenamiento esencial",
    body: <VipCookiePolicy />,
  },
};

export function VipLegalShell({ document }: { document: VipLegalDocumentId }) {
  const router = useRouter();
  const current = DOCUMENTS[document];

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAF9] pb-28 text-[#111827] md:pb-16">
      <VipTopBar
        variant="linear"
        title={current.title}
        subtitle="Servicio Palcos VIP · Club León"
        onBack={() => router.push("/servicio-palcos/inicio")}
      />
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#A67C2E]">
            {current.eyebrow}
          </p>
          <h1 className="font-[family-name:var(--font-montserrat)] text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
            {current.title}
          </h1>
        </header>
        {current.body}
        <VipLegalLinks className="border-t border-[#E5EBE8] pt-5" />
      </article>
    </div>
  );
}

export function VipLegalDocumentBody({ document }: { document: VipLegalDocumentId }) {
  return DOCUMENTS[document].body;
}

export function vipLegalDocumentTitle(document: VipLegalDocumentId): string {
  return DOCUMENTS[document].title;
}

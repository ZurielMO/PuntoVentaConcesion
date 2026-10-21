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
    <div className="flex min-h-screen flex-col pb-28 md:pb-16">
      <VipTopBar
        variant="linear"
        title="Información legal"
        subtitle="Servicio Palcos · Club León"
        titleTag="p"
        onBack={() => router.push("/servicio-palcos/inicio")}
      />
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <header>
          <h1 className="font-palco-display text-[1.875rem] font-extrabold leading-tight tracking-[-0.02em] text-palco-ink sm:text-4xl">
            {current.title}
          </h1>
          <p className="mt-1.5 text-[15px] text-palco-ink-3">{current.eyebrow}</p>
        </header>
        <div className="rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-5 sm:p-8">{current.body}</div>
        <VipLegalLinks className="pt-2" />
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

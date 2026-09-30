"use client";

import { useState, type ReactNode } from "react";
import { VipModal } from "@/components/vip/ui/modal";
import { VipLegalDocumentBody, vipLegalDocumentTitle } from "@/components/vip/legal/legal-shell";
import {
  legalIdentityValue,
  VIP_LEGAL_CONTROLLER,
  type VipLegalDocumentId,
} from "@/lib/vip/legal-config";

function LegalTextButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-semibold text-[#0D4A34] underline decoration-[#C5A059]/70 underline-offset-2 hover:text-[#062E20] cursor-pointer"
    >
      {children}
    </button>
  );
}

export function VipLegalConsent({
  accepted,
  onChange,
  compact = false,
}: {
  accepted: boolean;
  onChange: (next: boolean) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState<VipLegalDocumentId | null>(null);
  const name = legalIdentityValue(VIP_LEGAL_CONTROLLER.legalName);
  const checkboxId = compact ? "vip-legal-accept-mobile" : "vip-legal-accept";

  return (
    <>
      <div className={`flex items-start gap-3 ${compact ? "" : "rounded-2xl border border-[#E5EBE8] bg-white px-4 py-3.5"}`}>
        <input
          id={checkboxId}
          type="checkbox"
          checked={accepted}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#C5A059] accent-[#0D4A34] cursor-pointer"
        />
        <div className="min-w-0 flex flex-col gap-1.5">
          <p className={`leading-snug text-[#374151] ${compact ? "text-xs" : "text-sm"}`}>
            <label htmlFor={checkboxId} className="cursor-pointer">
              Acepto los{" "}
            </label>
            <LegalTextButton onClick={() => setOpen("terminos")}>Términos y condiciones</LegalTextButton>
            <label htmlFor={checkboxId} className="cursor-pointer">
              , el{" "}
            </label>
            <LegalTextButton onClick={() => setOpen("aviso-de-privacidad")}>Aviso de privacidad</LegalTextButton>
            <label htmlFor={checkboxId} className="cursor-pointer">
              {" "}
              y la{" "}
            </label>
            <LegalTextButton onClick={() => setOpen("cookies")}>Política de cookies</LegalTextButton>
            <label htmlFor={checkboxId} className="cursor-pointer">
              .
            </label>
          </p>
          <p className={`leading-snug text-[#6B7280] ${compact ? "text-[11px]" : "text-xs"}`}>
            {name} trata tu nombre, correo, teléfono y la ubicación del palco para entregar el
            pedido, cobrarlo y enviarte la guía. No los usamos para publicidad.{" "}
            <LegalTextButton onClick={() => setOpen("aviso-de-privacidad")}>
              Consulta el aviso integral
            </LegalTextButton>
            .
          </p>
        </div>
      </div>

      <VipModal
        isOpen={open !== null}
        onClose={() => setOpen(null)}
        title={open ? vipLegalDocumentTitle(open) : undefined}
        maxWidth="xl"
      >
        {open && <VipLegalDocumentBody document={open} />}
      </VipModal>
    </>
  );
}

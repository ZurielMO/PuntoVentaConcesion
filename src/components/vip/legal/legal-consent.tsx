"use client";

import { useState, type ReactNode } from "react";
import { VipModal } from "@/components/vip/ui/modal";
import { VipLegalDocumentBody, vipLegalDocumentTitle } from "@/components/vip/legal/legal-shell";
import {
  legalIdentityValue,
  VIP_LEGAL_CONTROLLER,
  type VipLegalDocumentId,
} from "@/lib/vip/legal-config";

function LegalTextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-semibold text-palco-700 underline decoration-palco-700/40 underline-offset-[3px] hover:decoration-palco-700"
    >
      {children}
    </button>
  );
}

export function VipLegalConsent({
  accepted,
  onChange,
  compact = false,
  error,
  id = "vip-legal-accept",
}: {
  accepted: boolean;
  onChange: (next: boolean) => void;
  compact?: boolean;
  /** Se intentó pagar sin aceptar. */
  error?: string;
  id?: string;
}) {
  const [open, setOpen] = useState<VipLegalDocumentId | null>(null);
  const name = legalIdentityValue(VIP_LEGAL_CONTROLLER.legalName);
  const checkboxId = compact ? `${id}-mobile` : id;

  return (
    <>
      <div
        className={`flex items-start gap-3 rounded-[var(--radius-palco-md)] px-4 py-3.5 ${
          error ? "bg-palco-danger-50 ring-1 ring-palco-danger/40" : "bg-palco-ground"
        }`}
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={accepted}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          data-field="legal"
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-palco-700)]"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-sm leading-snug text-palco-ink">
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
          {!compact && (
            <p className="text-[13px] leading-snug text-palco-ink-3">
              {name} trata tu nombre, correo, teléfono y la ubicación del palco para entregar el pedido, cobrarlo y
              enviarte la guía. No los usamos para publicidad.
            </p>
          )}
          {error && (
            <p id={`${checkboxId}-error`} className="text-sm font-medium text-palco-danger">
              {error}
            </p>
          )}
        </div>
      </div>

      <VipModal isOpen={open !== null} onClose={() => setOpen(null)} title={open ? vipLegalDocumentTitle(open) : undefined} maxWidth="xl">
        {open && <VipLegalDocumentBody document={open} />}
      </VipModal>
    </>
  );
}

"use client";

import React from "react";

/** Bloque del checkout: un título que dice qué se decide aquí y su contenido. */
export function VipCheckoutSection({
  id,
  title,
  description,
  action,
  children,
  className = "",
}: {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      id={id}
      className={`scroll-mt-20 rounded-[var(--radius-palco-lg)] border border-palco-line bg-palco-surface p-4 sm:p-6 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-palco-display text-lg font-bold tracking-[-0.01em] text-palco-ink">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-palco-ink-3">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const fieldBase =
  "h-13 w-full rounded-[var(--radius-palco-md)] border bg-palco-surface px-4 text-base text-palco-ink outline-none transition-[border-color,box-shadow] focus:border-palco-700 focus:shadow-[0_0_0_3px_var(--color-palco-100)]";

/** Campo de texto con etiqueta, ayuda y error accesibles. */
export function VipTextField({
  id,
  label,
  hint,
  error,
  className = "",
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string; error?: string }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-palco-ink-2">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        data-field={id}
        className={`${fieldBase} ${error ? "border-palco-danger" : "border-palco-field"}`}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-palco-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-palco-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { ImagePlus, Upload } from "lucide-react";

type WizardUploadZoneProps = {
  previewUrl?: string | null;
  hasFile?: boolean;
  title?: string;
  subtitle?: string;
  accept?: string;
  variant?: "logo" | "product";
  onFileChange: (file: File | null) => void;
  onClear?: () => void;
};

export function WizardUploadZone({
  previewUrl,
  hasFile,
  title = "Clic para subir imagen",
  subtitle = "PNG, JPG o WebP · máx. 5 MB",
  accept = "image/jpeg,image/png,image/webp",
  variant = "product",
  onFileChange,
  onClear,
}: WizardUploadZoneProps) {
  const frameClass =
    variant === "logo"
      ? "wizard-alta__upload-frame wizard-alta__upload-frame--logo"
      : "wizard-alta__upload-frame wizard-alta__upload-frame--product";

  if (previewUrl) {
    return (
      <div className="wizard-alta__upload-card">
        <label className={frameClass}>
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Vista previa" className="wizard-alta__upload-preview" />
          <span className="wizard-alta__upload-change">
            <Upload className="size-4" aria-hidden />
            Cambiar imagen
          </span>
        </label>
        {onClear && (
          <button
            type="button"
            className="wizard-alta__upload-clear-btn"
            onClick={onClear}
          >
            Quitar imagen
          </button>
        )}
      </div>
    );
  }

  return (
    <label className="wizard-alta__upload wizard-alta__upload--empty">
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      <span className="wizard-alta__upload-icon">
        {hasFile ? <ImagePlus className="size-6" /> : <Upload className="size-6" />}
      </span>
      <span className="wizard-alta__upload-title">{title}</span>
      <span className="wizard-alta__upload-sub">{subtitle}</span>
    </label>
  );
}

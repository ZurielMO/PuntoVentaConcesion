"use client";

import { toast as sonnerToast } from "sonner";

export interface VipToastOptions {
  description?: string;
  duration?: number;
  icon?: string;
  id?: string;
  action?: { label: string; onClick: () => void };
}

const TONE: Record<"success" | "error" | "info" | "warning", string> = {
  success: "#1b7350",
  error: "#b3261e",
  info: "#0d4a34",
  warning: "#845000",
};

function toastOptions(options: VipToastOptions | undefined, tone: keyof typeof TONE, duration: number) {
  return {
    id: options?.id,
    description: options?.description,
    duration: options?.duration || duration,
    action: options?.action,
    // Sonner vive en el layout raíz; aquí se fija el aspecto del storefront.
    style: {
      backgroundColor: "#FFFFFF",
      color: "#0F1A15",
      border: "1px solid #E2E3DD",
      borderRadius: "16px",
      fontFamily: "var(--font-inter-vip), Inter, sans-serif",
      fontSize: "14px",
      boxShadow: "0 2px 6px rgb(4 31 22 / 0.1), 0 14px 32px -10px rgb(4 31 22 / 0.35)",
      ["--normal-text" as string]: TONE[tone],
    },
    actionButtonStyle: {
      backgroundColor: "#0D4A34",
      color: "#FFFFFF",
      borderRadius: "999px",
      fontWeight: 600,
      padding: "0 12px",
      height: "30px",
    },
  };
}

export const vipToast = {
  success: (title: string, options?: VipToastOptions) => {
    sonnerToast.success(title, toastOptions(options, "success", 3000));
  },

  error: (title: string, options?: VipToastOptions) => {
    sonnerToast.error(title, toastOptions(options, "error", 4500));
  },

  info: (title: string, options?: VipToastOptions) => {
    sonnerToast.info(title, toastOptions(options, "info", options?.action ? 5000 : 3000));
  },

  warning: (title: string, options?: VipToastOptions) => {
    sonnerToast.warning(title, toastOptions(options, "warning", 4000));
  },
};

export function useVipToast() {
  return vipToast;
}

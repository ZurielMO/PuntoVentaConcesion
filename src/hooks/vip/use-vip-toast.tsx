"use client";

import { toast as sonnerToast } from "sonner";

export interface VipToastOptions {
  description?: string;
  duration?: number;
  icon?: string;
  id?: string;
}

function toastOptions(
  options: VipToastOptions | undefined,
  borderColor: string,
  duration: number,
) {
  return {
    id: options?.id,
    description: options?.description,
    duration: options?.duration || duration,
    className:
      "bg-white text-[#171A19] border shadow-xl rounded-2xl font-body-md text-sm",
    style: {
      backgroundColor: "#FFFFFF",
      color: "#171A19",
      borderColor,
    },
  };
}

export const vipToast = {
  success: (title: string, options?: VipToastOptions) => {
    sonnerToast.success(title, toastOptions(options, "#1F8A55", 3000));
  },

  error: (title: string, options?: VipToastOptions) => {
    sonnerToast.error(title, toastOptions(options, "#C43D3D", 4000));
  },

  info: (title: string, options?: VipToastOptions) => {
    sonnerToast.info(title, toastOptions(options, "#3978A8", 3000));
  },

  warning: (title: string, options?: VipToastOptions) => {
    sonnerToast.warning(title, toastOptions(options, "#D99721", 3500));
  },
};

export function useVipToast() {
  return vipToast;
}

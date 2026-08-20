"use client";

import { useEffect, useRef } from "react";
import {
  isEditableScannerTarget,
  KeyboardWedgeBuffer,
} from "@/lib/loyalty/qr-scanner";

type UseKeyboardWedgeQrOptions = {
  enabled: boolean;
  onScan: (memberId: string) => void;
  debounceMs?: number;
};

export function useKeyboardWedgeQr({
  enabled,
  onScan,
  debounceMs = 3_000,
}: UseKeyboardWedgeQrOptions) {
  const scanner = useRef(new KeyboardWedgeBuffer());
  const lastScan = useRef<{ memberId: string; at: number } | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) {
      scanner.current.reset();
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      if (isEditableScannerTarget(event.target)) {
        scanner.current.reset();
        return;
      }

      const memberId = scanner.current.push(event.key, event.timeStamp);
      if (!memberId) return;

      const now = Date.now();
      if (
        lastScan.current?.memberId === memberId &&
        now - lastScan.current.at < debounceMs
      ) {
        return;
      }
      lastScan.current = { memberId, at: now };
      onScanRef.current(memberId);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      scanner.current.reset();
    };
  }, [debounceMs, enabled]);
}

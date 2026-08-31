"use client";

import { useEffect, useRef } from "react";
import { isTypingTarget, parseVipScanPayload } from "@/lib/vip/scan";

const SCAN_GAP_MS = 80;

export function usePdaScanner(onScan: (payload: string) => void | Promise<void>, enabled = true) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const flush = () => {
      const parsed = parseVipScanPayload(bufferRef.current);
      bufferRef.current = "";
      if (parsed.length >= 4) void onScanRef.current(parsed);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const now = Date.now();
      if (now - lastKeyAtRef.current > SCAN_GAP_MS) bufferRef.current = "";
      lastKeyAtRef.current = now;

      if (event.key === "Enter") {
        event.preventDefault();
        flush();
        return;
      }
      if (event.key.length === 1) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled]);
}

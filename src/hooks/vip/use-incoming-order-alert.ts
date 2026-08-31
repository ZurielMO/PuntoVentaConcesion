"use client";

import { useEffect, useRef } from "react";

const VIBRATE_PATTERN = [400, 180, 400, 180, 700];

function getPdaBridge() {
  if (typeof window === "undefined") return undefined;
  return window.Android;
}

function startNativeAlert(): boolean {
  const android = getPdaBridge();
  if (!android?.isPdaApp?.()) return false;
  if (typeof android.startOrderAlert !== "function") return false;
  try {
    android.startOrderAlert();
    return true;
  } catch {
    return false;
  }
}

function stopNativeAlert() {
  try {
    getPdaBridge()?.stopOrderAlert?.();
  } catch {
    // ignore
  }
}

function startWebAlert(refs: {
  ctx: AudioContext | null;
  timer: number | null;
  vibrateTimer: number | null;
}): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    refs.ctx = ctx;
    void ctx.resume();

    const beep = (frequency: number, when: number, duration = 0.16) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(frequency, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.22, when + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(when);
      osc.stop(when + duration + 0.02);
    };

    const loop = () => {
      if (!refs.ctx) return;
      const t = ctx.currentTime + 0.02;
      beep(880, t);
      beep(1174, t + 0.2);
      beep(880, t + 0.4);
    };

    loop();
    refs.timer = window.setInterval(loop, 900);

    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(VIBRATE_PATTERN);
      refs.vibrateTimer = window.setInterval(() => {
        navigator.vibrate(VIBRATE_PATTERN);
      }, 1400);
    }
  } catch {
    // Autoplay or AudioContext may be blocked in some browsers.
  }
}

function stopWebAlert(refs: {
  ctx: AudioContext | null;
  timer: number | null;
  vibrateTimer: number | null;
}): void {
  if (refs.timer != null) {
    window.clearInterval(refs.timer);
    refs.timer = null;
  }
  if (refs.vibrateTimer != null) {
    window.clearInterval(refs.vibrateTimer);
    refs.vibrateTimer = null;
  }
  try {
    navigator.vibrate?.(0);
  } catch {
    // ignore
  }
  if (refs.ctx) {
    void refs.ctx.close();
    refs.ctx = null;
  }
}

/** Repeats sound + vibration until `active` is false. Native PDA bridge preferred. */
export function useIncomingOrderAlert(active: boolean) {
  const webRefs = useRef({
    ctx: null as AudioContext | null,
    timer: null as number | null,
    vibrateTimer: null as number | null,
  });
  const nativeRef = useRef(false);

  useEffect(() => {
    if (!active) {
      if (nativeRef.current) {
        stopNativeAlert();
        nativeRef.current = false;
      }
      stopWebAlert(webRefs.current);
      return;
    }

    const usedNative = startNativeAlert();
    nativeRef.current = usedNative;
    if (!usedNative) {
      startWebAlert(webRefs.current);
    }

    return () => {
      if (nativeRef.current) {
        stopNativeAlert();
        nativeRef.current = false;
      }
      stopWebAlert(webRefs.current);
    };
  }, [active]);
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clock3, ShieldCheck, UtensilsCrossed } from "lucide-react";

/**
 * Intro cinematográfica de Servicio Palcos.
 * Personalidad: Premium (sin rebote). Capas: principal, secundaria y ambiente.
 * Se monta de nuevo en cada entrada y cada refresh de la portada; no se guarda en sesión.
 */

const EASE_ENTER = [0.16, 1, 0.3, 1] as const;
const EASE_EXIT = [0.3, 0, 1, 1] as const;
const EASE_ONSCREEN = [0.4, 0, 0.2, 1] as const;

const BEATS = [
  { id: "marca", ms: 2600, chapter: "01  Marca" },
  { id: "promesa", ms: 2900, chapter: "02  El servicio" },
  { id: "como", ms: 3400, chapter: "03  Cómo pedir" },
  { id: "cierre", ms: 1900, chapter: "04  Tu palco" },
] as const;

const TOTAL_MS = BEATS.reduce((sum, beat) => sum + beat.ms, 0);

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Elige el establecimiento",
    detail: "Arma tu pedido con el menú del estadio.",
  },
  {
    icon: ShieldCheck,
    title: "Paga en línea",
    detail: "Cobro seguro, sin pasar por puntos de venta.",
  },
  {
    icon: Clock3,
    title: "Sigue la entrega",
    detail: "Rastreo en vivo hasta tu palco.",
  },
] as const;

function isVipHome(pathname: string) {
  return pathname === "/servicio-palcos" || pathname === "/servicio-palcos/inicio";
}

export function VipIntroFilm() {
  const pathname = usePathname() || "";
  if (!isVipHome(pathname)) return null;
  return <VipIntroPlayer />;
}

function VipIntroPlayer() {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    dialogRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (reduced !== false) return;
    const timers: number[] = [];
    let elapsed = 0;
    BEATS.forEach((item, index) => {
      if (index === 0) {
        elapsed += item.ms;
        return;
      }
      const startAt = elapsed;
      timers.push(window.setTimeout(() => setBeat(index), startAt));
      elapsed += item.ms;
    });
    timers.push(window.setTimeout(() => setOpen(false), TOTAL_MS));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [reduced]);

  const dismiss = () => setOpen(false);
  const active = BEATS[beat];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          key="vip-intro"
          role="dialog"
          aria-modal="true"
          aria-label="Introducción a Servicio Palcos"
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.42, ease: EASE_EXIT } }}
          transition={{ duration: 0.45, ease: EASE_ENTER }}
          className="fixed inset-0 z-[200] overflow-hidden bg-[#041A12] text-white outline-none"
          onKeyDown={(event) => {
            if (event.key === "Escape") dismiss();
          }}
        >
          <AmbientField reduced={!!reduced} />
          <Letterbox />

          <button
            type="button"
            onClick={dismiss}
            className="absolute right-4 top-[max(2.75rem,calc(env(safe-area-inset-top)+2.25rem))] z-20 rounded-full border border-[#C5A059]/35 bg-white/5 px-3.5 py-1.5 font-[family-name:var(--font-montserrat)] text-[11px] font-bold uppercase tracking-[0.16em] text-[#E6C687] backdrop-blur-sm transition-colors hover:border-[#D4AF37]/70 hover:text-white"
          >
            Omitir
          </button>

          <div className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-col items-center justify-center px-6 pb-16 pt-14">
            <LogoMark beat={beat} reduced={!!reduced} />

            <div className="relative mt-7 h-[300px] w-full sm:mt-8 sm:h-[250px]">
              {reduced ? (
                <ReducedStory onEnter={dismiss} />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    className="absolute inset-0 flex flex-col items-center text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.28, ease: EASE_EXIT } }}
                    transition={{ duration: 0.35, ease: EASE_ENTER }}
                  >
                    {active.id === "marca" && <MarcaBeat />}
                    {active.id === "promesa" && <PromesaBeat />}
                    {active.id === "como" && <ComoBeat />}
                    {active.id === "cierre" && <CierreBeat />}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-10 z-20 px-5 sm:bottom-12">
            <div className="mx-auto flex w-full max-w-lg items-center justify-between pb-2 font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#A3B8AF]">
              <span>{reduced ? "Servicio Palcos" : active.chapter}</span>
              <span>Estadio León</span>
            </div>
            <div className="mx-auto h-px w-full max-w-lg overflow-hidden bg-white/10">
              {reduced ? (
                <div className="h-full w-full origin-left bg-[#D4AF37]/80" />
              ) : (
                <motion.div
                  className="h-full w-full origin-left bg-[#D4AF37]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: TOTAL_MS / 1000, ease: "linear" }}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AmbientField({ reduced }: { reduced: boolean }) {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-[#C5A059]/12 blur-3xl"
        animate={reduced ? { opacity: 0.7 } : { x: [0, -16, 0], y: [0, 10, 0], opacity: [0.55, 0.85, 0.55] }}
        transition={reduced ? { duration: 0.4 } : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-[#145C42]/30 blur-3xl"
        animate={reduced ? { opacity: 0.8 } : { x: [0, 14, 0], y: [0, -12, 0], opacity: [0.45, 0.75, 0.45] }}
        transition={reduced ? { duration: 0.4 } : { duration: 9.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function Letterbox() {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 origin-top bg-[#020E0A] sm:h-10"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, ease: EASE_ENTER }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 origin-bottom bg-[#020E0A] sm:h-10"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, ease: EASE_ENTER }}
      />
    </>
  );
}

function LogoMark({ beat, reduced }: { beat: number; reduced: boolean }) {
  const settled = reduced || beat > 0;
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        aria-hidden
        className="absolute h-28 w-28 rounded-full border border-[#D4AF37]/45 sm:h-32 sm:w-32"
        initial={{ opacity: 0, scale: 0.86 }}
        animate={{ opacity: settled ? 0.55 : 1, scale: settled ? 1.08 : 1 }}
        transition={{ duration: 0.7, delay: 0.12, ease: EASE_ONSCREEN }}
      />
      <motion.div
        className="relative flex h-[92px] w-[92px] items-center justify-center sm:h-[104px] sm:w-[104px]"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
        animate={
          reduced
            ? { opacity: 1 }
            : { opacity: 1, y: settled ? -4 : 0, scale: settled ? 0.86 : 1 }
        }
        transition={
          reduced
            ? { duration: 0.35, ease: EASE_ENTER }
            : { duration: settled ? 0.5 : 0.65, ease: settled ? EASE_ONSCREEN : EASE_ENTER }
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/club-leon-fc.png"
          alt="Club León"
          fetchPriority="high"
          className="h-[78px] w-auto object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] sm:h-[88px]"
        />
      </motion.div>
    </div>
  );
}

function MarcaBeat() {
  return (
    <>
      <motion.p
        className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#E6C687]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, delay: 0.42, ease: EASE_ENTER }}
      >
        Club León
      </motion.p>
      <motion.h1
        className="mt-2 font-[family-name:var(--font-montserrat)] text-[1.85rem] font-extrabold leading-tight tracking-tight sm:text-4xl"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.54, ease: EASE_ENTER }}
      >
        Servicio Palcos
      </motion.h1>
      <motion.div
        aria-hidden
        className="mt-4 h-px w-16 origin-center bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7, ease: EASE_ENTER }}
      />
      <motion.p
        className="mt-4 max-w-xs text-sm leading-relaxed text-[#D3E0D9]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.82, ease: EASE_ENTER }}
      >
        Servicio oficial del Estadio León.
      </motion.p>
    </>
  );
}

function PromesaBeat() {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE_ENTER }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E6C687]">Durante el partido</p>
      <h2 className="mt-2 max-w-sm font-[family-name:var(--font-montserrat)] text-2xl font-extrabold leading-tight tracking-tight sm:text-[1.7rem]">
        Alimentos y bebidas, directo a tu palco
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#D3E0D9]">
        Pides desde tu palco. El pedido llega hasta donde estes, sin filas.
      </p>
    </motion.div>
  );
}

function ComoBeat() {
  return (
    <div className="flex w-full flex-col items-stretch gap-2.5 text-left">
      <p className="text-center font-[family-name:var(--font-montserrat)] text-lg font-extrabold tracking-tight">
        Tres pasos, y llega a tu asiento
      </p>
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={step.title}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.42, ease: EASE_ENTER }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#E6C687]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-[family-name:var(--font-montserrat)] text-sm font-bold">{step.title}</span>
              <span className="block text-xs leading-snug text-[#C9D5CF]">{step.detail}</span>
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function CierreBeat() {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE_ENTER }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E6C687]">También en preventa</p>
      <h2 className="mt-2 font-[family-name:var(--font-montserrat)] text-2xl font-extrabold tracking-tight sm:text-3xl">
        Este partido, o el próximo
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#D3E0D9]">
        Programa la entrega para el siguiente encuentro o consulta tu pedido con la guía del correo.
      </p>
    </motion.div>
  );
}

function ReducedStory({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center overflow-y-auto text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E6C687]">Club León</p>
      <h1 className="mt-1 font-[family-name:var(--font-montserrat)] text-2xl font-extrabold">Servicio Palcos</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#D3E0D9]">
        Alimentos y bebidas del Estadio León, con entrega en tu palco. Eliges restaurante, pagas en línea y sigues el pedido hasta tu asiento. Puedes pedirlo en el partido, programarlo o consultar tu guía.
      </p>
      <button
        type="button"
        onClick={onEnter}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#0D4A34] px-6 font-[family-name:var(--font-montserrat)] text-sm font-bold text-white"
      >
        Entrar
      </button>
    </div>
  );
}

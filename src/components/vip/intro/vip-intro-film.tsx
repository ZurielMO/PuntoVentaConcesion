"use client";

import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronsRight, Crown, UtensilsCrossed } from "lucide-react";
import "./vip-intro-film.css";

/**
 * Intro de Servicio Palcos en formato de spot: letterbox, reflectores que encienden,
 * tipografía revelada por máscara y la ruta del restaurante al palco.
 * Personalidad Premium (sin rebote) con capa principal, secundaria y de ambiente.
 * Cada elemento declara su momento con `at()`; los keyframes viven en vip-intro-film.css.
 * Solo corre cuando el documento abre o recarga la portada. Entrar a un módulo y
 * volver no la repite: el layout sigue montado y esta visita ya la consumió.
 */

const SCENES = [
  { id: "marca", ms: 2700, chapter: "Marca" },
  { id: "promesa", ms: 2600, chapter: "El servicio" },
  { id: "como", ms: 3000, chapter: "Cómo pedir" },
  { id: "cierre", ms: 2500, chapter: "Tu palco" },
] as const;

const LAST_SCENE = SCENES.length - 1;
const EXIT_MS = 600;
const CREST_SRC = "/brand/club-leon-fc.png";
const HOME_PATHS = new Set(["/servicio-palcos", "/servicio-palcos/inicio"]);
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const EYEBROW = "text-[11px] font-bold uppercase tracking-[0.3em] text-[#E6C687] sm:text-xs";
const DISPLAY = "font-[family-name:var(--font-montserrat)] font-extrabold text-[#F8F4EA]";
const CTA =
  "inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-[#E6C687] to-[#C5A059] px-7 font-[family-name:var(--font-montserrat)] text-sm font-bold uppercase tracking-[0.14em] text-[#062319] shadow-[0_10px_30px_rgba(197,160,89,0.28)] transition-[filter] hover:brightness-110";

const STEPS = [
  { title: "Elige el establecimiento", detail: "Arma tu pedido con el menú del estadio.", at: 0.95 },
  { title: "Paga en línea", detail: "Cobro seguro, sin pasar por puntos de venta.", at: 1.25 },
  { title: "Sigue la entrega", detail: "Rastreo en vivo hasta tu palco.", at: 1.6 },
] as const;

const MOTES = [
  { left: "17%", top: "36%", size: 3, at: 1.1, dur: 6.4, drift: "0.6rem", peak: 0.5 },
  { left: "27%", top: "58%", size: 2, at: 2.3, dur: 7.6, drift: "-0.4rem", peak: 0.35 },
  { left: "35%", top: "27%", size: 2, at: 1.6, dur: 5.8, drift: "0.3rem", peak: 0.4 },
  { left: "65%", top: "31%", size: 3, at: 1.3, dur: 6.9, drift: "-0.5rem", peak: 0.45 },
  { left: "74%", top: "52%", size: 2, at: 2.8, dur: 7.2, drift: "0.4rem", peak: 0.35 },
  { left: "83%", top: "39%", size: 2, at: 1.9, dur: 6.1, drift: "-0.3rem", peak: 0.4 },
] as const;

/** Estadio visto desde arriba, en unidades del viewBox 320×190. */
const STADIUM = {
  outer: "M80 8H240A72 72 0 0 1 312 80V110A72 72 0 0 1 240 182H80A72 72 0 0 1 8 110V80A72 72 0 0 1 80 8Z",
  inner: "M84 30H236A50 50 0 0 1 286 80V110A50 50 0 0 1 236 160H84A50 50 0 0 1 34 110V80A50 50 0 0 1 84 30Z",
  pitch: "M74 52H246V138H74Z",
  markings: "M160 52V138M148 95A12 12 0 1 0 172 95A12 12 0 1 0 148 95M74 73H100V117H74M246 73H220V117H246",
  palcos: "M112 26H202",
  route: "M82 171H238A61 61 0 0 0 299 110V80A61 61 0 0 0 238 19H206",
};

/** Cancha desde un palco lateral (viewBox 400×300), proyectada en perspectiva. */
const PITCH = {
  field: "M-40 290H440L340 120H60Z",
  halfway: "M200 290V120",
  circle: "M169.2 184A30.8 21.4 0 1 0 230.8 184A30.8 21.4 0 1 0 169.2 184",
  boxes: "M-9.5 238.2H56.3L95 142H47M409.5 238.2H343.7L305 142H353",
};

type SceneState = "idle" | "active" | "past";

function at(delay: number, duration?: number): React.CSSProperties {
  return { "--at": `${delay}s`, ...(duration ? { "--dur": `${duration}s` } : {}) } as React.CSSProperties;
}

function isVipHome(pathname: string) {
  return HOME_PATHS.has(pathname.replace(/\/+$/, ""));
}

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export function VipIntroFilm() {
  const pathname = usePathname() || "";
  const home = isVipHome(pathname);
  // En el servidor no hay `window`: la portada sí incluye la intro en el HTML.
  // En el cliente se congela la URL con la que se cargó el documento, así un
  // cambio de ruta dentro de Servicio Palcos no vuelve a armarla.
  const [openedOnHome] = useState(() => {
    if (typeof window === "undefined") return true;
    return isVipHome(window.location.pathname);
  });
  const phase = useRef<"pending" | "showing" | "done">("pending");

  if (!openedOnHome) return null;

  if (!home) {
    if (phase.current === "showing") phase.current = "done";
    return null;
  }

  if (phase.current === "done") return null;
  phase.current = "showing";
  return <VipIntroPlayer />;
}

function VipIntroPlayer() {
  const reduced = usePrefersReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const summaryId = useId();
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);
  const [closing, setClosing] = useState(false);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    // El failsafe de CSS ya empezó a retirar la intro: la hidratación llegó tarde y no se repite.
    if (dialog && Number(getComputedStyle(dialog).opacity) < 1) {
      setOpen(false);
      return;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus({ preventScroll: true });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!closing) return;
    const id = window.setTimeout(() => setOpen(false), EXIT_MS);
    return () => window.clearTimeout(id);
  }, [closing]);

  useEffect(() => {
    if (!ready || reduced || closing) return;
    const id = window.setTimeout(() => {
      if (scene >= LAST_SCENE) setClosing(true);
      else setScene(scene + 1);
    }, SCENES[scene].ms);
    return () => window.clearTimeout(id);
  }, [ready, reduced, closing, scene]);

  if (!open) return null;

  const close = () => setClosing(true);
  const advance = () => {
    if (closing) return;
    if (scene >= LAST_SCENE) setClosing(true);
    else setScene(scene + 1);
  };
  const stateOf = (index: number): SceneState => (index < scene ? "past" : index === scene ? "active" : "idle");

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Introducción a Servicio Palcos"
      aria-describedby={summaryId}
      tabIndex={-1}
      data-scene={scene}
      data-ready={ready ? "" : undefined}
      data-closing={closing ? "" : undefined}
      className="vip-intro fixed inset-0 z-[200] select-none overflow-hidden text-white outline-none touch-manipulation"
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
        else if (event.key === "ArrowRight" && !reduced) advance();
      }}
    >
      <p id={summaryId} className="sr-only">
        Servicio Palcos de Club León: alimentos y bebidas del Estadio León con entrega en tu palco, sin filas. Elige el
        establecimiento, paga en línea y sigue la entrega en vivo hasta tu palco.
      </p>

      <Atmosphere />

      <div
        className={`vip-intro-stage absolute inset-0 ${reduced ? "" : "cursor-pointer"}`}
        onClick={reduced ? undefined : advance}
      >
        {reduced ? (
          <ReducedStory onEnter={close} />
        ) : (
          <>
            <MarcaScene state={stateOf(0)} />
            <PromesaScene state={stateOf(1)} />
            <ComoScene state={stateOf(2)} />
            <CierreScene state={stateOf(3)} onEnter={close} />
          </>
        )}
      </div>

      <div aria-hidden className="vip-intro-vignette" />
      <div aria-hidden className="vip-intro-grain" />
      <div aria-hidden className="vip-intro-bar" data-edge="top" />
      <div aria-hidden className="vip-intro-bar" data-edge="bottom" />

      <TopHud onSkip={close} />
      <BottomHud scene={scene} reduced={reduced} />
    </div>
  );
}

function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="vip-intro-lights">
        <div className="vip-intro-haze" />
        <span className="vip-intro-light" data-side="left" style={at(0.1, 7)}>
          <span className="vip-intro-cone" />
          <span className="vip-intro-lamp" />
        </span>
        <span className="vip-intro-light" data-side="right" style={at(0.35, 8.5)}>
          <span className="vip-intro-cone" />
          <span className="vip-intro-lamp" />
        </span>
        {MOTES.map((mote) => (
          <span
            key={`${mote.left}-${mote.top}`}
            className="vip-intro-mote"
            style={
              {
                left: mote.left,
                top: mote.top,
                "--size": `${mote.size}px`,
                "--drift": mote.drift,
                "--peak": mote.peak,
                ...at(mote.at, mote.dur),
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

function TopHud({ onSkip }: { onSkip: () => void }) {
  return (
    <div
      className="vip-intro-hud pointer-events-none absolute inset-x-0 top-[calc(var(--vi-top)+0.75rem)] z-20 px-4 sm:px-6"
      style={at(0.3, 0.6)}
    >
      <div className="flex items-center justify-between">
        <span aria-hidden className="vip-intro-bug flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CREST_SRC} alt="" className="h-6 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
          <span className="font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-[0.24em] text-[#E6C687]">
            Servicio Palcos
          </span>
        </span>
        <button
          type="button"
          onClick={onSkip}
          aria-label="Omitir introducción"
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-[#C5A059]/35 bg-black/25 py-1.5 pl-3.5 pr-2.5 font-[family-name:var(--font-montserrat)] text-[11px] font-bold uppercase tracking-[0.16em] text-[#E6C687] transition-colors hover:border-[#D4AF37]/70 hover:text-white"
        >
          Omitir
          <ChevronsRight aria-hidden className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function BottomHud({ scene, reduced }: { scene: number; reduced: boolean }) {
  return (
    <div
      aria-hidden
      className="vip-intro-hud pointer-events-none absolute inset-x-0 bottom-[calc(var(--vi-bottom)+0.875rem)] z-20 px-5"
      style={at(0.45, 0.6)}
    >
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-2.5 flex items-center justify-between font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3B8AF]">
          {reduced ? (
            <span>Servicio Palcos</span>
          ) : (
            <span key={scene} className="vip-intro-chapter">
              <span className="tabular-nums text-[#E6C687]">0{scene + 1}</span>
              <span className="mx-2 text-white/25">/</span>
              {SCENES[scene].chapter}
            </span>
          )}
          <span>Estadio León</span>
        </div>
        {reduced ? (
          <div className="h-0.5 rounded-full bg-[#D4AF37]/70" />
        ) : (
          <div className="flex gap-1.5">
            {SCENES.map((item, index) => (
              <span
                key={item.id}
                data-seg={index < scene ? "past" : index === scene ? "active" : "idle"}
                className="vip-intro-seg relative h-0.5 flex-1 overflow-hidden rounded-full bg-white/15"
              >
                <span
                  className="vip-intro-seg-fill absolute inset-0 origin-left bg-[#D4AF37]"
                  style={{ "--dur": `${item.ms}ms` } as React.CSSProperties}
                />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Scene({
  state,
  backdrop,
  children,
}: {
  state: SceneState;
  backdrop?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div data-state={state} className="vip-intro-scene">
      {backdrop}
      <div className="vip-intro-frame relative flex h-full flex-col items-center justify-center px-6 pb-[calc(var(--vi-bottom)+3.5rem)] pt-[calc(var(--vi-top)+3.25rem)] text-center">
        {children}
      </div>
    </div>
  );
}

/** Texto que sube desde detrás de una máscara. */
function Line({
  delay,
  duration,
  className = "",
  children,
}: {
  delay: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`vip-intro-line ${className}`}>
      <span style={at(delay, duration)}>{children}</span>
    </span>
  );
}

function CrestReveal({ delay, flareAt, compact = false }: { delay: number; flareAt: number; compact?: boolean }) {
  return (
    <div className={`relative flex items-center justify-center ${compact ? "size-24" : "size-36 sm:size-40"}`}>
      <span aria-hidden className="vip-intro-glow absolute -inset-1/2 rounded-full" style={at(delay + 0.05, 1.4)} />
      <span
        aria-hidden
        className="vip-intro-ring absolute inset-[4%] rounded-full border border-[#D4AF37]/40"
        style={at(delay + 0.15, 1)}
      />
      {!compact && (
        <span
          aria-hidden
          className="vip-intro-ring absolute -inset-[10%] rounded-full border border-[#D4AF37]/15"
          style={at(delay + 0.3, 1.1)}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CREST_SRC}
        alt=""
        fetchPriority={compact ? undefined : "high"}
        className={`vip-intro-emerge relative w-auto drop-shadow-[0_10px_24px_rgba(0,0,0,0.5)] ${compact ? "h-16" : "h-[5.25rem] sm:h-24"}`}
        style={at(delay, compact ? 0.8 : 0.9)}
      />
      <span aria-hidden className="vip-intro-flare" style={at(flareAt, 1.1)} />
    </div>
  );
}

function MarcaScene({ state }: { state: SceneState }) {
  return (
    <Scene state={state}>
      <CrestReveal delay={0.35} flareAt={1} />
      <Line delay={1.2} duration={0.7} className={`mt-7 ${EYEBROW}`}>
        Club León
      </Line>
      <h2 className={`mt-3 text-[3.75rem] leading-[0.9] tracking-[-0.04em] sm:text-8xl ${DISPLAY}`}>
        <Line delay={1.32} duration={0.85}>
          <span className="vip-intro-sheen" style={at(2, 1.2)}>
            Servicio
          </span>
        </Line>
        <Line delay={1.44} duration={0.85}>
          <span className="vip-intro-sheen vip-intro-gold" style={at(2.12, 1.2)}>
            Palcos
          </span>
        </Line>
      </h2>
      <span
        aria-hidden
        className="vip-intro-rule mt-6 h-px w-20 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
        style={at(1.8, 0.7)}
      />
      <p className="vip-intro-up mt-5 text-sm text-[#CFDDD5] sm:text-base" style={at(1.95, 0.6)}>
        La experiencia VIP del Estadio León
      </p>
    </Scene>
  );
}

function PromesaScene({ state }: { state: SceneState }) {
  return (
    <Scene state={state} backdrop={<PitchView />}>
      <p className={`vip-intro-up ${EYEBROW}`} style={at(0.3, 0.6)}>
        Durante el partido
      </p>
      <h2 className={`mt-4 text-[3rem] leading-[0.98] tracking-[-0.04em] sm:text-7xl ${DISPLAY}`}>
        <Line delay={0.36}>Sin filas.</Line>
        <Line delay={0.5}>Sin perderte</Line>
        <Line delay={0.64}>
          <span className="vip-intro-sheen vip-intro-gold" style={at(1.5, 1.2)}>
            una jugada.
          </span>
        </Line>
      </h2>
      <p
        className="vip-intro-up mt-6 max-w-[17rem] text-sm leading-relaxed text-[#CFDDD5] sm:max-w-xs sm:text-base"
        style={at(1.2, 0.6)}
      >
        Alimentos y bebidas del estadio, directo a tu palco.
      </p>
    </Scene>
  );
}

function PitchView() {
  return (
    <div aria-hidden className="vip-intro-pitch">
      <svg viewBox="0 0 400 300" className="size-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path pathLength={1} className="vip-intro-draw" style={at(0.1, 1.4)} d={PITCH.field} stroke="rgba(255,255,255,0.26)" strokeWidth={0.9} />
        <path pathLength={1} className="vip-intro-draw" style={at(0.4, 0.8)} d={PITCH.halfway} stroke="rgba(212,175,55,0.55)" strokeWidth={0.9} />
        <path pathLength={1} className="vip-intro-draw" style={at(0.6, 1.1)} d={PITCH.circle} stroke="rgba(212,175,55,0.55)" strokeWidth={0.9} />
        <path pathLength={1} className="vip-intro-draw" style={at(0.75, 0.9)} d={PITCH.boxes} stroke="rgba(255,255,255,0.2)" strokeWidth={0.9} />
        <circle cx={200} cy={184} r={1.8} fill="rgba(212,175,55,0.8)" className="vip-intro-fade" style={at(1.2, 0.5)} />
      </svg>
    </div>
  );
}

function ComoScene({ state }: { state: SceneState }) {
  return (
    <Scene state={state}>
      <p className={`vip-intro-up ${EYEBROW}`} style={at(0.3, 0.6)}>
        Cómo funciona
      </p>
      <h2 className={`mt-3 text-[2.15rem] leading-[1.02] tracking-[-0.035em] sm:text-5xl ${DISPLAY}`}>
        <Line delay={0.36}>Del restaurante</Line>
        <Line delay={0.48}>
          a <span className="vip-intro-gold">tu palco.</span>
        </Line>
      </h2>
      <RouteMap />
      <StepList animated />
    </Scene>
  );
}

function RouteMap() {
  return (
    <div
      aria-hidden
      className="vip-intro-up relative mt-7 aspect-[320/190] w-[min(100%,42vh)] max-w-[24rem] [@media(max-height:560px)]:hidden"
      style={at(0.5, 0.7)}
    >
      <svg viewBox="0 0 320 190" className="absolute inset-0 size-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path pathLength={1} className="vip-intro-draw" style={at(0.55, 1.1)} d={STADIUM.outer} stroke="rgba(230,198,135,0.42)" strokeWidth={1} />
        <path pathLength={1} className="vip-intro-draw" style={at(0.65, 1)} d={STADIUM.inner} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
        <path pathLength={1} className="vip-intro-draw" style={at(0.75, 0.9)} d={STADIUM.pitch} stroke="rgba(255,255,255,0.2)" strokeWidth={0.9} />
        <path pathLength={1} className="vip-intro-draw" style={at(0.9, 0.8)} d={STADIUM.markings} stroke="rgba(255,255,255,0.16)" strokeWidth={0.8} />
        <path
          className="vip-intro-fade"
          style={at(1, 0.6)}
          d={STADIUM.palcos}
          stroke="rgba(212,175,55,0.5)"
          strokeWidth={3}
          strokeDasharray="5 3"
          strokeLinecap="butt"
        />
        <path pathLength={1} className="vip-intro-route" style={at(1.5, 1.15)} d={STADIUM.route} stroke="#D4AF37" strokeWidth={1.6} />
        <path pathLength={1} className="vip-intro-dot" style={at(1.5, 1.15)} d={STADIUM.route} stroke="rgba(212,175,55,0.3)" strokeWidth={11} />
        <path pathLength={1} className="vip-intro-dot" style={at(1.5, 1.15)} d={STADIUM.route} stroke="#FFF4D6" strokeWidth={4.5} />
      </svg>
      <MapMarker x={82} y={171} delay={0.85} pulseAt={1.3}>
        <span className="flex size-[30px] items-center justify-center rounded-full border border-[#C5A059]/50 bg-[#0A3224] text-[#E6C687] shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
          <UtensilsCrossed className="size-3.5" />
        </span>
      </MapMarker>
      <MapMarker x={206} y={19} delay={1} pulseAt={2.6} label="Tu palco">
        <span className="flex size-[26px] items-center justify-center rounded-full bg-gradient-to-b from-[#E6C687] to-[#C5A059] text-[#062319] shadow-[0_0_0_4px_rgba(212,175,55,0.15),0_6px_16px_rgba(0,0,0,0.35)]">
          <Crown className="size-3.5" />
        </span>
      </MapMarker>
    </div>
  );
}

function MapMarker({
  x,
  y,
  delay,
  pulseAt,
  label,
  children,
}: {
  x: number;
  y: number;
  delay: number;
  pulseAt: number;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="absolute" style={{ left: `${(x / 320) * 100}%`, top: `${(y / 190) * 100}%` }}>
      <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
        <span className="vip-intro-emerge relative block" style={at(delay, 0.6)}>
          <span className="vip-intro-pulse" style={at(pulseAt, 0.9)} />
          {children}
        </span>
      </span>
      {label && (
        <span
          className="vip-intro-up absolute bottom-[1.1rem] left-0 -translate-x-1/2 whitespace-nowrap font-[family-name:var(--font-montserrat)] text-[9px] font-bold uppercase tracking-[0.22em] text-[#E6C687]"
          style={at(delay + 0.12, 0.5)}
        >
          {label}
        </span>
      )}
    </span>
  );
}

function StepList({ animated }: { animated: boolean }) {
  return (
    <ol className="mt-5 w-full max-w-sm text-left">
      {STEPS.map((step, index) => (
        <li
          key={step.title}
          className={`flex items-baseline gap-3.5 py-2.5 ${index > 0 ? "border-t border-white/10" : ""} ${animated ? "vip-intro-up" : ""}`}
          style={animated ? at(step.at, 0.55) : undefined}
        >
          <span className="font-[family-name:var(--font-montserrat)] text-[11px] font-bold tabular-nums tracking-[0.14em] text-[#D4AF37]">
            0{index + 1}
          </span>
          <span className="min-w-0">
            <span className="block font-[family-name:var(--font-montserrat)] text-[0.95rem] font-bold leading-tight text-white">
              {step.title}
            </span>
            <span
              className={`mt-0.5 block text-xs leading-snug text-[#B9CBC2] ${
                animated ? "[@media(max-height:700px)]:hidden" : "[@media(max-height:600px)]:hidden"
              }`}
            >
              {step.detail}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function CierreScene({ state, onEnter }: { state: SceneState; onEnter: () => void }) {
  return (
    <Scene state={state}>
      <CrestReveal delay={0.3} flareAt={0.55} compact />
      <Line delay={0.55} duration={0.7} className={`mt-4 ${EYEBROW}`}>
        Club León · Estadio León
      </Line>
      <h2 className={`mt-2 text-[2.2rem] leading-none tracking-[-0.035em] sm:text-5xl ${DISPLAY}`}>
        <Line delay={0.66}>
          <span className="vip-intro-sheen" style={at(1.35, 1.2)}>
            Servicio Palcos
          </span>
        </Line>
      </h2>
      <span
        aria-hidden
        className="vip-intro-rule mt-5 h-px w-16 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
        style={at(0.95, 0.6)}
      />
      <p className="mt-5 font-[family-name:var(--font-montserrat)] text-[1.2rem] font-bold leading-snug tracking-[-0.01em] text-[#F8F4EA] sm:text-2xl">
        <Line delay={1}>Tú vive el partido.</Line>
        <Line delay={1.12}>
          <span className="vip-intro-gold">Nosotros llevamos el resto.</span>
        </Line>
      </p>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEnter();
        }}
        className={`vip-intro-up mt-8 ${CTA}`}
        style={at(1.4, 0.6)}
      >
        Entrar
        <ArrowRight aria-hidden className="size-4" />
      </button>
    </Scene>
  );
}

function ReducedStory({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center-safe overflow-y-auto px-6 pb-[calc(var(--vi-bottom)+3.5rem)] pt-[calc(var(--vi-top)+3.25rem)] text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CREST_SRC} alt="" className="h-16 w-auto drop-shadow-[0_10px_24px_rgba(0,0,0,0.5)]" />
      <p className={`mt-5 ${EYEBROW}`}>Club León · Estadio León</p>
      <h2 className={`mt-2 text-[2.2rem] leading-none tracking-[-0.035em] ${DISPLAY}`}>Servicio Palcos</h2>
      <p className="mt-4 font-[family-name:var(--font-montserrat)] text-lg font-bold leading-snug text-[#F8F4EA]">
        Tú vive el partido. <span className="vip-intro-gold">Nosotros llevamos el resto.</span>
      </p>
      <StepList animated={false} />
      <button type="button" onClick={onEnter} className={`mt-7 ${CTA}`}>
        Entrar
        <ArrowRight aria-hidden className="size-4" />
      </button>
    </div>
  );
}

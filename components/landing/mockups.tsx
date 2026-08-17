"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { WwLogo } from "@/components/ww-logo";
import { getActiveCatalogue } from "@/lib/catalogue";
import { exampleBrief, examplePhotoUrl } from "@/lib/example-brief";
import { rankWearPlans } from "@/lib/recommendation-engine";
import {
  PREFERENCES,
  contextLabels,
  preferenceLabels,
  type PreferenceId,
  type WearContext,
} from "@/lib/types";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useTick(ms: number, enabled: boolean) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setTick((n) => n + 1), ms);
    return () => window.clearInterval(id);
  }, [ms, enabled]);
  return tick;
}

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5 px-3" aria-hidden>
      <span className="size-2.5 rounded-full bg-[#ff5f57]" />
      <span className="size-2.5 rounded-full bg-[#febc2e]" />
      <span className="size-2.5 rounded-full bg-[#28c840]" />
    </div>
  );
}

function WindowChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="w-full overflow-hidden border bg-[var(--preview-sidebar)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      style={{
        borderColor: "var(--preview-border)",
        borderRadius: "var(--mockup-shell-radius)",
      }}
    >
      <div className="flex h-9 items-center border-b" style={{ borderColor: "var(--preview-border)" }}>
        <TrafficLights />
        <div className="ml-1 flex items-center gap-2 text-[11px] text-[var(--preview-muted-foreground)]">
          <WwLogo className="size-3.5" />
          <span className="font-medium text-foreground/80">{title}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function BriefStrip({ context }: { context: WearContext }) {
  return (
    <div className="flex flex-wrap gap-1.5 font-mono text-[10px] tracking-[0.2px] text-[var(--preview-muted-foreground)]">
      <span className="rounded-full border border-border px-2 py-0.5 text-foreground/80">
        {contextLabels.wearMoment[context.wearMoment]}
      </span>
      <span className="rounded-full border border-border px-2 py-0.5">
        {contextLabels.temperatureBand[context.temperatureBand]}
      </span>
      <span className="rounded-full border border-border px-2 py-0.5">
        {contextLabels.outdoorDuration[context.outdoorDuration]}
      </span>
      <span className="rounded-full border border-border px-2 py-0.5">
        {contextLabels.formality[context.formality]}
      </span>
      {context.preferences.map((id) => (
        <span key={id} className="rounded-full border border-brand/40 px-2 py-0.5 text-brand-light">
          {preferenceLabels[id]}
        </span>
      ))}
    </div>
  );
}

export function HeroBoard() {
  const plans = useMemo(() => rankWearPlans(exampleBrief, 1), []);
  const reduced = usePrefersReducedMotion();
  const tick = useTick(2400, !reduced);
  const highlight = reduced ? 0 : tick % 3;

  return (
    <WindowChrome title="Example brief · live ranking">
      <div className="p-3 text-left sm:p-4">
        <p className="font-mono text-[10px] tracking-[0.5px] text-[var(--preview-muted-foreground)]">
          Same engine as the app · {getActiveCatalogue().length} catalogue looks · top 3
        </p>
        <div className="mt-2">
          <BriefStrip context={exampleBrief} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.planId}
              className={`overflow-hidden rounded-[var(--mockup-inner-radius)] border bg-[var(--preview-card)] ${
                highlight === index ? "border-brand/70" : ""
              }`}
              style={{ borderColor: highlight === index ? undefined : "var(--preview-border)" }}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative h-36 bg-muted">
                <Image src={plan.sourceImageUrl} alt={plan.title} fill className="object-cover" sizes="200px" />
                <span className="absolute top-2 left-2 rounded bg-background/85 px-1.5 py-0.5 font-mono text-[9px]">
                  0{plan.rank}
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-[12px] font-medium leading-tight">{plan.title}</p>
                <p className="mt-1 truncate font-mono text-[10px] text-[var(--preview-muted-foreground)]">
                  {plan.garmentMetadataSummary.join(" · ")}
                </p>
                <p className="mt-2 line-clamp-2 text-[10px] leading-snug text-[var(--preview-muted-foreground)]">
                  {plan.reasons[0]}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </WindowChrome>
  );
}

export function BriefTerminal() {
  const plans = useMemo(() => rankWearPlans(exampleBrief, 1), []);
  const reduced = usePrefersReducedMotion();
  const tick = useTick(900, !reduced);
  const lines = [
    `brief  ${contextLabels.wearMoment[exampleBrief.wearMoment]}`,
    `temp   ${contextLabels.temperatureBand[exampleBrief.temperatureBand]}`,
    `out    ${contextLabels.outdoorDuration[exampleBrief.outdoorDuration]}`,
    `form   ${contextLabels.formality[exampleBrief.formality]}`,
    `prefs  ${exampleBrief.preferences.map((id) => preferenceLabels[id]).join(" · ")}`,
    `rank   ${plans.map((plan) => `${plan.rank}. ${plan.title}`).join(" · ")}`,
  ];
  const shown = reduced ? lines.length : Math.min(lines.length, 1 + (tick % (lines.length + 1)));

  return (
    <WindowChrome title="rankWearPlans(exampleBrief)">
      <div className="min-h-[280px] p-4 font-mono text-[11px] leading-6 text-[var(--preview-muted-foreground)]">
        <p className="text-foreground/80">catalogue.json · {getActiveCatalogue().length} active looks</p>
        {lines.slice(0, shown).map((line) => (
          <p key={line}>
            <span className="text-brand-light">›</span> {line}
          </p>
        ))}
        <p>
          <span className="text-brand-light">›</span> <span className="caret text-foreground">▍</span>
        </p>
      </div>
    </WindowChrome>
  );
}

export function PlansBoard() {
  const plans = useMemo(() => rankWearPlans(exampleBrief, 1), []);
  return (
    <WindowChrome title="Three Wear Plans">
      <div className="grid min-h-[280px] grid-cols-1 gap-2 p-2 sm:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.planId}
            className="overflow-hidden rounded-[var(--mockup-inner-radius)] border bg-[var(--preview-card)]"
            style={{ borderColor: "var(--preview-border)" }}
          >
            <div className="relative h-28 bg-muted">
              <Image src={plan.sourceImageUrl} alt={plan.title} fill className="object-cover" sizes="200px" />
            </div>
            <div className="p-2.5">
              <p className="font-mono text-[9px] text-brand-light">0{plan.rank}</p>
              <p className="mt-1 text-[12px] font-medium leading-tight">{plan.title}</p>
              <ul className="mt-2 space-y-1">
                {plan.reasons.slice(0, 2).map((reason) => (
                  <li key={reason} className="text-[10px] leading-snug text-[var(--preview-muted-foreground)]">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </WindowChrome>
  );
}

export function TryOnDetail() {
  const plan = useMemo(() => rankWearPlans(exampleBrief, 1)[0], []);
  const reduced = usePrefersReducedMotion();
  const tick = useTick(2200, !reduced);
  const pos = reduced ? 50 : 28 + (tick % 5) * 12;

  return (
    <WindowChrome title="Source photo · catalogue reference">
      <div className="flex min-h-[300px]">
        <div className="min-w-0 flex-1 p-3">
          <div className="relative h-48 overflow-hidden rounded-[var(--mockup-inner-radius)] border border-border bg-muted">
            <img src={plan.sourceImageUrl} alt={`Catalogue reference: ${plan.title}`} className="h-full w-full object-cover" />
            <div className="absolute inset-y-0 left-0 overflow-hidden border-r border-white/70" style={{ width: `${pos}%` }}>
              <img src={examplePhotoUrl} alt="Example source photo" className="h-full w-[620px] max-w-none object-cover" />
            </div>
            <div className="absolute top-2 left-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[9px]">EXAMPLE PHOTO</div>
            <div className="absolute top-2 right-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[9px]">CATALOGUE STILL</div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--preview-muted-foreground)]">
            Live YouCam cloth-v4 runs after you pick a plan. This slider is the example photo against the ranked look’s catalogue image — not a generated result.
          </p>
        </div>
        <aside
          className="hidden w-44 shrink-0 border-l p-3 text-[10px] leading-relaxed text-[var(--preview-muted-foreground)] sm:block"
          style={{ borderColor: "var(--preview-divider)" }}
        >
          <p className="font-mono tracking-[0.4px] text-foreground/70">PLAN 01</p>
          <p className="mt-1 text-foreground">{plan.title}</p>
          <p className="mt-4 font-mono tracking-[0.4px] text-foreground/70">BEFORE YOU BUY</p>
          <p className="mt-1">{plan.checkBeforeBuying}</p>
          <p className="mt-4 font-mono tracking-[0.4px] text-foreground/70">LIMIT</p>
          <p className="mt-1">Virtual rendering does not guarantee fit, fabric feel, or sizing.</p>
        </aside>
      </div>
    </WindowChrome>
  );
}

export function PriorityModal() {
  const reduced = usePrefersReducedMotion();
  const tick = useTick(1400, !reduced);
  const selectedCount = reduced ? 2 : 1 + (tick % 3);
  const selected = PREFERENCES.slice(0, selectedCount) as PreferenceId[];
  const context: WearContext = { ...exampleBrief, preferences: selected };
  const plans = rankWearPlans(context, selectedCount);

  return (
    <WindowChrome title="Your priorities">
      <div className="min-h-[300px] p-4 text-left">
        <p className="text-sm font-medium">What should the plan respect?</p>
        <p className="mt-1 text-xs text-[var(--preview-muted-foreground)]">
          Choose one to three. These are the five chips in the app.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-1.5">
          {PREFERENCES.map((id) => {
            const on = selected.includes(id);
            return (
              <div
                key={id}
                className={`flex min-h-10 items-center gap-2 rounded-2xl border px-3 text-xs ${
                  on ? "border-brand bg-brand text-[#fff8ef]" : "border-border text-[var(--preview-muted-foreground)]"
                }`}
              >
                <span className="grid size-4 place-items-center rounded-full border border-current text-[9px]">{on ? "✓" : "+"}</span>
                {preferenceLabels[id]}
              </div>
            );
          })}
        </div>
        <p className="mt-4 font-mono text-[10px] tracking-[0.4px] text-[var(--preview-muted-foreground)]">
          rankWearPlans → {plans.map((plan) => plan.title).join(" · ")}
        </p>
      </div>
    </WindowChrome>
  );
}

export function SessionPreview() {
  return (
    <WindowChrome title="Use my photo">
      <div className="min-h-[280px] p-4 text-left text-xs leading-relaxed">
        <p className="text-sm font-medium">Your image stays in this session.</p>
        <div className="mt-3 rounded-lg border border-brand/30 border-l-[3px] border-l-brand bg-brand/10 p-3 text-[var(--preview-muted-foreground)]">
          Used only to create a virtual outfit rendering for this session. WearWeather does not assess body, health, or worth. Reset deletes the session.
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-[0.4px] text-foreground/70">PHOTO GUIDANCE</p>
        <p className="mt-1 text-[var(--preview-muted-foreground)]">
          One person, facing forward, standing. Face and shoulders visible. JPG or PNG, 10 MB max.
        </p>
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-white/25 py-8 text-[var(--preview-muted-foreground)]">
          Choose a JPG or PNG
        </div>
      </div>
    </WindowChrome>
  );
}

export function MockupStage({
  src,
  alt,
  children,
}: {
  src: string;
  alt: string;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    // Grid stack: the background layer and the card layer share one grid cell,
    // so the stage always grows to fit the card (never clips or overlaps) while
    // the background image always covers the full area — responsive at any width.
    <div className="relative grid w-full overflow-hidden rounded-2xl border border-border/60 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
      <div className="relative col-start-1 row-start-1 min-h-[320px]">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1280px) 620px, 100vw" />
        <div className="absolute inset-0 bg-background/40" />
      </div>
      <motion.div
        className="relative z-10 col-start-1 row-start-1 flex items-center justify-center p-4 sm:p-6"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-full max-w-[620px]">{children}</div>
      </motion.div>
    </div>
  );
}

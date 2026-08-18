"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { WwLogo } from "@/components/ww-logo";
import { getActiveCatalogue } from "@/lib/catalogue";
import { exampleBrief, examplePhotos } from "@/lib/example-brief";
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

function WindowChrome({
  title,
  children,
  hug = false,
}: {
  title: string;
  children: React.ReactNode;
  hug?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-col overflow-hidden border bg-[var(--preview-sidebar)] shadow-[0_8px_28px_rgba(26,26,20,0.08)] ${hug ? "" : "h-full max-h-full"}`}
      style={{
        borderColor: "var(--preview-border)",
        borderRadius: "var(--mockup-shell-radius)",
      }}
    >
      <div className="flex h-9 shrink-0 items-center border-b" style={{ borderColor: "var(--preview-border)" }}>
        <TrafficLights />
        <div className="ml-1 flex items-center gap-2 text-[11px] text-[var(--preview-muted-foreground)]">
          <WwLogo className="size-4" />
          <span className="font-medium text-foreground/80">{title}</span>
        </div>
      </div>
      <div className={hug ? "" : "min-h-0 flex-1 overflow-hidden"}>{children}</div>
    </div>
  );
}

export function BriefStrip({ context }: { context: WearContext }) {
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
      {context.makeupFinish && (
        <span className="rounded-full border border-brand/40 px-2 py-0.5 text-brand-light">Makeup finish</span>
      )}
    </div>
  );
}

export function HeroBoard() {
  const plans = useMemo(() => rankWearPlans(exampleBrief, 1), []);
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);
  const plan = plans[index] || plans[0];

  useEffect(() => {
    if (reduced || paused || plans.length < 2) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % plans.length), 3200);
    return () => window.clearInterval(id);
  }, [reduced, paused, plans.length, index]);

  return (
    <WindowChrome title="Example brief · live ranking" hug>
      <div
        className="text-left"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative flex max-h-[calc(100svh-16rem)] items-start justify-center bg-[#ecece4]">
          <img
            src={plan.sourceImageUrl}
            alt={plan.title}
            className="max-h-[calc(100svh-16rem)] w-full object-contain object-top"
          />
          <span className="absolute top-3 left-3 rounded-md border border-white/20 bg-background/85 px-2 py-1 font-mono text-[10px]">
            0{plan.rank} / 03
          </span>
          {plan.rank === 1 && (
            <span className="absolute top-3 right-3 rounded-md bg-brand px-2 py-1 font-mono text-[10px] text-[#fff8ef]">
              FIRST LOOK
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-4 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <p className="text-[15px] font-medium tracking-[-0.3px]">{plan.title}</p>
            <p className="mt-0.5 font-mono text-[10px] leading-snug text-[var(--preview-muted-foreground)]">
              {plan.garmentMetadataSummary.join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5" role="tablist" aria-label="Ranked looks">
            {plans.map((item, slide) => (
              <button
                key={item.planId}
                type="button"
                role="tab"
                aria-selected={slide === index}
                aria-label={`Show plan ${item.rank}: ${item.title}`}
                className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                  slide === index ? "w-6 bg-brand" : "w-1.5 bg-white/25 hover:bg-white/45"
                }`}
                onClick={() => setIndex(slide)}
              />
            ))}
          </div>
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
    `makeup ${exampleBrief.makeupFinish ? "opt-in · recommendMakeup(brief)" : "skipped"}`,
    `rank   ${plans.map((plan) => `${plan.rank}. ${plan.title}`).join(" · ")}`,
  ];
  const shown = reduced ? lines.length : Math.min(lines.length, 1 + (tick % (lines.length + 1)));

  return (
    <WindowChrome title="rankWearPlans(exampleBrief)">
      <div className="min-h-[200px] p-3 font-mono text-[11px] leading-6 text-[var(--preview-muted-foreground)]">
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
      <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.planId}
            className="overflow-hidden rounded-[var(--mockup-inner-radius)] border bg-[var(--preview-card)]"
            style={{ borderColor: "var(--preview-border)" }}
          >
            <div className="relative h-20 bg-muted">
              <img src={plan.sourceImageUrl} alt="" className="h-full w-full object-cover object-top" />
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
  const example = examplePhotos[tick % examplePhotos.length];

  return (
    <WindowChrome title="Source photo · catalogue reference">
      <div className="flex">
        <div className="min-w-0 flex-1 p-3">
          <div className="relative h-36 overflow-hidden rounded-[var(--mockup-inner-radius)] border border-border bg-muted">
            <img src={plan.sourceImageUrl} alt={`Catalogue reference: ${plan.title}`} className="h-full w-full object-cover object-top" />
            <div className="absolute inset-y-0 left-0 overflow-hidden border-r border-white/70" style={{ width: `${pos}%` }}>
              <img src={example.url} alt={example.alt} className="h-full w-[620px] max-w-none object-cover object-top" />
            </div>
            <div className="absolute top-2 left-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[9px]">EXAMPLE PHOTO</div>
            <div className="absolute top-2 right-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[9px]">CATALOGUE STILL</div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {examplePhotos.map((photo) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.alt}
                className={`block aspect-[3/4] w-full object-contain object-top ${photo.id === example.id ? "ring-1 ring-foreground/40" : "opacity-80"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--preview-muted-foreground)]">
            Live YouCam cloth-v4 runs after you pick a plan. The example set includes a Black woman, a mid-size woman, and a plus-size woman. This slider is that photo against the ranked look’s catalogue image, not a generated result.
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

export function MakeupBoard() {
  return (
    <WindowChrome title="Makeup finish · example brief">
      <div className="p-3 text-left">
        <p className="font-mono text-[10px] tracking-[0.5px] text-[var(--preview-muted-foreground)]">
          Same brief as the outfit · YouCam Look VTO
        </p>
        <p className="mt-3 text-lg font-medium tracking-[-0.4px]">Meeting polish</p>
        <p className="mt-1 font-mono text-[10px] tracking-[0.4px] text-brand-light">Daily</p>
        <ul className="mt-4 space-y-2">
          <li className="text-[11px] leading-snug text-[var(--preview-muted-foreground)]">
            ↗ Business-polished client meeting: a defined lip and a quiet blush, not a night look.
          </li>
          <li className="text-[11px] leading-snug text-[var(--preview-muted-foreground)]">
            ↗ Scored against the same brief as the outfit: business polished, hot and humid.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { name: "Blush", hex: "#C97B84" },
            { name: "Lip", hex: "#C4787A" },
          ].map((swatch) => (
            <span key={swatch.name} className="flex items-center gap-2 font-mono text-[10px] text-[var(--preview-muted-foreground)]">
              <span className="size-3.5 rounded-full border border-white/20" style={{ background: swatch.hex }} />
              {swatch.name} {swatch.hex}
            </span>
          ))}
        </div>
        <p className="mt-5 text-[10px] leading-relaxed text-[var(--preview-muted-foreground)]">
          Opt in on the brief. Anyone can. We do not infer gender from the photo. Virtual makeup is a visualization, not a product match.
        </p>
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
      <div className="p-3 text-left">
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
      <div className="p-3 text-left text-xs leading-relaxed">
        <p className="text-sm font-medium">Your image stays in this session.</p>
        <div className="mt-3 rounded-lg border border-brand/30 border-l-[3px] border-l-brand bg-brand/10 p-3 text-[var(--preview-muted-foreground)]">
          Used only to create a virtual outfit rendering for this session. The same path runs for every body, including plus size. WearWeather does not assess body, health, or worth. Reset deletes the session.
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-[0.4px] text-foreground/70">PHOTO GUIDANCE</p>
        <p className="mt-1 text-[var(--preview-muted-foreground)]">
          One person, facing forward, standing. Face and shoulders visible. JPG or PNG, 10 MB max.
        </p>
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-foreground/20 py-5 text-[var(--preview-muted-foreground)]">
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
  return (
    <div className="relative h-full min-h-[18rem] overflow-hidden rounded-[var(--mockup-shell-radius)] bg-card lg:absolute lg:inset-0 lg:min-h-0">
      <Image src={src} alt={alt} fill className="object-cover object-top" sizes="(min-width: 1024px) 480px, 100vw" />
      <div className="absolute inset-0 bg-background/35" />
      <div className="relative flex h-full items-center justify-center overflow-hidden p-3">
        <div className="h-full w-full max-w-[400px] overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CompareCanvas } from "@/components/compare-canvas";
import { GlowLoad } from "@/components/glow-load";
import { PHOTO_DRAG_TYPE, PhotoStudio } from "@/components/photo-studio";
import { GhostButton, PrimaryButton, RetailerLink } from "@/components/ui";
import type { MakeupPlan } from "@/lib/makeup-engine";
import {
  FORMALITY_LEVELS,
  OUTDOOR_DURATIONS,
  PREFERENCES,
  TEMPERATURE_BANDS,
  WEAR_MOMENTS,
  contextLabels,
  preferenceLabels,
  type AgentSolution,
  type PreferenceId,
  type StudioPhoto,
  type WearContext,
  type WearPlan,
} from "@/lib/types";

export type DashboardProps = {
  mode: "example" | "upload";
  context: WearContext;
  onContext: (next: WearContext) => void;
  photos: StudioPhoto[];
  selectedPhotoId?: string;
  uploadError?: string;
  examplePhotoUrl: string;
  onAddPhotos: (files: FileList | null) => void;
  onSelectPhoto: (id: string) => void;
  onRemovePhoto: (id: string) => void;
  plans: WearPlan[];
  selectedPlan?: WearPlan;
  onSelectPlan: (plan: WearPlan) => void;
  originalUrl: string;
  resultUrl?: string;
  taskError?: string;
  slow: boolean;
  vtoRunning: boolean;
  vtoStartedAt?: number;
  makeupStartedAt?: number;
  onTryOn: () => void;
  onRetry: () => void;
  makeupPlan?: MakeupPlan;
  makeupUrl?: string;
  makeupBusy?: boolean;
  makeupError?: string;
  onTryMakeup: () => void;
  errorMessages: Record<string, string>;
  solutions: AgentSolution[];
  onAcceptSolution: (solution: AgentSolution) => void;
  onDismissSolution: (id: string) => void;
};

const chipFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function Chip<T extends string>({
  value,
  options,
  labels,
  onChange,
}: {
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`min-h-10 rounded-full border px-3 py-2 text-xs ${chipFocus} ${
            value === option ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          }`}
          onClick={() => onChange(option)}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}

function dayLine(context: WearContext) {
  const bits = [
    contextLabels.wearMoment[context.wearMoment],
    contextLabels.temperatureBand[context.temperatureBand],
    contextLabels.outdoorDuration[context.outdoorDuration],
    contextLabels.formality[context.formality],
    ...context.preferences.map((id) => preferenceLabels[id]),
  ];
  return bits.join(" · ");
}

function StepRail({
  photoReady,
  lookReady,
  onYou,
}: {
  photoReady: boolean;
  lookReady: boolean;
  onYou: boolean;
}) {
  const current = !photoReady ? 1 : onYou ? 4 : lookReady ? 4 : 3;
  const steps = [
    { n: 1, label: "Photo", href: "#step-photo", done: photoReady },
    { n: 2, label: "Day", href: "#step-day", done: photoReady },
    { n: 3, label: "Look", href: "#step-look", done: lookReady },
    { n: 4, label: "On you", href: "#step-you", done: onYou },
  ];

  return (
    <ol className="flex flex-wrap items-center gap-1 sm:gap-2" aria-label="How to use the studio">
      {steps.map((step, index) => {
        const active = step.n === current;
        return (
          <li key={step.n} className="flex items-center gap-1 sm:gap-2">
            {index > 0 && <span className="text-muted-foreground/50" aria-hidden>/</span>}
            <a
              href={step.href}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-2.5 text-xs sm:text-sm ${chipFocus} ${
                active ? "bg-foreground text-background" : step.done ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className="font-mono text-[10px] tracking-[0.12em]">{String(step.n).padStart(2, "0")}</span>
              {step.label}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

function LookPicker({
  plans,
  selectedPlan,
  solutions,
  onSelectPlan,
  onAcceptSolution,
  onDismissSolution,
}: {
  plans: WearPlan[];
  selectedPlan?: WearPlan;
  solutions: AgentSolution[];
  onSelectPlan: (plan: WearPlan) => void;
  onAcceptSolution: (solution: AgentSolution) => void;
  onDismissSolution: (id: string) => void;
}) {
  const openSolutions = solutions.filter((item) => item.status === "open");
  const solutionFor = (lookId: string) => openSolutions.find((item) => item.plan.lookId === lookId);

  return (
    <section id="step-look" className="scroll-mt-20">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">03 LOOK</p>
          <h2 className="mt-1 text-lg font-medium tracking-[-0.3px]">
            {openSolutions.length ? "Stylist picks. Accept one to try it on." : "Pick a look."}
          </h2>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {plans.map((plan) => {
          const active = selectedPlan?.lookId === plan.lookId;
          const solution = solutionFor(plan.lookId);
          return (
            <button
              key={plan.lookId}
              type="button"
              onClick={() => onSelectPlan(plan)}
              className={`rounded-2xl border bg-card p-2 text-left ${chipFocus} ${
                active ? "border-foreground/40 ring-2 ring-foreground/15" : "border-border hover:border-foreground/25"
              }`}
              aria-pressed={active}
            >
              <img src={plan.sourceImageUrl} alt="" className="mx-auto block h-auto max-h-40 w-full object-contain object-top sm:max-h-52" />
              <p className="mt-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">0{plan.rank}</p>
              <p className="mt-0.5 text-xs font-medium leading-snug sm:text-sm">{plan.title}</p>
              {solution && <p className="mt-1 text-[11px] text-brand">Stylist pick</p>}
            </button>
          );
        })}
      </div>
      {selectedPlan && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm leading-relaxed">{selectedPlan.reasons[0]}</p>
          {openSolutions.find((item) => item.plan.lookId === selectedPlan.lookId)?.note && (
            <p className="mt-2 text-sm text-muted-foreground">
              {openSolutions.find((item) => item.plan.lookId === selectedPlan.lookId)?.note}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(() => {
              const solution = solutionFor(selectedPlan.lookId);
              if (solution) {
                return (
                  <>
                    <PrimaryButton className="min-h-10 px-4 py-2 text-xs" onClick={() => onAcceptSolution(solution)}>
                      Accept and try on
                    </PrimaryButton>
                    <GhostButton className="min-h-10 px-4 py-2 text-xs" onClick={() => onDismissSolution(solution.id)}>
                      Not this
                    </GhostButton>
                  </>
                );
              }
              return <RetailerLink href={selectedPlan.productUrl} compact />;
            })()}
          </div>
        </div>
      )}
    </section>
  );
}

function TryOnStage(dash: DashboardProps) {
  const [compare, setCompare] = useState(46);
  const [over, setOver] = useState(false);
  const showingMakeup = Boolean(dash.makeupUrl);
  const leftSrc = showingMakeup ? dash.resultUrl || dash.originalUrl : dash.originalUrl;
  const rightSrc = showingMakeup ? dash.makeupUrl || dash.resultUrl || dash.originalUrl : dash.resultUrl || dash.originalUrl;
  const status = dash.taskError ? "error" : dash.vtoRunning ? "running" : dash.resultUrl ? "done" : "idle";

  return (
    <section id="step-you" className="scroll-mt-20">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">04 ON YOU</p>
      <h2 className="mt-1 text-lg font-medium tracking-[-0.3px]">See it on this photo.</h2>
      <div
        className={`mt-4 overflow-hidden rounded-2xl border bg-[#ecece4] ${over ? "border-foreground" : "border-border"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          const photoId = event.dataTransfer.getData(PHOTO_DRAG_TYPE);
          if (photoId) dash.onSelectPhoto(photoId);
          else if (event.dataTransfer.files?.length) dash.onAddPhotos(event.dataTransfer.files);
        }}
      >
        {status === "running" && <GlowLoad active startedAt={dash.vtoStartedAt} label="RENDERING" />}
        {status !== "running" && dash.makeupBusy && <GlowLoad active startedAt={dash.makeupStartedAt} label="MAKEUP" />}
        {status === "error" && (
          <div className="p-8 text-center">
            <p className="text-sm font-medium">Needs another take</p>
            <p className="mt-2 text-sm text-muted-foreground">{dash.errorMessages[dash.taskError || ""] || dash.errorMessages.UNEXPECTED_ERROR}</p>
            <PrimaryButton className="mt-4" onClick={dash.onRetry}>
              Try again
            </PrimaryButton>
          </div>
        )}
        {status === "done" && dash.resultUrl && !dash.makeupBusy && (
          <CompareCanvas
            leftSrc={leftSrc}
            rightSrc={rightSrc}
            position={compare}
            leftLabel={showingMakeup ? "OUTFIT" : "YOUR PHOTO"}
            rightLabel={showingMakeup ? "OUTFIT + MAKEUP" : "TRY-ON"}
            onPosition={setCompare}
            className="w-full"
          />
        )}
        {status === "idle" &&
          (dash.originalUrl ? (
            <img src={dash.originalUrl} alt="Photo that will be dressed" className="mx-auto block h-auto max-h-[28rem] w-full object-contain object-top" />
          ) : (
            <div className="px-6 py-20 text-center">
              <p className="text-sm font-medium">No photo yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Add one in step 1. One person, facing forward, face and shoulders in frame.</p>
            </div>
          ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PrimaryButton disabled={!dash.selectedPlan || dash.vtoRunning || !dash.originalUrl} onClick={dash.onTryOn}>
          {!dash.originalUrl
            ? "Add a photo first"
            : dash.vtoRunning
              ? "Dressing this photo…"
              : dash.selectedPlan
                ? `Try ${dash.selectedPlan.title} on me`
                : "Pick a look first"}
        </PrimaryButton>
        {dash.resultUrl && (dash.context.makeupFinish || dash.context.makeupPrompt.trim()) && (
          <GhostButton disabled={dash.makeupBusy} onClick={dash.onTryMakeup}>
            {dash.makeupBusy ? "Applying makeup…" : "Try makeup on me"}
          </GhostButton>
        )}
      </div>
      {dash.slow && dash.vtoRunning && <p className="mt-2 text-xs text-muted-foreground">Still rendering. You can wait here.</p>}
      {dash.makeupError && <p className="mt-2 text-xs text-[#c43b3e]">{dash.errorMessages[dash.makeupError] || dash.errorMessages.UNEXPECTED_ERROR}</p>}
    </section>
  );
}

export function CanvasDashboard(dash: DashboardProps) {
  const [briefOpen, setBriefOpen] = useState(false);
  const photoReady = Boolean(dash.originalUrl);
  const lookReady = Boolean(dash.selectedPlan);
  const onYou = Boolean(dash.resultUrl);
  const nextCopy = !photoReady
    ? "Start here: add a photo, or keep the example."
    : dash.vtoRunning
      ? "YouCam is dressing this photo."
      : dash.taskError
        ? "Try-on missed. Retry, or pick another look."
        : dash.resultUrl
          ? "Drag the slider to compare. Makeup is optional."
          : "Pick a look, then try it on this photo. Ask the stylist if you want ranked picks.";

  useEffect(() => {
    if (!dash.solutions.some((item) => item.status === "open")) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("step-look")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [dash.solutions]);

  return (
    <div className="min-h-[calc(100svh-3.5rem)] bg-background pb-28">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-8">
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">STUDIO</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl tracking-[-0.8px] text-foreground sm:text-4xl">See the look. Plan the wear.</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{nextCopy}</p>
          </div>
          <StepRail photoReady={photoReady} lookReady={lookReady} onYou={onYou} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-8 lg:sticky lg:top-20">
            <section id="step-photo" className="scroll-mt-20">
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">01 PHOTO</p>
              <h2 className="mt-1 text-lg font-medium tracking-[-0.3px]">Who gets dressed.</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {dash.mode === "example" && dash.photos.length === 0
                  ? "Example photo is in use. Add yours to dress yourself."
                  : "One person, facing forward, whole face and shoulders visible."}
              </p>
              <div className="mt-3">
                <PhotoStudio
                  photos={dash.photos}
                  selectedId={dash.selectedPhotoId}
                  error={dash.uploadError}
                  examplePhotoUrl={dash.mode === "example" ? dash.examplePhotoUrl : undefined}
                  onAdd={dash.onAddPhotos}
                  onSelect={dash.onSelectPhoto}
                  onRemove={dash.onRemovePhoto}
                />
              </div>
            </section>

            <section id="step-day" className="scroll-mt-20">
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">02 DAY</p>
              <h2 className="mt-1 text-lg font-medium tracking-[-0.3px]">The day you actually have.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dayLine(dash.context)}</p>
              <GhostButton className="mt-3 min-h-10 px-4 py-2 text-xs" onClick={() => setBriefOpen((value) => !value)} aria-expanded={briefOpen}>
                {briefOpen ? "Hide day controls" : "Edit day"}
              </GhostButton>
              {briefOpen && (
                <div className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium">Fashion you want</span>
                    <textarea
                      value={dash.context.lookPrompt}
                      maxLength={280}
                      rows={2}
                      placeholder="Street tailoring, quiet luxury blazer, navy suit"
                      className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => dash.onContext({ ...dash.context, lookPrompt: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium">Makeup you want (optional)</span>
                    <textarea
                      value={dash.context.makeupPrompt}
                      maxLength={280}
                      rows={2}
                      placeholder="Soft glam, smoky eye, red lip"
                      className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => {
                        const makeupPrompt = event.target.value;
                        dash.onContext({
                          ...dash.context,
                          makeupPrompt,
                          makeupFinish: makeupPrompt.trim() ? true : dash.context.makeupFinish,
                        });
                      }}
                    />
                  </label>
                  <div>
                    <p className="mb-1.5 text-xs font-medium">Day</p>
                    <Chip value={dash.context.wearMoment} options={WEAR_MOMENTS} labels={contextLabels.wearMoment} onChange={(wearMoment) => dash.onContext({ ...dash.context, wearMoment })} />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium">Outside</p>
                    <Chip
                      value={dash.context.temperatureBand}
                      options={TEMPERATURE_BANDS}
                      labels={contextLabels.temperatureBand}
                      onChange={(temperatureBand) => dash.onContext({ ...dash.context, temperatureBand })}
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium">Commute</p>
                    <Chip
                      value={dash.context.outdoorDuration}
                      options={OUTDOOR_DURATIONS}
                      labels={contextLabels.outdoorDuration}
                      onChange={(outdoorDuration) => dash.onContext({ ...dash.context, outdoorDuration })}
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium">Polish</p>
                    <Chip value={dash.context.formality} options={FORMALITY_LEVELS} labels={contextLabels.formality} onChange={(formality) => dash.onContext({ ...dash.context, formality })} />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium">Priorities, up to three</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PREFERENCES.map((id) => {
                        const on = dash.context.preferences.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            className={`min-h-10 rounded-full border px-3 py-2 text-xs ${chipFocus} ${
                              on ? "border-brand bg-brand text-[#fff8ef]" : "border-border text-muted-foreground"
                            }`}
                            onClick={() => {
                              const preferences = on
                                ? dash.context.preferences.filter((item) => item !== id)
                                : dash.context.preferences.length < 3
                                  ? [...dash.context.preferences, id]
                                  : dash.context.preferences;
                              dash.onContext({ ...dash.context, preferences });
                            }}
                          >
                            {preferenceLabels[id as PreferenceId]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </aside>

          <div className="space-y-10">
            <LookPicker
              plans={dash.plans}
              selectedPlan={dash.selectedPlan}
              solutions={dash.solutions}
              onSelectPlan={dash.onSelectPlan}
              onAcceptSolution={dash.onAcceptSolution}
              onDismissSolution={dash.onDismissSolution}
            />
            <TryOnStage {...dash} />
          </div>
        </div>
      </div>
    </div>
  );
}

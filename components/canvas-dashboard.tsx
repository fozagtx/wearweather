"use client";

import { useState } from "react";
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
  makeupPlans?: MakeupPlan[];
  onSelectMakeup?: (plan: MakeupPlan) => void;
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
  onSelectPlan,
}: {
  plans: WearPlan[];
  selectedPlan?: WearPlan;
  onSelectPlan: (plan: WearPlan) => void;
}) {
  return (
    <section id="step-look" className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
        {plans.map((plan) => {
          const active = selectedPlan?.lookId === plan.lookId;
          return (
            <button
              key={plan.lookId}
              type="button"
              onClick={() => onSelectPlan(plan)}
              className={`flex min-h-0 flex-col rounded-2xl border bg-card p-2 text-left ${chipFocus} ${
                active ? "border-foreground/40 ring-2 ring-foreground/15" : "border-border hover:border-foreground/25"
              }`}
              aria-pressed={active}
            >
              <div className="min-h-40 flex-1 bg-[#ecece4] lg:min-h-0">
                <img src={plan.sourceImageUrl} alt="" className="mx-auto block h-full w-full object-contain object-top" />
              </div>
              <p className="mt-2 text-sm font-medium leading-snug">{plan.title}</p>
            </button>
          );
        })}
      </div>
      {selectedPlan && (
        <div className="mt-3 shrink-0">
          <p className="text-sm leading-relaxed">{selectedPlan.reasons[0]}</p>
          <div className="mt-2">
            <RetailerLink href={selectedPlan.productUrl} compact />
          </div>
        </div>
      )}
    </section>
  );
}

function MakeupPicker({
  plans,
  selected,
  onSelect,
}: {
  plans: MakeupPlan[];
  selected?: MakeupPlan;
  onSelect: (plan: MakeupPlan) => void;
}) {
  if (!plans.length) return null;
  return (
    <div className="mt-3 grid shrink-0 grid-cols-3 gap-2">
      {plans.map((plan, index) => {
        const active = selected?.templateId === plan.templateId && selected.title === plan.title;
        return (
          <button
            key={`${plan.templateId}-${plan.title}-${index}`}
            type="button"
            onClick={() => onSelect(plan)}
            className={`rounded-2xl border bg-card p-2 text-left ${chipFocus} ${
              active ? "border-foreground/40 ring-2 ring-foreground/15" : "border-border hover:border-foreground/25"
            }`}
            aria-pressed={active}
          >
            {plan.thumb ? (
              <img src={plan.thumb} alt="" className="mx-auto block h-20 w-full object-contain object-top" />
            ) : (
              <div className="flex h-20 items-end justify-center gap-1 bg-[#ecece4] pb-3">
                {plan.swatches.map((swatch) => (
                  <span key={swatch.name} className="size-5 rounded-full border border-border" style={{ background: swatch.hex }} />
                ))}
              </div>
            )}
            <p className="mt-2 text-sm font-medium leading-snug">{plan.title}</p>
          </button>
        );
      })}
    </div>
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
    <section id="step-you" className="flex min-h-0 flex-col">
      <div
        className={`flex min-h-64 flex-1 flex-col overflow-hidden rounded-2xl border bg-[#ecece4] lg:min-h-0 ${over ? "border-foreground" : "border-border"}`}
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
        {status === "running" && <GlowLoad active className="min-h-0 flex-1" startedAt={dash.vtoStartedAt} label="RENDERING" />}
        {status !== "running" && dash.makeupBusy && <GlowLoad active className="min-h-0 flex-1" startedAt={dash.makeupStartedAt} label="MAKEUP" />}
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
            className="h-full w-full min-h-0"
          />
        )}
        {status === "idle" &&
          (dash.originalUrl ? (
            <img src={dash.originalUrl} alt="Photo that will be dressed" className="mx-auto block h-full w-full object-contain object-top" />
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <p className="text-sm text-muted-foreground">Add a photo</p>
            </div>
          ))}
      </div>
      <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2">
        <PrimaryButton disabled={!dash.selectedPlan || dash.vtoRunning || !dash.originalUrl} onClick={dash.onTryOn}>
          {!dash.originalUrl
            ? "Add a photo first"
            : dash.vtoRunning
              ? "Dressing this photo…"
              : dash.selectedPlan
                ? `Try on`
                : "Pick a look first"}
        </PrimaryButton>
        {dash.resultUrl && dash.makeupPlan && (
          <GhostButton disabled={dash.makeupBusy} onClick={dash.onTryMakeup}>
            {dash.makeupBusy ? "Applying makeup…" : "Try makeup"}
          </GhostButton>
        )}
      </div>
      {dash.makeupError && <p className="mt-2 text-xs text-[#c43b3e]">{dash.errorMessages[dash.makeupError] || dash.errorMessages.UNEXPECTED_ERROR}</p>}
    </section>
  );
}

export function CanvasDashboard(dash: DashboardProps) {
  const [briefOpen, setBriefOpen] = useState(false);
  const photoReady = Boolean(dash.originalUrl);
  const lookReady = Boolean(dash.selectedPlan);
  const onYou = Boolean(dash.resultUrl);

  return (
    <div className="bg-background lg:h-[calc(100svh-3.5rem)] lg:overflow-hidden">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col px-4 pt-3 pb-28 sm:px-5">
        <header className="flex shrink-0 justify-end">
          <StepRail photoReady={photoReady} lookReady={lookReady} onYou={onYou} />
        </header>

        <div className="mt-3 grid min-h-0 flex-1 gap-4 lg:grid-cols-[15rem_minmax(0,1.15fr)_minmax(0,0.95fr)] lg:grid-rows-[minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col gap-4 lg:overflow-auto">
            <section id="step-photo" className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col">
                <PhotoStudio
                  compact
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

            <section id="step-day" className="shrink-0">
              <p className="text-sm leading-relaxed text-muted-foreground">{dayLine(dash.context)}</p>
              <GhostButton className="mt-2 min-h-10 px-4 py-2 text-xs" onClick={() => setBriefOpen((value) => !value)} aria-expanded={briefOpen}>
                {briefOpen ? "Hide day" : "Edit day"}
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

          <div className="flex min-h-0 flex-1 flex-col">
            <LookPicker plans={dash.plans} selectedPlan={dash.selectedPlan} onSelectPlan={dash.onSelectPlan} />
            <MakeupPicker plans={dash.makeupPlans || []} selected={dash.makeupPlan} onSelect={(plan) => dash.onSelectMakeup?.(plan)} />
          </div>
          <TryOnStage {...dash} />
        </div>
      </div>
    </div>
  );
}

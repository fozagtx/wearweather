"use client";

import { useState } from "react";
import { CompareCanvas } from "@/components/compare-canvas";
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

function Card({
  kicker,
  title,
  hint,
  selected = false,
  children,
}: {
  kicker: string;
  title: string;
  hint?: string;
  selected?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`flex w-full max-w-[320px] flex-col rounded-2xl border bg-card p-4 shadow-[0_8px_28px_rgba(26,26,20,0.06)] ${
        selected ? "border-foreground/35" : "border-border"
      }`}
    >
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">{kicker}</p>
      <h2 className="mt-1 text-base font-medium tracking-[-0.3px]">{title}</h2>
      {hint && <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </article>
  );
}

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
          className={`rounded-full border px-2.5 py-1.5 text-[11px] ${
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

function LookCard({
  plan,
  active,
  onSelect,
}: {
  plan: WearPlan;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Card kicker={`LOOK 0${plan.rank}`} title={plan.title} selected={active}>
      <img src={plan.sourceImageUrl} alt="" className="mx-auto block h-auto max-h-64 w-full object-contain object-top" />
      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{plan.reasons[0]}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PrimaryButton className="min-h-9 px-3 py-2 text-xs" onClick={onSelect}>
          {active ? "This look" : "Use this look"}
        </PrimaryButton>
        <RetailerLink href={plan.productUrl} compact />
      </div>
    </Card>
  );
}

function TryOnCard(dash: DashboardProps) {
  const [compare, setCompare] = useState(46);
  const [over, setOver] = useState(false);
  const showingMakeup = Boolean(dash.makeupUrl);
  const leftSrc = showingMakeup ? dash.resultUrl || dash.originalUrl : dash.originalUrl;
  const rightSrc = showingMakeup ? dash.makeupUrl || dash.resultUrl || dash.originalUrl : dash.resultUrl || dash.originalUrl;
  const status = dash.taskError ? "error" : dash.vtoRunning ? "running" : dash.resultUrl ? "done" : "idle";
  const hint = !dash.originalUrl
    ? "Add a photo first."
    : dash.vtoRunning
      ? "YouCam is dressing this photo."
      : dash.resultUrl
        ? "Drag the slider to compare."
        : dash.selectedPlan
          ? `Ready: ${dash.selectedPlan.title}.`
          : "Pick a look, then try it on.";

  return (
    <Card kicker="TRY-ON" title="On you" hint={hint} selected={Boolean(dash.resultUrl)}>
      <div
        className={`rounded-xl border bg-[#ecece4] ${over ? "border-foreground" : "border-border"}`}
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
        {status === "running" && (
          <div className="p-6 text-center">
            <p className="text-sm font-medium">Rendering on your photo</p>
            <p className="mt-2 text-[12px] text-muted-foreground">This can take up to two minutes.</p>
          </div>
        )}
        {status === "error" && (
          <div className="p-6 text-center">
            <p className="text-sm font-medium">Needs another take</p>
            <p className="mt-2 text-[12px] text-muted-foreground">{dash.errorMessages[dash.taskError || ""] || dash.errorMessages.UNEXPECTED_ERROR}</p>
            <PrimaryButton className="mt-3" onClick={dash.onRetry}>
              Try again
            </PrimaryButton>
          </div>
        )}
        {status === "done" && dash.resultUrl && (
          <CompareCanvas
            leftSrc={leftSrc}
            rightSrc={rightSrc}
            position={compare}
            leftLabel={showingMakeup ? "OUTFIT" : "YOUR PHOTO"}
            rightLabel={showingMakeup ? "OUTFIT + MAKEUP" : "RENDERING"}
            onPosition={setCompare}
            className="w-full"
          />
        )}
        {status === "idle" &&
          (dash.originalUrl ? (
            <img src={dash.originalUrl} alt="Photo that will be dressed" className="mx-auto block h-auto max-h-72 w-full object-contain object-top" />
          ) : (
            <p className="px-4 py-16 text-center text-[12px] text-muted-foreground">Drop a photo here.</p>
          ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PrimaryButton disabled={!dash.selectedPlan || dash.vtoRunning || !dash.originalUrl} onClick={dash.onTryOn}>
          {dash.vtoRunning ? "Rendering…" : "Try this look on me"}
        </PrimaryButton>
        {dash.resultUrl && (dash.context.makeupFinish || dash.context.makeupPrompt.trim()) && (
          <GhostButton disabled={dash.makeupBusy} onClick={dash.onTryMakeup}>
            {dash.makeupBusy ? "Applying makeup…" : "Try this makeup on me"}
          </GhostButton>
        )}
      </div>
      {dash.makeupError && <p className="mt-2 text-xs text-[#c43b3e]">{dash.errorMessages[dash.makeupError] || dash.errorMessages.UNEXPECTED_ERROR}</p>}
    </Card>
  );
}

export function CanvasDashboard(dash: DashboardProps) {
  const openSolutions = dash.solutions.filter((item) => item.status === "open");
  const { context, onContext } = dash;

  return (
    <div className="min-h-[calc(100svh-3.5rem)] bg-background pb-32">
      <div className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        <p className="text-center text-[13px] font-medium tracking-[-0.2px] text-muted-foreground">WearWeather</p>
        <h1 className="mt-2 text-center text-3xl tracking-[-0.8px] text-foreground sm:text-4xl">See the look. Plan the wear.</h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
          Pick a photo and a look. Ask the stylist below. Accept a card to try it on.
        </p>

        {openSolutions.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-5">
            {openSolutions.map((solution) => (
              <Card key={solution.id} kicker="STYLIST" title={solution.plan.title}>
                <img src={solution.plan.sourceImageUrl} alt="" className="mx-auto block h-auto max-h-64 w-full object-contain object-top" />
                <p className="mt-3 text-[12px] leading-relaxed">{solution.note}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{solution.plan.reasons[0]}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PrimaryButton className="min-h-9 px-3 py-2 text-xs" onClick={() => dash.onAcceptSolution(solution)}>
                    Accept and try on
                  </PrimaryButton>
                  <GhostButton className="min-h-9 px-3 py-2 text-xs" onClick={() => dash.onDismissSolution(solution.id)}>
                    Not this
                  </GhostButton>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-5">
          <Card kicker="PHOTO" title="Your photo" hint="This is the person YouCam will dress.">
            <PhotoStudio
              photos={dash.photos}
              selectedId={dash.selectedPhotoId}
              error={dash.uploadError}
              examplePhotoUrl={dash.examplePhotoUrl}
              onAdd={dash.onAddPhotos}
              onSelect={dash.onSelectPhoto}
              onRemove={dash.onRemovePhoto}
            />
          </Card>
          {dash.plans.map((plan) => (
            <LookCard
              key={plan.lookId}
              plan={plan}
              active={dash.selectedPlan?.lookId === plan.lookId}
              onSelect={() => dash.onSelectPlan(plan)}
            />
          ))}
          <TryOnCard {...dash} />
        </div>

        <article className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-[0_8px_28px_rgba(26,26,20,0.06)]">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">BRIEF</p>
          <h2 className="mt-1 text-base font-medium tracking-[-0.3px]">The day you actually have</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[12px] font-medium">Fashion you want</span>
              <textarea
                value={context.lookPrompt}
                maxLength={280}
                rows={2}
                placeholder="Street tailoring, quiet luxury blazer, navy suit..."
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => onContext({ ...context, lookPrompt: event.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[12px] font-medium">Makeup you want</span>
              <textarea
                value={context.makeupPrompt}
                maxLength={280}
                rows={2}
                placeholder="Soft glam, smoky eye, red lip, glass skin..."
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => {
                  const makeupPrompt = event.target.value;
                  onContext({ ...context, makeupPrompt, makeupFinish: makeupPrompt.trim() ? true : context.makeupFinish });
                }}
              />
            </label>
            <div>
              <p className="mb-1.5 text-[12px] font-medium">Day</p>
              <Chip value={context.wearMoment} options={WEAR_MOMENTS} labels={contextLabels.wearMoment} onChange={(wearMoment) => onContext({ ...context, wearMoment })} />
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-medium">Outside</p>
              <Chip value={context.temperatureBand} options={TEMPERATURE_BANDS} labels={contextLabels.temperatureBand} onChange={(temperatureBand) => onContext({ ...context, temperatureBand })} />
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-medium">Commute</p>
              <Chip value={context.outdoorDuration} options={OUTDOOR_DURATIONS} labels={contextLabels.outdoorDuration} onChange={(outdoorDuration) => onContext({ ...context, outdoorDuration })} />
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-medium">Polish</p>
              <Chip value={context.formality} options={FORMALITY_LEVELS} labels={contextLabels.formality} onChange={(formality) => onContext({ ...context, formality })} />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[12px] font-medium">Priorities</p>
              <div className="flex flex-wrap gap-1.5">
                {PREFERENCES.map((id) => {
                  const on = context.preferences.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`rounded-full border px-2.5 py-1.5 text-[11px] ${on ? "border-brand bg-brand text-[#fff8ef]" : "border-border text-muted-foreground"}`}
                      onClick={() => {
                        const preferences = on
                          ? context.preferences.filter((item) => item !== id)
                          : context.preferences.length < 3
                            ? [...context.preferences, id]
                            : context.preferences;
                        onContext({ ...context, preferences });
                      }}
                    >
                      {preferenceLabels[id as PreferenceId]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

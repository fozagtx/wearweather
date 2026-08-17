"use client";

import { useState } from "react";
import { CompareCanvas } from "@/components/compare-canvas";
import { GlowLoad } from "@/components/glow-load";
import { Look360 } from "@/components/look-360";
import { PHOTO_DRAG_TYPE, PhotoStudio } from "@/components/photo-studio";
import { PromptInput, PromptInputActions, PromptInputTextarea } from "@/components/prompt-kit/prompt-input";
import { SystemMessage } from "@/components/prompt-kit/system-message";
import { Button } from "@/components/ui/button";
import { GhostButton, PrimaryButton, RetailerLink } from "@/components/ui";
import type { HairPlan } from "@/lib/hair-engine";
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
  hairPlan?: HairPlan;
  hairPlans?: HairPlan[];
  onSelectHair?: (plan: HairPlan) => void;
  hairUrl?: string;
  hairBusy?: boolean;
  hairError?: string;
  hairStartedAt?: number;
  onTryHair: () => void;
  editUrl?: string;
  editBeforeUrl?: string;
  editBusy?: boolean;
  editError?: string;
  editStartedAt?: number;
  onEditLook: (prompt: string) => void;
  orbitFrames?: string[];
  orbitBusy?: boolean;
  viewMode?: "compare" | "spin";
  onViewMode?: (mode: "compare" | "spin") => void;
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
  const real = plans.filter((plan) => plan.templateId);
  if (!real.length) return null;
  const seenThumbs = new Set<string>();
  return (
    <div className="mt-3 grid shrink-0 grid-cols-3 gap-2">
      {real.map((plan, index) => {
        const active = selected?.templateId === plan.templateId && selected.title === plan.title;
        const thumb = plan.thumb && !seenThumbs.has(plan.thumb) ? plan.thumb : undefined;
        if (plan.thumb) seenThumbs.add(plan.thumb);
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
            {thumb ? (
              <img src={thumb} alt="" className="mx-auto block h-20 w-full object-contain object-top" />
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

function HairPicker({
  plans,
  selected,
  onSelect,
}: {
  plans: HairPlan[];
  selected?: HairPlan;
  onSelect: (plan: HairPlan) => void;
}) {
  const real = plans.filter((plan) => plan.templateId);
  if (!real.length) return null;
  const seenThumbs = new Set<string>();
  return (
    <div className="mt-3 grid shrink-0 grid-cols-3 gap-2">
      {real.map((plan, index) => {
        const active = selected?.templateId === plan.templateId && selected.title === plan.title;
        const thumb = plan.thumb && !seenThumbs.has(plan.thumb) ? plan.thumb : undefined;
        if (plan.thumb) seenThumbs.add(plan.thumb);
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
            {thumb ? (
              <img src={thumb} alt="" className="mx-auto block h-20 w-full object-contain object-top" />
            ) : (
              <div className="h-20 bg-[#ecece4]" />
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
  const [editDraft, setEditDraft] = useState("");
  const showingEdit = Boolean(dash.editUrl);
  const showingHair = Boolean(dash.hairUrl) && !showingEdit;
  const showingMakeup = Boolean(dash.makeupUrl) && !showingHair && !showingEdit;
  const leftSrc = showingEdit
    ? dash.editBeforeUrl || dash.hairUrl || dash.makeupUrl || dash.resultUrl || dash.originalUrl
    : showingHair
      ? dash.makeupUrl || dash.resultUrl || dash.originalUrl
      : showingMakeup
        ? dash.resultUrl || dash.originalUrl
        : dash.originalUrl;
  const rightSrc = showingEdit
    ? dash.editUrl || dash.hairUrl || dash.makeupUrl || dash.resultUrl || dash.originalUrl
    : showingHair
      ? dash.hairUrl || dash.makeupUrl || dash.resultUrl || dash.originalUrl
      : showingMakeup
        ? dash.makeupUrl || dash.resultUrl || dash.originalUrl
        : dash.resultUrl || dash.originalUrl;
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
        {status !== "running" && !dash.makeupBusy && dash.hairBusy && <GlowLoad active className="min-h-0 flex-1" startedAt={dash.hairStartedAt} label="HAIR" />}
        {status !== "running" && !dash.makeupBusy && !dash.hairBusy && dash.editBusy && <GlowLoad active className="min-h-0 flex-1" startedAt={dash.editStartedAt} label="EDIT" />}
        {status === "error" && (
          <div className="grid flex-1 place-items-center p-6">
            <SystemMessage
              className="max-w-md"
              variant="error"
              fill
              cta={{ label: "Try again", onClick: dash.onRetry, variant: "solid" }}
            >
              {dash.errorMessages[dash.taskError || ""] || dash.errorMessages.UNEXPECTED_ERROR}
            </SystemMessage>
          </div>
        )}
        {status === "done" && dash.resultUrl && !dash.makeupBusy && !dash.hairBusy && !dash.editBusy && dash.viewMode === "spin" && dash.orbitFrames && dash.orbitFrames.length > 1 && (
          <Look360 frames={dash.orbitFrames} className="h-full min-h-0 w-full" />
        )}
        {status === "done" && dash.resultUrl && !dash.makeupBusy && !dash.hairBusy && !dash.editBusy && !(dash.viewMode === "spin" && dash.orbitFrames && dash.orbitFrames.length > 1) && (
          <CompareCanvas
            leftSrc={leftSrc}
            rightSrc={rightSrc}
            position={compare}
            leftLabel={showingEdit ? "BEFORE" : showingHair ? (dash.makeupUrl ? "OUTFIT + MAKEUP" : "OUTFIT") : showingMakeup ? "OUTFIT" : "YOUR PHOTO"}
            rightLabel={showingEdit ? "EDIT" : showingHair ? "+ HAIR" : showingMakeup ? "OUTFIT + MAKEUP" : "TRY-ON"}
            onPosition={setCompare}
            className="h-full w-full min-h-0"
          />
        )}
        {status === "idle" && (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            {!dash.originalUrl && <p className="text-sm text-muted-foreground">Add a photo</p>}
          </div>
        )}
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
          <GhostButton disabled={dash.makeupBusy || dash.hairBusy} onClick={dash.onTryMakeup}>
            {dash.makeupBusy ? "Applying makeup…" : "Try makeup"}
          </GhostButton>
        )}
        {dash.resultUrl && dash.hairPlan?.templateId && (
          <GhostButton disabled={dash.hairBusy || dash.makeupBusy} onClick={dash.onTryHair}>
            {dash.hairBusy ? "Applying hair…" : "Try hair"}
          </GhostButton>
        )}
        {dash.orbitFrames && dash.orbitFrames.length > 1 && (
          <GhostButton onClick={() => dash.onViewMode?.(dash.viewMode === "spin" ? "compare" : "spin")}>
            {dash.viewMode === "spin" ? "Compare" : "360"}
          </GhostButton>
        )}
        {dash.orbitBusy && !dash.orbitFrames && (
          <span className="font-mono text-[11px] tracking-[0.12em] text-brand" aria-live="polite">
            360
          </span>
        )}
      </div>
      {dash.resultUrl && (
        <PromptInput
          className="mt-3 shrink-0 rounded-2xl"
          value={editDraft}
          onValueChange={setEditDraft}
          isLoading={dash.editBusy}
          disabled={dash.editBusy}
          maxHeight={88}
          onSubmit={() => {
            const prompt = editDraft.trim();
            if (!prompt || dash.editBusy) return;
            dash.onEditLook(prompt);
            setEditDraft("");
          }}
        >
          <label className="sr-only" htmlFor="edit-look">
            Edit the clothes
          </label>
          <PromptInputTextarea id="edit-look" maxLength={400} placeholder="Shorter hem, linen, navy jacket" />
          <PromptInputActions>
            <Button
              size="sm"
              variant="outline"
              disabled={dash.editBusy || !editDraft.trim()}
              onClick={() => {
                const prompt = editDraft.trim();
                if (!prompt || dash.editBusy) return;
                dash.onEditLook(prompt);
                setEditDraft("");
              }}
            >
              {dash.editBusy ? "Editing…" : "Edit"}
            </Button>
          </PromptInputActions>
        </PromptInput>
      )}
      {dash.makeupError && (
        <SystemMessage className="mt-2" variant="error" fill>
          {dash.errorMessages[dash.makeupError] || dash.errorMessages.UNEXPECTED_ERROR}
        </SystemMessage>
      )}
      {dash.hairError && (
        <SystemMessage className="mt-2" variant="error" fill>
          {dash.errorMessages[dash.hairError] || dash.errorMessages.UNEXPECTED_ERROR}
        </SystemMessage>
      )}
      {dash.editError && (
        <SystemMessage className="mt-2" variant="error" fill>
          {dash.errorMessages[dash.editError] || dash.errorMessages.UNEXPECTED_ERROR}
        </SystemMessage>
      )}
    </section>
  );
}

export function CanvasDashboard(dash: DashboardProps) {
  const [briefOpen, setBriefOpen] = useState(false);
  const photoReady = Boolean(dash.originalUrl);
  const lookReady = Boolean(dash.selectedPlan);
  const onYou = Boolean(dash.resultUrl);

  return (
    <div className="bg-background lg:h-full lg:overflow-hidden">
      <div className="mx-auto flex max-w-[1600px] flex-col px-4 pt-3 pb-3 sm:px-5 lg:h-full">
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
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium">Hair you want (optional)</span>
                    <textarea
                      value={dash.context.hairPrompt || ""}
                      maxLength={280}
                      rows={2}
                      placeholder="Slick bun, loose waves, short crop"
                      className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => dash.onContext({ ...dash.context, hairPrompt: event.target.value })}
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

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <LookPicker plans={dash.plans} selectedPlan={dash.selectedPlan} onSelectPlan={dash.onSelectPlan} />
            <MakeupPicker plans={dash.makeupPlans || []} selected={dash.makeupPlan} onSelect={(plan) => dash.onSelectMakeup?.(plan)} />
            <HairPicker plans={dash.hairPlans || []} selected={dash.hairPlan} onSelect={(plan) => dash.onSelectHair?.(plan)} />
          </div>
          <TryOnStage {...dash} />
        </div>
      </div>
    </div>
  );
}

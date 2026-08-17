"use client";

import { useRef, useState, type ReactNode } from "react";
import { contextLabels, preferenceLabels, type PreferenceId, type WearContext, type WearPlan } from "@/lib/types";
import { Eyebrow, GhostButton, PrimaryButton } from "@/components/ui";

export function StepRail({ current }: { current: string }) {
  const steps = ["Set the day", "Choose a plan", "Rehearse the look"];
  const active = current === "context" ? 0 : current === "plans" || current === "detail" ? 1 : 2;
  return (
    <div className="mx-auto mb-8 flex max-w-[900px] flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:gap-5" aria-label="Progress">
      <Eyebrow className="whitespace-nowrap">Your rehearsal</Eyebrow>
      <div className="grid w-full grid-cols-3 gap-2 sm:gap-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`flex items-center gap-2 border-b pb-2.5 text-[11px] ${
              index <= active ? "border-brand text-foreground" : "border-border text-[#6f7065]"
            }`}
          >
            <span className="hidden font-mono text-[10px] sm:inline">{String(index + 1).padStart(2, "0")}</span>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`mx-auto max-w-[900px] rounded-[10px] border border-border bg-card p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-10 lg:p-14 ${className}`}>
      {children}
    </section>
  );
}

export function UploadPanel({
  onContinue,
  onCancel,
  preview,
  error,
  onFile,
}: {
  onContinue: () => void;
  onCancel: () => void;
  preview?: string;
  error?: string;
  onFile: (file?: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Panel className="max-w-[700px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Use my photo</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.5px] sm:text-5xl">Your image stays in this session.</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="grid size-11 place-items-center rounded-2xl text-muted-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close photo upload"
        >
          ×
        </button>
      </div>
      <div className="mt-8 flex gap-4 rounded-lg border border-brand/30 border-l-[3px] border-l-brand bg-brand/10 p-4">
        <span className="text-2xl text-brand-light" aria-hidden>
          ◌
        </span>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          Your image is used to create a virtual outfit rendering for this session. WearWeather does not use this result to assess your body, health, or worth. You can delete this session at any time.
        </p>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        <strong className="mb-1 block font-mono text-[10px] tracking-[0.5px] text-foreground">Photo guidance</strong>
        Use one clear photo of one person, facing forward and standing. Keep your face and shoulders visible. Avoid group photos, mirrors, severe shadows, and cropped bodies.
      </p>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {preview ? (
        <div className="mt-5 flex items-center gap-4 rounded-lg border border-border bg-white/3 p-3">
          <img src={preview} alt="Local preview of selected source photo" className="h-[120px] w-[100px] rounded object-cover" />
          <div className="flex flex-col gap-1.5 text-xs">
            <strong>Ready to rehearse</strong>
            <span className="text-muted-foreground">Image stays local until you submit a plan.</span>
            <button type="button" className="w-fit text-left text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => inputRef.current?.click()}>
              Choose another photo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="mt-5 flex min-h-[150px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/30 bg-white/3 text-muted-foreground transition-colors hover:border-brand-light hover:bg-brand/10"
          onClick={() => inputRef.current?.click()}
        >
          <span className="text-2xl text-brand-light">＋</span>
          <strong className="text-sm text-foreground">Choose a JPG or PNG</strong>
          <span className="text-xs">Maximum 10 MB</span>
        </button>
      )}
      {error && (
        <p className="mt-3.5 text-xs text-[#ff8b8e]" role="alert">
          {error}
        </p>
      )}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-2">
        <GhostButton onClick={onCancel}>Not now</GhostButton>
        <PrimaryButton disabled={!preview} onClick={onContinue}>
          Continue to the day →
        </PrimaryButton>
      </div>
    </Panel>
  );
}

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 text-[13px] font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="relative">
            <input
              type="radio"
              className="sr-only"
              name={label}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span
              className={`block rounded-2xl border px-3.5 py-3 text-xs transition-colors ${
                value === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-white/30 hover:text-foreground"
              }`}
            >
              {labels[option]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ContextForm({
  context,
  onChange,
  onContinue,
  onBack,
}: {
  context: WearContext;
  onChange: (next: WearContext) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-6">
        <div>
          <Eyebrow>The day ahead</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.5px] sm:text-5xl">Give the look a real-world brief.</h2>
          <p className="mt-3 max-w-[500px] text-sm leading-relaxed text-muted-foreground">
            We use your selections — not assumptions about you — to shape the shortlist.
          </p>
        </div>
        <span className="hidden font-mono text-[10px] tracking-[0.5px] text-muted-foreground sm:block">01 / 02</span>
      </div>
      <div className="my-10 grid gap-8">
        <ChoiceGroup
          label="What are you dressing for?"
          value={context.wearMoment}
          options={["client_meeting", "presentation", "workday", "long_event"]}
          labels={contextLabels.wearMoment}
          onChange={(wearMoment) => onChange({ ...context, wearMoment })}
        />
        <ChoiceGroup
          label="How will the day feel outside?"
          value={context.temperatureBand}
          options={["cool", "mild", "warm", "hot_humid"]}
          labels={contextLabels.temperatureBand}
          onChange={(temperatureBand) => onChange({ ...context, temperatureBand })}
        />
        <ChoiceGroup
          label="How much time will you spend outdoors?"
          value={context.outdoorDuration}
          options={["minimal", "short", "extended"]}
          labels={contextLabels.outdoorDuration}
          onChange={(outdoorDuration) => onChange({ ...context, outdoorDuration })}
        />
        <ChoiceGroup
          label="What level of polish do you need?"
          value={context.formality}
          options={["smart_casual", "business_polished", "formal"]}
          labels={contextLabels.formality}
          onChange={(formality) => onChange({ ...context, formality })}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <GhostButton onClick={onBack}>← Back</GhostButton>
        <PrimaryButton onClick={onContinue}>Choose your preferences →</PrimaryButton>
      </div>
    </Panel>
  );
}

function PreferenceChips({
  selected,
  onChange,
}: {
  selected: PreferenceId[];
  onChange: (next: PreferenceId[]) => void;
}) {
  const toggle = (preference: PreferenceId) => {
    if (selected.includes(preference)) onChange(selected.filter((item) => item !== preference));
    else if (selected.length < 3) onChange([...selected, preference]);
  };
  return (
    <div className="my-10">
      <div className="mb-5 flex items-end justify-between gap-5">
        <div>
          <Eyebrow>Your priorities</Eyebrow>
          <h3 className="mt-2.5 text-2xl font-medium tracking-[-0.5px]">What should the plan respect?</h3>
        </div>
        <span className="font-mono text-[10px] tracking-[0.5px] text-muted-foreground">{selected.length} / 3 selected</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {(Object.keys(preferenceLabels) as PreferenceId[]).map((preference) => {
          const on = selected.includes(preference);
          return (
            <button
              key={preference}
              type="button"
              className={`flex min-h-[58px] items-center gap-3 rounded-2xl border px-4 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                on ? "border-brand bg-brand font-semibold text-[#fff8ef]" : "border-border text-muted-foreground hover:border-white/30 hover:text-foreground"
              }`}
              onClick={() => toggle(preference)}
              aria-pressed={on}
            >
              <span className="grid size-5 place-items-center rounded-full border border-current text-[10px]">{on ? "✓" : "+"}</span>
              {preferenceLabels[preference]}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && <p className="mt-3.5 text-xs text-muted-foreground">Choose at least one priority to see your three plans.</p>}
      {selected.length === 3 && <p className="mt-3.5 text-xs text-muted-foreground">Three priorities selected. Remove one to choose a different priority.</p>}
    </div>
  );
}

export function PreferencesForm({
  context,
  onChange,
  onContinue,
  onBack,
}: {
  context: WearContext;
  onChange: (next: WearContext) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-6">
        <div>
          <Eyebrow>Your priorities</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.5px] sm:text-5xl">Make the shortlist feel like yours.</h2>
          <p className="mt-3 max-w-[500px] text-sm leading-relaxed text-muted-foreground">Choose one to three. These are your words, not a diagnosis.</p>
        </div>
        <span className="hidden font-mono text-[10px] tracking-[0.5px] text-muted-foreground sm:block">02 / 02</span>
      </div>
      <PreferenceChips selected={context.preferences} onChange={(preferences) => onChange({ ...context, preferences })} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <GhostButton onClick={onBack}>← Back</GhostButton>
        <PrimaryButton disabled={!context.preferences.length} onClick={onContinue}>
          Show my three plans →
        </PrimaryButton>
      </div>
    </Panel>
  );
}

const planLines = ["Polished, with an exit plan.", "Structure without the weight.", "Keep the day moving."];

export function PlansView({
  plans,
  context,
  onSelect,
  onBack,
  onReset,
  onRefine,
}: {
  plans: WearPlan[];
  context: WearContext;
  onSelect: (plan: WearPlan) => void;
  onBack: () => void;
  onReset: () => void;
  onRefine: (preference: PreferenceId) => void;
}) {
  return (
    <section className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Eyebrow>Three Wear Plans</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.5px] sm:text-5xl">Shortlist, not scroll fatigue.</h2>
          <p className="mt-3 max-w-[500px] text-sm leading-relaxed text-muted-foreground">
            Each option is matched to your brief using catalogue facts and your chosen priorities.
          </p>
        </div>
        <GhostButton className="h-10 min-h-10 px-3.5 py-0" onClick={onBack}>
          Edit the day
        </GhostButton>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3 font-mono text-[10px] tracking-[0.03em]">
        <span>
          <b className="font-medium text-brand-light">{contextLabels.wearMoment[context.wearMoment]}</b> after an{" "}
          <b className="font-medium text-brand-light">{contextLabels.outdoorDuration[context.outdoorDuration].toLowerCase()}</b>
        </span>
        <span className="size-1 rounded-full bg-brand" />
        <span>
          {contextLabels.temperatureBand[context.temperatureBand]} / {contextLabels.formality[context.formality]}
        </span>
        <span className="size-1 rounded-full bg-brand" />
        <span>{context.preferences.map((preference) => preferenceLabels[preference]).join(" · ")}</span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.planId}
            className={`overflow-hidden rounded-[9px] border bg-card transition-colors hover:border-white/30 ${
              plan.rank === 1 ? "border-brand/60 shadow-[0_0_0_1px_rgba(210,86,17,0.16)]" : "border-border"
            }`}
          >
            <div className="relative h-[290px] overflow-hidden bg-[#303229]">
              <img src={plan.sourceImageUrl} alt={`Reference outfit: ${plan.title}`} className="h-full w-full object-cover" />
              <span className="absolute top-3 left-3 rounded-lg border border-white/20 bg-background/85 px-2 py-1.5 font-mono text-[10px]">
                0{plan.rank}
              </span>
              {plan.rank === 1 && (
                <span className="absolute top-3 right-3 rounded-lg bg-brand px-2 py-1.5 font-mono text-[10px] text-[#fff8ef]">FIRST LOOK</span>
              )}
            </div>
            <div className="p-6">
              <span className="font-mono text-[10px] tracking-[0.5px] text-muted-foreground">{plan.title}</span>
              <h3 className="mt-3 mb-5 text-[27px] leading-none font-medium tracking-[-0.5px]">{planLines[plan.rank - 1]}</h3>
              <ul className="mb-5 grid list-none gap-2.5 p-0">
                {plan.reasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-xs leading-snug text-muted-foreground">
                    <span className="font-extrabold text-brand-light">↗</span>
                    {reason}
                  </li>
                ))}
              </ul>
              <div className="border-t border-border pt-3.5 text-[11px] leading-relaxed text-muted-foreground">
                <span className="mb-1.5 block font-mono text-[10px] tracking-[0.5px] text-brand-light">Check before buying</span>
                {plan.checkBeforeBuying}
              </div>
              <div className="mt-5 flex items-center justify-between gap-2">
                <PrimaryButton className="h-10 min-h-10 px-3.5 py-0 text-[11px]" onClick={() => onSelect(plan)}>
                  Try this look →
                </PrimaryButton>
                <a
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  href={plan.productUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View item ↗
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 flex flex-col justify-between gap-4 rounded-[9px] border border-brand/25 bg-brand/8 p-5 sm:flex-row sm:items-center">
        <div>
          <Eyebrow>Want to tune it?</Eyebrow>
          <strong className="mt-2 block text-lg font-medium">Change one input. See what moves.</strong>
        </div>
        <div className="flex flex-wrap gap-2">
          <GhostButton className="h-10 min-h-10 px-3 py-0 text-[11px]" onClick={() => onRefine("runs_warm")}>
            Make it cooler
          </GhostButton>
          <GhostButton className="h-10 min-h-10 px-3 py-0 text-[11px]" onClick={() => onRefine("prefer_coverage")}>
            Add more coverage
          </GhostButton>
        </div>
      </div>
      <button type="button" className="mx-auto mt-6 block text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={onReset}>
        Delete this session
      </button>
    </section>
  );
}

export function DetailView({
  plan,
  onBack,
  onTry,
  onViewItem,
  saved,
  onSave,
}: {
  plan: WearPlan;
  onBack: () => void;
  onTry: () => void;
  onViewItem: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(330px,0.9fr)] xl:gap-14">
      <button type="button" className="justify-self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground xl:col-span-2" onClick={onBack}>
        ← Back to plans
      </button>
      <div className="relative h-[470px] overflow-hidden rounded-[9px] border border-border bg-[#303229] xl:h-[650px]">
        <img src={plan.sourceImageUrl} alt={`Complete look reference for ${plan.title}`} className="h-full w-full object-cover" />
        <span className="absolute bottom-4 left-4 rounded-md border border-border bg-background/85 px-2.5 py-2 font-mono text-[10px] tracking-[0.5px]">
          REFERENCE LOOK / {String(plan.rank).padStart(2, "0")}
        </span>
      </div>
      <div>
        <Eyebrow>Plan {String(plan.rank).padStart(2, "0")}</Eyebrow>
        <h2 className="mt-4 text-5xl font-medium tracking-[-0.5px] sm:text-6xl">{plan.title}</h2>
        <h3 className="mt-4 mb-6 text-base font-medium text-muted-foreground">
          {plan.rank === 1 ? "Polished, with an exit plan." : "A look built around your actual day."}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {plan.garmentMetadataSummary.map((item) => (
            <span key={item} className="rounded-full border border-border px-2.5 py-2 font-mono text-[10px] text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
        <div className="my-8">
          <Eyebrow>Why it landed here</Eyebrow>
          {plan.reasons.map((reason) => (
            <p key={reason} className="mt-3 flex gap-2 text-xs leading-snug text-muted-foreground">
              <span className="font-extrabold text-brand-light">↗</span>
              {reason}
            </p>
          ))}
        </div>
        <div className="rounded-lg border border-brand/25 border-l-[3px] border-l-brand bg-brand/10 p-4 text-xs leading-relaxed">
          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.5px] text-brand-light">Before you buy</span>
          <strong>{plan.checkBeforeBuying}</strong>
          <p className="mt-2 text-muted-foreground">We can’t verify physical fit, fabric feel, breathability, or retailer sizing here.</p>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <PrimaryButton onClick={onTry}>Try this look on me →</PrimaryButton>
          <GhostButton className={saved ? "border-brand bg-brand text-white" : ""} onClick={onSave}>
            {saved ? "✓ Plan saved" : "Save this plan"}
          </GhostButton>
          <button type="button" className="px-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={onViewItem}>
            View item ↗
          </button>
        </div>
      </div>
    </section>
  );
}

export function ProcessingView({
  error,
  slow,
  onRetry,
  onBack,
  errorMessages,
}: {
  error?: string;
  slow: boolean;
  onRetry: () => void;
  onBack: () => void;
  errorMessages: Record<string, string>;
}) {
  return (
    <section className="mx-auto flex min-h-[520px] max-w-[700px] flex-col items-center justify-center rounded-[10px] border border-border bg-card p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="relative grid size-[90px] place-items-center rounded-full border border-brand/35">
        <span className="absolute inset-[13px] rounded-full border border-dashed border-white/20" />
        <span className="size-2 rounded-full bg-brand" style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
      </div>
      <Eyebrow className="mt-6">Live YouCam clothes VTO</Eyebrow>
      <h2 className="mt-6 max-w-[470px] text-4xl font-medium tracking-[-0.5px] sm:text-5xl">
        {error ? "The visual rehearsal needs another take." : "Building your visual rehearsal."}
      </h2>
      <p className="mt-4 max-w-[440px] leading-relaxed text-muted-foreground">
        {error ? errorMessages[error] || errorMessages.UNEXPECTED_ERROR : "This can take a moment. Keep this page open while we check the task."}
      </p>
      {slow && !error && <p className="mt-3 text-xs text-brand-light">This is taking longer than expected. You can keep this page open or try again.</p>}
      {error ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <GhostButton onClick={onBack}>Return to plans</GhostButton>
          <PrimaryButton onClick={onRetry}>Try again →</PrimaryButton>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2 font-mono text-[10px] tracking-[0.5px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-brand" style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
          Waiting for a completed rendering
        </div>
      )}
    </section>
  );
}

export function ResultCompare({
  resultUrl,
  originalUrl,
  plan,
  onRefine,
  onChooseAnother,
  onReset,
  saved,
  onSave,
}: {
  resultUrl: string;
  originalUrl: string;
  plan: WearPlan;
  onRefine: (preference: PreferenceId) => void;
  onChooseAnother: () => void;
  onReset: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  const [position, setPosition] = useState(50);
  return (
    <section className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Eyebrow>Visual rehearsal complete</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.5px] sm:text-5xl">Now see what still needs checking.</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-full border border-brand text-brand-light">✓</span>
      </div>
      <div className="compare-frame">
        <img src={resultUrl} alt="Virtual rendering of the selected Wear Plan" />
        <div className="compare-original" style={{ width: `${position}%` }}>
          <img src={originalUrl} alt="Original source photo" />
        </div>
        <div className="compare-divider" style={{ left: `${position}%` }}>
          <span className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-lg text-primary-foreground">
            ↔
          </span>
        </div>
        <label className="sr-only" htmlFor="compare-slider">
          Compare original photo and virtual rendering
        </label>
        <input
          id="compare-slider"
          className="compare-slider"
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
        <div className="absolute top-4 left-4 rounded-md border border-border bg-background/80 px-2 py-1.5 font-mono text-[10px] tracking-[0.5px]">
          ORIGINAL PHOTO
        </div>
        <div className="absolute top-4 right-4 rounded-md border border-border bg-background/80 px-2 py-1.5 font-mono text-[10px] tracking-[0.5px]">
          VIRTUAL RENDERING
        </div>
      </div>
      <p className="mt-3.5 mb-6 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Virtual rendering:</strong> this helps you visualise a look. It does not guarantee physical fit, fabric feel, breathability, or retailer sizing.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Eyebrow>Your plan / {plan.title}</Eyebrow>
          {plan.reasons.map((reason) => (
            <p key={reason} className="mt-3 flex gap-2 text-xs leading-snug text-muted-foreground">
              <span className="font-extrabold text-brand-light">↗</span>
              {reason}
            </p>
          ))}
        </div>
        <div className="rounded-lg border border-brand/25 border-l-[3px] border-l-brand bg-brand/10 p-4 text-xs leading-relaxed">
          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.5px] text-brand-light">Check before buying</span>
          <strong>{plan.checkBeforeBuying}</strong>
        </div>
      </div>
      <div className="mt-6 flex flex-col justify-between gap-4 rounded-[9px] border border-brand/25 bg-brand/8 p-5 sm:flex-row sm:items-center">
        <div>
          <Eyebrow>Make a small change</Eyebrow>
          <strong className="mt-2 block text-lg font-medium">The image stays put. The plan can evolve.</strong>
        </div>
        <div className="flex flex-wrap gap-2">
          <GhostButton className="h-10 min-h-10 px-3 py-0 text-[11px]" onClick={() => onRefine("runs_warm")}>
            Make it cooler
          </GhostButton>
          <GhostButton className="h-10 min-h-10 px-3 py-0 text-[11px]" onClick={() => onRefine("prefer_coverage")}>
            Add more coverage
          </GhostButton>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <GhostButton onClick={onChooseAnother}>Choose another plan</GhostButton>
        <GhostButton className={saved ? "border-brand bg-brand text-white" : ""} onClick={onSave}>
          {saved ? "✓ Plan saved" : "Save this plan"}
        </GhostButton>
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-semibold tracking-[-0.5px] text-background transition-opacity hover:opacity-90"
          href={plan.productUrl}
          target="_blank"
          rel="noreferrer"
        >
          View item ↗
        </a>
      </div>
      <button type="button" className="mx-auto mt-6 block text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={onReset}>
        Delete this session
      </button>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { rankWearPlans } from "@/lib/recommendation-engine";
import { contextLabels, preferenceLabels, type PreferenceId, type WearContext, type WearPlan } from "@/lib/types";

const examplePhotoUrl = "/catalog/office-dark.jpg";
const defaultContext: WearContext = {
  wearMoment: "client_meeting",
  temperatureBand: "hot_humid",
  outdoorDuration: "extended",
  formality: "business_polished",
  preferences: ["runs_warm", "need_movement"],
};
const errorMessages: Record<string, string> = {
  PHOTO_FORMAT_INVALID: "Choose a JPG or PNG image.",
  PHOTO_TOO_LARGE: "This image is larger than 10 MB. Choose a smaller file.",
  PHOTO_GUIDANCE_NEEDED: "Use one clear, front-facing standing photo with your face and shoulders visible.",
  REFERENCE_INVALID: "This outfit image is not suitable for try-on. Choose another Wear Plan.",
  TASK_FAILED: "We could not create this visual rehearsal. Your plan is still saved; please try again.",
  SERVICE_UNAVAILABLE: "The try-on service is temporarily unavailable. Add a YouCam key and try again shortly.",
  SESSION_EXPIRED: "This session has expired for privacy. Start a new rehearsal.",
  UNEXPECTED_ERROR: "Something went wrong. No new result was created.",
};

function StepRail({ current }: { current: string }) {
  const steps = ["Set the day", "Choose a plan", "Rehearse the look"];
  const active = current === "context" ? 0 : current === "plans" || current === "detail" ? 1 : 2;
  return <div className="step-rail" aria-label="Progress"><span className="eyebrow">YOUR REHEARSAL</span><div className="step-items">{steps.map((step, index) => <div className={`step-item ${index <= active ? "active" : ""}`} key={step}><span>{String(index + 1).padStart(2, "0")}</span>{step}</div>)}</div></div>;
}

function Header({ onReset, showReset }: { onReset: () => void; showReset: boolean }) {
  return <header className="site-header"><a className="brand" href="#top" aria-label="WearWeather home"><span className="brand-mark">W</span><span>WearWeather</span></a><div className="header-actions"><span className="header-note">See the look. Plan the wear.</span>{showReset && <button className="text-button" onClick={onReset}>Reset session</button>}</div></header>;
}

function StartMode({ onExample, onUpload }: { onExample: () => void; onUpload: () => void }) {
  return <section className="hero-grid" id="top"><div className="hero-copy"><div className="kicker"><span className="kicker-dot" /> Practical outfit planning</div><h1>Rehearse a look for the day you actually have.</h1><p className="hero-lede">WearWeather helps you compare a few polished looks against your commute, temperature, movement needs, and preferences—then visualise one on yourself.</p><div className="hero-actions"><button className="primary-button" onClick={onExample}>Try the example <span>→</span></button><button className="secondary-button" onClick={onUpload}>Use my photo <span>↗</span></button></div><p className="micro-copy"><strong>No account required.</strong> Your choices stay in this temporary session.</p></div><div className="hero-art" aria-label="Editorial outfit planning preview"><div className="art-note art-note-top">A real-day<br /><strong>decision</strong></div><div className="art-panel"><div className="art-sun" /><div className="art-silhouette"><div className="art-head" /><div className="art-body" /><div className="art-leg art-leg-left" /><div className="art-leg art-leg-right" /></div><div className="art-card"><span>HOT COMMUTE</span><strong>Light layer<br />+ easy movement</strong></div></div><div className="art-caption">01 / VISUAL REHEARSAL</div></div></section>;
}

function UploadPanel({ onContinue, onCancel, preview, error, onFile }: { onContinue: () => void; onCancel: () => void; preview?: string; error?: string; onFile: (file?: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <section className="panel narrow-panel"><div className="panel-top"><div><span className="eyebrow">USE MY PHOTO</span><h2>Your image stays in this session.</h2></div><button className="icon-button" onClick={onCancel} aria-label="Close photo upload">×</button></div><div className="consent-box"><span className="consent-icon">◌</span><p>Your image is used to create a virtual outfit rendering for this session. WearWeather does not use this result to assess your body, health, or worth. You can delete this session at any time.</p></div><p className="guidance"><strong>Photo guidance</strong> Use one clear photo of one person, facing forward and standing. Keep your face and shoulders visible. Avoid group photos, mirrors, severe shadows, and cropped bodies.</p><input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png" onChange={(event) => onFile(event.target.files?.[0])} />{preview ? <div className="photo-preview"><img src={preview} alt="Local preview of selected source photo" /><div><strong>Ready to rehearse</strong><span>Image stays local until you submit a plan.</span><button className="text-button" onClick={() => inputRef.current?.click()}>Choose another photo</button></div></div> : <button className="dropzone" onClick={() => inputRef.current?.click()}><span className="drop-icon">＋</span><strong>Choose a JPG or PNG</strong><span>Maximum 10 MB</span></button>}{error && <p className="error-message" role="alert">{error}</p>}<div className="panel-actions"><button className="secondary-button" onClick={onCancel}>Not now</button><button className="primary-button" disabled={!preview} onClick={onContinue}>Continue to the day <span>→</span></button></div></section>;
}

function ChoiceGroup<T extends string>({ label, value, options, labels, onChange }: { label: string; value: T; options: readonly T[]; labels: Record<T, string>; onChange: (value: T) => void }) {
  return <fieldset className="choice-fieldset"><legend>{label}</legend><div className="choice-grid">{options.map((option) => <label className={`choice ${value === option ? "selected" : ""}`} key={option}><input type="radio" name={label} checked={value === option} onChange={() => onChange(option)} /><span>{labels[option]}</span></label>)}</div></fieldset>;
}

function ContextForm({ context, onChange, onContinue, onBack }: { context: WearContext; onChange: (next: WearContext) => void; onContinue: () => void; onBack: () => void }) {
  return <section className="panel context-panel"><div className="panel-top"><div><span className="eyebrow">THE DAY AHEAD</span><h2>Give the look a real-world brief.</h2><p>We use your selections—not assumptions about you—to shape the shortlist.</p></div><span className="context-index">01 / 02</span></div><div className="context-form"><ChoiceGroup label="What are you dressing for?" value={context.wearMoment} options={["client_meeting", "presentation", "workday", "long_event"]} labels={contextLabels.wearMoment} onChange={(wearMoment) => onChange({ ...context, wearMoment })} /><ChoiceGroup label="How will the day feel outside?" value={context.temperatureBand} options={["cool", "mild", "warm", "hot_humid"]} labels={contextLabels.temperatureBand} onChange={(temperatureBand) => onChange({ ...context, temperatureBand })} /><ChoiceGroup label="How much time will you spend outdoors?" value={context.outdoorDuration} options={["minimal", "short", "extended"]} labels={contextLabels.outdoorDuration} onChange={(outdoorDuration) => onChange({ ...context, outdoorDuration })} /><ChoiceGroup label="What level of polish do you need?" value={context.formality} options={["smart_casual", "business_polished", "formal"]} labels={contextLabels.formality} onChange={(formality) => onChange({ ...context, formality })} /></div><div className="panel-actions"><button className="secondary-button" onClick={onBack}>← Back</button><button className="primary-button" onClick={onContinue}>Choose your preferences <span>→</span></button></div></section>;
}

function PreferenceChips({ selected, onChange }: { selected: PreferenceId[]; onChange: (next: PreferenceId[]) => void }) {
  const toggle = (preference: PreferenceId) => {
    if (selected.includes(preference)) onChange(selected.filter((item) => item !== preference));
    else if (selected.length < 3) onChange([...selected, preference]);
  };
  return <div className="preferences-wrap"><div className="pref-heading"><div><span className="eyebrow">YOUR PRIORITIES</span><h3>What should the plan respect?</h3></div><span className="counter">{selected.length} / 3 selected</span></div><div className="chip-grid">{(Object.keys(preferenceLabels) as PreferenceId[]).map((preference) => <button key={preference} className={`pref-chip ${selected.includes(preference) ? "selected" : ""}`} onClick={() => toggle(preference)} aria-pressed={selected.includes(preference)}><span className="chip-check">{selected.includes(preference) ? "✓" : "+"}</span>{preferenceLabels[preference]}</button>)}</div>{selected.length === 0 && <p className="form-hint">Choose at least one priority to see your three plans.</p>}{selected.length === 3 && <p className="form-hint">Three priorities selected. Remove one to choose a different priority.</p>}</div>;
}

function PlansView({ plans, context, onSelect, onBack, onReset, onRefine }: { plans: WearPlan[]; context: WearContext; onSelect: (plan: WearPlan) => void; onBack: () => void; onReset: () => void; onRefine: (preference: PreferenceId) => void }) {
  return <section className="plans-section"><div className="plans-intro"><div><span className="eyebrow">THREE WEAR PLANS</span><h2>Shortlist, not scroll fatigue.</h2><p>Each option is matched to your brief using catalogue facts and your chosen priorities.</p></div><button className="secondary-button compact" onClick={onBack}>Edit the day</button></div><div className="brief-strip"><span><b>{contextLabels.wearMoment[context.wearMoment]}</b> after an <b>{contextLabels.outdoorDuration[context.outdoorDuration].toLowerCase()}</b></span><span className="brief-divider" /><span>{contextLabels.temperatureBand[context.temperatureBand]} / {contextLabels.formality[context.formality]}</span><span className="brief-divider" /><span>{context.preferences.map((preference) => preferenceLabels[preference]).join(" · ")}</span></div><div className="plan-grid">{plans.map((plan) => <article className={`plan-card ${plan.rank === 1 ? "featured" : ""}`} key={plan.planId}><div className="plan-image-wrap"><img src={plan.sourceImageUrl} alt={`Reference outfit: ${plan.title}`} /><span className="rank-badge">0{plan.rank}</span>{plan.rank === 1 && <span className="match-badge">FIRST LOOK</span>}</div><div className="plan-content"><span className="plan-label">{plan.title}</span><h3>{plan.rank === 1 ? "Polished, with an exit plan." : plan.rank === 2 ? "Structure without the weight." : "Keep the day moving."}</h3><ul className="reason-list">{plan.reasons.map((reason) => <li key={reason}><span>↗</span>{reason}</li>)}</ul><div className="check-note"><span>CHECK BEFORE BUYING</span>{plan.checkBeforeBuying}</div><div className="plan-card-actions"><button className="primary-button small" onClick={() => onSelect(plan)}>Try this look <span>→</span></button><a className="link-button" href={plan.productUrl} target="_blank" rel="noreferrer">View item ↗</a></div></div></article>)}</div><div className="refine-strip"><div><span className="eyebrow">WANT TO TUNE IT?</span><strong>Change one input. See what moves.</strong></div><div className="refine-actions"><button onClick={() => onRefine("runs_warm")}>Make it cooler</button><button onClick={() => onRefine("prefer_coverage")}>Add more coverage</button></div></div><button className="reset-link" onClick={onReset}>Delete this session</button></section>;
}

function DetailView({ plan, onBack, onTry, onViewItem, saved, onSave }: { plan: WearPlan; onBack: () => void; onTry: () => void; onViewItem: () => void; saved: boolean; onSave: () => void }) {
  return <section className="detail-grid"><button className="back-link" onClick={onBack}>← Back to plans</button><div className="detail-image"><img src={plan.sourceImageUrl} alt={`Complete look reference for ${plan.title}`} /><span className="image-label">REFERENCE LOOK / {String(plan.rank).padStart(2, "0")}</span></div><div className="detail-copy"><span className="eyebrow">PLAN {String(plan.rank).padStart(2, "0")}</span><h2>{plan.title}</h2><h3>{plan.rank === 1 ? "Polished, with an exit plan." : "A look built around your actual day."}</h3><div className="detail-meta">{plan.garmentMetadataSummary.map((item) => <span key={item}>{item}</span>)}</div><div className="detail-reasons"><span className="eyebrow">WHY IT LANDED HERE</span>{plan.reasons.map((reason) => <p key={reason}><span>↗</span>{reason}</p>)}</div><div className="check-card"><span>BEFORE YOU BUY</span><strong>{plan.checkBeforeBuying}</strong><p>We can’t verify physical fit, fabric feel, breathability, or retailer sizing here.</p></div><div className="detail-actions"><button className="primary-button" onClick={onTry}>Try this look on me <span>→</span></button><button className={`secondary-button ${saved ? "saved" : ""}`} onClick={onSave}>{saved ? "✓ Plan saved" : "Save this plan"}</button><button className="link-button" onClick={onViewItem}>View item ↗</button></div></div></section>;
}

function ProcessingView({ error, slow, onRetry, onBack }: { error?: string; slow: boolean; onRetry: () => void; onBack: () => void }) {
  return <section className="processing-panel"><div className="processing-orbit"><span /><span /><span /></div><span className="eyebrow">LIVE YOUCAM CLOTHES VTO</span><h2>{error ? "The visual rehearsal needs another take." : "Building your visual rehearsal."}</h2><p>{error ? errorMessages[error] || errorMessages.UNEXPECTED_ERROR : "This can take a moment. Keep this page open while we check the task."}</p>{slow && !error && <p className="slow-note">This is taking longer than expected. You can keep this page open or try again.</p>}{error ? <div className="panel-actions centered"><button className="secondary-button" onClick={onBack}>Return to plans</button><button className="primary-button" onClick={onRetry}>Try again <span>→</span></button></div> : <div className="progress-line"><span className="progress-pulse" />Waiting for a completed rendering</div>}</section>;
}

function ResultCompare({ resultUrl, originalUrl, plan, onRefine, onChooseAnother, onReset, saved, onSave }: { resultUrl: string; originalUrl: string; plan: WearPlan; onRefine: (preference: PreferenceId) => void; onChooseAnother: () => void; onReset: () => void; saved: boolean; onSave: () => void }) {
  const [position, setPosition] = useState(50);
  return <section className="result-section"><div className="result-heading"><div><span className="eyebrow">VISUAL REHEARSAL COMPLETE</span><h2>Now see what still needs checking.</h2></div><span className="success-mark">✓</span></div><div className="compare-frame"><img src={resultUrl} alt="Virtual rendering of the selected Wear Plan" /><div className="compare-original" style={{ width: `${position}%` }}><img src={originalUrl} alt="Original source photo" /></div><div className="compare-divider" style={{ left: `${position}%` }}><span>↔</span></div><label className="sr-only" htmlFor="compare-slider">Compare original photo and virtual rendering</label><input id="compare-slider" className="compare-slider" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} /><div className="compare-label original-label">ORIGINAL PHOTO</div><div className="compare-label result-label">VIRTUAL RENDERING</div></div><p className="limitation"><strong>Virtual rendering:</strong> this helps you visualise a look. It does not guarantee physical fit, fabric feel, breathability, or retailer sizing.</p><div className="result-detail"><div><span className="eyebrow">YOUR PLAN / {plan.title}</span>{plan.reasons.map((reason) => <p className="result-reason" key={reason}><span>↗</span>{reason}</p>)}</div><div className="check-card"><span>CHECK BEFORE BUYING</span><strong>{plan.checkBeforeBuying}</strong></div></div><div className="refine-strip result-refine"><div><span className="eyebrow">MAKE A SMALL CHANGE</span><strong>The image stays put. The plan can evolve.</strong></div><div className="refine-actions"><button onClick={() => onRefine("runs_warm")}>Make it cooler</button><button onClick={() => onRefine("prefer_coverage")}>Add more coverage</button></div></div><div className="result-actions"><button className="secondary-button" onClick={onChooseAnother}>Choose another plan</button><button className={`secondary-button ${saved ? "saved" : ""}`} onClick={onSave}>{saved ? "✓ Plan saved" : "Save this plan"}</button><a className="primary-button" href={plan.productUrl} target="_blank" rel="noreferrer">View item <span>↗</span></a></div><button className="reset-link" onClick={onReset}>Delete this session</button></section>;
}

export default function Home() {
  const [screen, setScreen] = useState<"start" | "upload" | "context" | "preferences" | "plans" | "detail" | "processing" | "result">("start");
  const [mode, setMode] = useState<"example" | "upload">("example");
  const [context, setContext] = useState<WearContext>(defaultContext);
  const [plans, setPlans] = useState<WearPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<WearPlan>();
  const [sourceFile, setSourceFile] = useState<File>();
  const [sourcePreview, setSourcePreview] = useState<string>();
  const [activeRequestId, setActiveRequestId] = useState<string>();
  const [resultUrl, setResultUrl] = useState<string>();
  const [taskError, setTaskError] = useState<string>();
  const [slow, setSlow] = useState(false);
  const [revisionNote, setRevisionNote] = useState<string>();
  const [recommendationVersion, setRecommendationVersion] = useState(1);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [pollStartedAt, setPollStartedAt] = useState<number>();

  const hasSource = mode === "example" || Boolean(sourceFile);
  const originalUrl = mode === "example" ? examplePhotoUrl : sourcePreview || "";

  const createPlans = (nextContext = context, nextVersion = recommendationVersion) => {
    const ranked = rankWearPlans(nextContext, nextVersion);
    setPlans(ranked);
    setSelectedPlan(undefined);
    setScreen("plans");
  };

  const startExample = () => {
    setMode("example");
    setContext(defaultContext);
    setScreen("context");
  };

  const startUpload = () => {
    setMode("upload");
    setScreen("upload");
  };

  const handleFile = (file?: File) => {
    setUploadError(undefined);
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) return setUploadError("Choose a JPG or PNG image.");
    if (file.size > 10 * 1024 * 1024) return setUploadError("This image is larger than 10 MB. Choose a smaller file.");
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setSourceFile(file);
    setSourcePreview(URL.createObjectURL(file));
  };

  const confirmUpload = () => setScreen("context");
  const openPlans = () => { if (context.preferences.length) createPlans(context, recommendationVersion); else setScreen("preferences"); };
  const selectPlan = (plan: WearPlan) => { setSelectedPlan(plan); setScreen("detail"); };

  const startVto = async () => {
    if (!selectedPlan || !hasSource) return;
    setScreen("processing"); setTaskError(undefined); setSlow(false); setResultUrl(undefined); setPollStartedAt(Date.now());
    try {
      let file = sourceFile;
      if (!file) {
        const response = await fetch(examplePhotoUrl);
        const blob = await response.blob();
        file = new File([blob], "example-source.jpg", { type: blob.type || "image/jpeg" });
      }
      const form = new FormData();
      form.append("photo", file);
      form.append("lookId", selectedPlan.lookId);
      const response = await fetch("/api/vto", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) { setTaskError(body.code || "UNEXPECTED_ERROR"); return; }
      setActiveRequestId(body.requestId);
    } catch { setTaskError("SERVICE_UNAVAILABLE"); }
  };

  useEffect(() => {
    if (!activeRequestId || screen !== "processing") return;
    let cancelled = false;
    const delays = [2000, 3000, 5000];
    let attempt = 0;
    const poll = async () => {
      if (cancelled) return;
      const started = pollStartedAt || Date.now();
      if (Date.now() - started >= 60000) { setSlow(true); return; }
      try {
        const response = await fetch(`/api/vto-status/${activeRequestId}`, { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        if (body.status === "success") { setResultUrl(body.resultUrl); setScreen("result"); setActiveRequestId(undefined); return; }
        if (body.status === "error") { setTaskError(body.code || "TASK_FAILED"); setActiveRequestId(undefined); return; }
      } catch { setTaskError("SERVICE_UNAVAILABLE"); setActiveRequestId(undefined); return; }
      const delay = delays[Math.min(attempt, delays.length - 1)]; attempt += 1;
      window.setTimeout(poll, delay);
    };
    window.setTimeout(poll, delays[0]);
    return () => { cancelled = true; };
  }, [activeRequestId, screen, pollStartedAt]);

  const retry = () => { setTaskError(undefined); startVto(); };
  const refine = (preference: PreferenceId) => {
    const already = context.preferences.includes(preference);
    const nextPreferences = already ? context.preferences : context.preferences.length < 3 ? [...context.preferences, preference] : [preference, ...context.preferences.slice(0, 2)];
    const nextContext = { ...context, preferences: nextPreferences };
    const nextVersion = recommendationVersion + 1;
    setContext(nextContext); setRecommendationVersion(nextVersion); setRevisionNote(already ? `You revisited “${preferenceLabels[preference]}”; the same brief is still in view.` : `You added “${preferenceLabels[preference]},” so the shortlist moved around that priority.`); createPlans(nextContext, nextVersion);
  };

  const reset = async () => {
    if (!window.confirm("Delete this session and its saved plans? This cannot be undone.")) return;
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setScreen("start"); setMode("example"); setContext(defaultContext); setPlans([]); setSelectedPlan(undefined); setSourceFile(undefined); setSourcePreview(undefined); setActiveRequestId(undefined); setResultUrl(undefined); setTaskError(undefined); setSaved(false); setRevisionNote(undefined); setRecommendationVersion(1);
  };

  return <main className="app-shell"><Header onReset={reset} showReset={screen !== "start"} /><div className="content-wrap">{screen === "start" && <StartMode onExample={startExample} onUpload={startUpload} />}{screen === "upload" && <UploadPanel onContinue={confirmUpload} onCancel={() => setScreen("start")} preview={sourcePreview} error={uploadError} onFile={handleFile} />}{(screen === "context" || screen === "preferences") && <><StepRail current="context" />{screen === "context" ? <ContextForm context={context} onChange={setContext} onContinue={() => setScreen("preferences")} onBack={() => setScreen(mode === "upload" ? "upload" : "start")} /> : <section className="panel preference-panel"><div className="panel-top"><div><span className="eyebrow">YOUR PRIORITIES</span><h2>Make the shortlist feel like yours.</h2><p>Choose one to three. These are your words, not a diagnosis.</p></div><span className="context-index">02 / 02</span></div><PreferenceChips selected={context.preferences} onChange={(preferences) => setContext({ ...context, preferences })} /><div className="panel-actions"><button className="secondary-button" onClick={() => setScreen("context")}>← Back</button><button className="primary-button" disabled={!context.preferences.length} onClick={openPlans}>Show my three plans <span>→</span></button></div></section>}</>}{screen === "plans" && <><StepRail current="plans" />{revisionNote && <div className="revision-note"><span>↻</span>{revisionNote}</div>}<PlansView plans={plans} context={context} onSelect={selectPlan} onBack={() => setScreen("context")} onReset={reset} onRefine={refine} /></>}{screen === "detail" && selectedPlan && <><StepRail current="detail" /><DetailView plan={selectedPlan} onBack={() => setScreen("plans")} onTry={startVto} onViewItem={() => window.open(selectedPlan.productUrl, "_blank", "noopener,noreferrer")} saved={saved} onSave={() => setSaved(true)} /></>}{screen === "processing" && <><StepRail current="processing" /><ProcessingView error={taskError} slow={slow} onRetry={retry} onBack={() => setScreen("plans")} /></>}{screen === "result" && selectedPlan && resultUrl && <><StepRail current="result" /><ResultCompare resultUrl={resultUrl} originalUrl={originalUrl} plan={selectedPlan} onRefine={refine} onChooseAnother={() => setScreen("plans")} onReset={reset} saved={saved} onSave={() => setSaved(true)} /></>}</div><footer className="site-footer"><span>WearWeather / 2026</span><span>Visual rehearsal, not physical certainty.</span></footer></main>;
}

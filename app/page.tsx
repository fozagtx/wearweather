"use client";

import { useEffect, useState } from "react";
import { LandingPage } from "@/components/landing/landing-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  ContextForm,
  DetailView,
  PlansView,
  PreferencesForm,
  ProcessingView,
  ResultCompare,
  StepRail,
  UploadPanel,
} from "@/components/rehearsal";
import { exampleBrief, examplePhotoUrl } from "@/lib/example-brief";
import { rankWearPlans } from "@/lib/recommendation-engine";
import { preferenceLabels, type PreferenceId, type WearContext, type WearPlan } from "@/lib/types";
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

export default function Home() {
  const [screen, setScreen] = useState<
    "start" | "upload" | "context" | "preferences" | "plans" | "detail" | "processing" | "result"
  >("start");
  const [mode, setMode] = useState<"example" | "upload">("example");
  const [context, setContext] = useState<WearContext>(exampleBrief);
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
    setContext(exampleBrief);
    setScreen("context");
    window.scrollTo(0, 0);
  };

  const startUpload = () => {
    setMode("upload");
    setScreen("upload");
    window.scrollTo(0, 0);
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
  const openPlans = () => {
    if (context.preferences.length) createPlans(context, recommendationVersion);
    else setScreen("preferences");
  };
  const selectPlan = (plan: WearPlan) => {
    setSelectedPlan(plan);
    setScreen("detail");
  };

  const startVto = async () => {
    if (!selectedPlan || !hasSource) return;
    setScreen("processing");
    setTaskError(undefined);
    setSlow(false);
    setResultUrl(undefined);
    setPollStartedAt(Date.now());
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
      if (!response.ok) {
        setTaskError(body.code || "UNEXPECTED_ERROR");
        return;
      }
      setActiveRequestId(body.requestId);
    } catch {
      setTaskError("SERVICE_UNAVAILABLE");
    }
  };

  useEffect(() => {
    if (!activeRequestId || screen !== "processing") return;
    let cancelled = false;
    const delays = [2000, 3000, 5000];
    let attempt = 0;
    const poll = async () => {
      if (cancelled) return;
      const started = pollStartedAt || Date.now();
      if (Date.now() - started >= 60000) {
        setSlow(true);
        return;
      }
      try {
        const response = await fetch(`/api/vto-status/${activeRequestId}`, { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        if (body.status === "success") {
          setResultUrl(body.resultUrl);
          setScreen("result");
          setActiveRequestId(undefined);
          return;
        }
        if (body.status === "error") {
          setTaskError(body.code || "TASK_FAILED");
          setActiveRequestId(undefined);
          return;
        }
      } catch {
        setTaskError("SERVICE_UNAVAILABLE");
        setActiveRequestId(undefined);
        return;
      }
      const delay = delays[Math.min(attempt, delays.length - 1)];
      attempt += 1;
      window.setTimeout(poll, delay);
    };
    window.setTimeout(poll, delays[0]);
    return () => {
      cancelled = true;
    };
  }, [activeRequestId, screen, pollStartedAt]);

  const retry = () => {
    setTaskError(undefined);
    startVto();
  };

  const refine = (preference: PreferenceId) => {
    const already = context.preferences.includes(preference);
    const nextPreferences = already
      ? context.preferences
      : context.preferences.length < 3
        ? [...context.preferences, preference]
        : [preference, ...context.preferences.slice(0, 2)];
    const nextContext = { ...context, preferences: nextPreferences };
    const nextVersion = recommendationVersion + 1;
    setContext(nextContext);
    setRecommendationVersion(nextVersion);
    setRevisionNote(
      already
        ? `You revisited “${preferenceLabels[preference]}”; the same brief is still in view.`
        : `You added “${preferenceLabels[preference]},” so the shortlist moved around that priority.`,
    );
    createPlans(nextContext, nextVersion);
  };

  const reset = async () => {
    if (!window.confirm("Delete this session and its saved plans? This cannot be undone.")) return;
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setScreen("start");
    setMode("example");
    setContext(exampleBrief);
    setPlans([]);
    setSelectedPlan(undefined);
    setSourceFile(undefined);
    setSourcePreview(undefined);
    setActiveRequestId(undefined);
    setResultUrl(undefined);
    setTaskError(undefined);
    setSaved(false);
    setRevisionNote(undefined);
    setRecommendationVersion(1);
  };

  return (
    <>
      <SiteHeader onStart={startExample} showReset={screen !== "start"} onReset={reset} />
      {screen === "start" ? (
        <>
          <main className="flex flex-col bg-background pt-14">
            <LandingPage onExample={startExample} onUpload={startUpload} />
          </main>
          <SiteFooter />
        </>
      ) : (
        <main className="min-h-screen bg-background pt-14">
          <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-8 lg:px-[30px] lg:py-14">
            {screen === "upload" && (
              <UploadPanel
                onContinue={confirmUpload}
                onCancel={() => setScreen("start")}
                preview={sourcePreview}
                error={uploadError}
                onFile={handleFile}
              />
            )}
            {(screen === "context" || screen === "preferences") && (
              <>
                <StepRail current="context" />
                {screen === "context" ? (
                  <ContextForm
                    context={context}
                    onChange={setContext}
                    onContinue={() => setScreen("preferences")}
                    onBack={() => setScreen(mode === "upload" ? "upload" : "start")}
                  />
                ) : (
                  <PreferencesForm
                    context={context}
                    onChange={setContext}
                    onContinue={openPlans}
                    onBack={() => setScreen("context")}
                  />
                )}
              </>
            )}
            {screen === "plans" && (
              <>
                <StepRail current="plans" />
                {revisionNote && (
                  <div className="mx-auto mb-5 flex max-w-[1200px] gap-2 text-xs text-brand-light">
                    <span>↻</span>
                    {revisionNote}
                  </div>
                )}
                <PlansView
                  plans={plans}
                  context={context}
                  onSelect={selectPlan}
                  onBack={() => setScreen("context")}
                  onReset={reset}
                  onRefine={refine}
                />
              </>
            )}
            {screen === "detail" && selectedPlan && (
              <>
                <StepRail current="detail" />
                <DetailView
                  plan={selectedPlan}
                  onBack={() => setScreen("plans")}
                  onTry={startVto}
                  onViewItem={() => window.open(selectedPlan.productUrl, "_blank", "noopener,noreferrer")}
                  saved={saved}
                  onSave={() => setSaved(true)}
                />
              </>
            )}
            {screen === "processing" && (
              <>
                <StepRail current="processing" />
                <ProcessingView error={taskError} slow={slow} onRetry={retry} onBack={() => setScreen("plans")} errorMessages={errorMessages} />
              </>
            )}
            {screen === "result" && selectedPlan && resultUrl && (
              <>
                <StepRail current="result" />
                <ResultCompare
                  resultUrl={resultUrl}
                  originalUrl={originalUrl}
                  plan={selectedPlan}
                  onRefine={refine}
                  onChooseAnother={() => setScreen("plans")}
                  onReset={reset}
                  saved={saved}
                  onSave={() => setSaved(true)}
                />
              </>
            )}
          </div>
        </main>
      )}
    </>
  );
}

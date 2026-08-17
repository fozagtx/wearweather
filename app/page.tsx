"use client";

import { useEffect, useRef, useState } from "react";
import { AgentDock, solutionsFromPlans } from "@/components/agent-dock";
import { CanvasDashboard } from "@/components/canvas-dashboard";
import { LandingPage } from "@/components/landing/landing-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { exampleBrief, blankBrief, examplePhotoUrl } from "@/lib/example-brief";
import { preparePhotoFile } from "@/lib/image-prep";
import { recommendMakeup, type MakeupPlan } from "@/lib/makeup-engine";
import { rankWearPlans } from "@/lib/recommendation-engine";
import { type AgentSolution, type StudioPhoto, type WearContext, type WearPlan } from "@/lib/types";
const errorMessages: Record<string, string> = {
  PHOTO_FORMAT_INVALID: "Use a JPG, PNG, or WebP image.",
  PHOTO_TOO_LARGE: "This image is larger than 12 MB. Choose a smaller file.",
  PHOTO_GUIDANCE_NEEDED: "Use one clear, front-facing standing photo with your whole face in frame and shoulders visible.",
  REFERENCE_INVALID: "This outfit image is not suitable for try-on. Choose another Wear Plan.",
  TASK_FAILED: "We could not create this visual rehearsal. Your plan is still here; please try again.",
  SERVICE_UNAVAILABLE: "The try-on service is temporarily unavailable. Wait a moment, then try again.",
  RATE_LIMITED: "YouCam asked us to slow down. Wait a few seconds, then try again. You do not need to leave this page.",
  SESSION_EXPIRED: "This session has expired for privacy. Start a new rehearsal.",
  UNEXPECTED_ERROR: "Something went wrong. No new result was created.",
};

export default function Home() {
  const [screen, setScreen] = useState<"start" | "board">("start");
  const [mode, setMode] = useState<"example" | "upload">("example");
  const [context, setContext] = useState<WearContext>(exampleBrief);
  const [plans, setPlans] = useState<WearPlan[]>(() => rankWearPlans(exampleBrief, 1));
  const [selectedPlan, setSelectedPlan] = useState<WearPlan>();
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>();
  const [activeRequestId, setActiveRequestId] = useState<string>();
  const [resultUrl, setResultUrl] = useState<string>();
  const [taskError, setTaskError] = useState<string>();
  const [slow, setSlow] = useState(false);
  const [recommendationVersion, setRecommendationVersion] = useState(1);
  const [uploadError, setUploadError] = useState<string>();
  const [pollStartedAt, setPollStartedAt] = useState<number>();
  const [makeupPlan, setMakeupPlan] = useState<MakeupPlan>(() => recommendMakeup(exampleBrief, []));
  const [makeupUrl, setMakeupUrl] = useState<string>();
  const [makeupRequestId, setMakeupRequestId] = useState<string>();
  const [makeupBusy, setMakeupBusy] = useState(false);
  const [makeupError, setMakeupError] = useState<string>();
  const [makeupPollStartedAt, setMakeupPollStartedAt] = useState<number>();
  const [solutions, setSolutions] = useState<AgentSolution[]>([]);
  const vtoLock = useRef(false);
  const makeupLock = useRef(false);

  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);
  const sourceFile = selectedPhoto?.file;
  const sourcePreview = selectedPhoto?.url;
  const hasSource = mode === "example" || Boolean(sourceFile);
  const originalUrl = sourcePreview || (mode === "example" ? examplePhotoUrl : "");

  useEffect(() => {
    const ranked = rankWearPlans(context, recommendationVersion);
    setPlans(ranked);
    setSelectedPlan((current) => ranked.find((plan) => plan.lookId === current?.lookId) || ranked[0]);
  }, [context, recommendationVersion]);

  const startExample = () => {
    setMode("example");
    setContext(exampleBrief);
    setScreen("board");
    window.scrollTo(0, 0);
  };

  const startUpload = () => {
    setMode("upload");
    setContext(blankBrief);
    setScreen("board");
    window.scrollTo(0, 0);
  };

  const handleAddFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploadError(undefined);
    const remaining = 8 - photos.length;
    if (remaining <= 0) {
      setUploadError("Eight photos max on the board. Remove one to add another.");
      return;
    }
    const added: StudioPhoto[] = [];
    for (const file of [...list].slice(0, remaining)) {
      try {
        const prepared = await preparePhotoFile(file);
        const index = photos.length + added.length;
        added.push({
          id: crypto.randomUUID(),
          file: prepared,
          url: URL.createObjectURL(prepared),
          label: `Photo ${index + 1}`,
          x: 24 + (index % 4) * 148,
          y: 24 + Math.floor(index / 4) * 192,
        });
      } catch (error) {
        const code = error instanceof Error ? error.message : "PHOTO_FORMAT_INVALID";
        setUploadError(code === "PHOTO_TOO_LARGE" ? "That file is larger than 12 MB." : "Use a JPG, PNG, or WebP.");
      }
    }
    if (!added.length) return;
    setMode("upload");
    setPhotos((current) => [...current, ...added]);
    setSelectedPhotoId((current) => current || added[0].id);
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const next = current.filter((photo) => photo.id !== id);
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });
    setSelectedPhotoId((current) => (current === id ? photos.find((photo) => photo.id !== id)?.id : current));
  };

  const startVto = async (plan = selectedPlan) => {
    if (!plan || !hasSource || vtoLock.current) return;
    if (mode === "upload" && !sourceFile) {
      setTaskError("PHOTO_GUIDANCE_NEEDED");
      return;
    }
    vtoLock.current = true;
    setSelectedPlan(plan);
    setTaskError(undefined);
    setSlow(false);
    setResultUrl(undefined);
    setMakeupUrl(undefined);
    setMakeupError(undefined);
    setMakeupBusy(false);
    setMakeupRequestId(undefined);
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
      form.append("lookId", plan.lookId);
      const response = await fetch("/api/vto", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) {
        setTaskError(body.code || "UNEXPECTED_ERROR");
        return;
      }
      setActiveRequestId(body.requestId);
    } catch {
      setTaskError("SERVICE_UNAVAILABLE");
    } finally {
      vtoLock.current = false;
    }
  };

  useEffect(() => {
    if (!activeRequestId) return;
    let cancelled = false;
    const delays = [2000, 3000, 5000];
    let attempt = 0;
    const poll = async () => {
      if (cancelled) return;
      const started = pollStartedAt || Date.now();
      const elapsed = Date.now() - started;
      if (elapsed >= 120000) {
        setTaskError("TASK_FAILED");
        setActiveRequestId(undefined);
        return;
      }
      if (elapsed >= 40000) setSlow(true);
      try {
        const response = await fetch(`/api/vto-status/${activeRequestId}`, { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        if (body.status === "success" && body.resultUrl) {
          setResultUrl(body.resultUrl);
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
  }, [activeRequestId, pollStartedAt]);

  const sourceAsFile = async () => {
    if (sourceFile) return sourceFile;
    const response = await fetch(examplePhotoUrl);
    const blob = await response.blob();
    return new File([blob], "example-source.jpg", { type: blob.type || "image/jpeg" });
  };

  const startMakeup = async () => {
    if (!selectedPlan || !hasSource || !resultUrl || makeupLock.current) return;
    makeupLock.current = true;
    setMakeupBusy(true);
    setMakeupError(undefined);
    setMakeupPollStartedAt(Date.now());
    try {
      const file = await sourceAsFile();
      const form = new FormData();
      form.append("photo", file);
      form.append("lookId", selectedPlan.lookId);
      form.append("sourceUrl", resultUrl);
      form.append("context", JSON.stringify(context));
      if (makeupPlan?.templateId) form.append("templateId", makeupPlan.templateId);
      const response = await fetch("/api/makeup", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) {
        setMakeupError(body.code || "UNEXPECTED_ERROR");
        setMakeupBusy(false);
        return;
      }
      if (body.plan) setMakeupPlan(body.plan);
      setMakeupRequestId(body.requestId);
    } catch {
      setMakeupError("SERVICE_UNAVAILABLE");
      setMakeupBusy(false);
    } finally {
      makeupLock.current = false;
    }
  };

  useEffect(() => {
    if (!resultUrl || screen !== "board") return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/makeup-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context }),
        });
        const body = await response.json();
        if (!cancelled && response.ok && body.plan) setMakeupPlan(body.plan);
      } catch {
        if (!cancelled) setMakeupPlan(recommendMakeup(context, []));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [screen, context, resultUrl]);

  useEffect(() => {
    if (!makeupRequestId) return;
    let cancelled = false;
    const delays = [2000, 3000, 5000];
    let attempt = 0;
    const poll = async () => {
      if (cancelled) return;
      const started = makeupPollStartedAt || Date.now();
      const elapsed = Date.now() - started;
      if (elapsed >= 120000) {
        setMakeupError("TASK_FAILED");
        setMakeupBusy(false);
        setMakeupRequestId(undefined);
        return;
      }
      try {
        const response = await fetch(`/api/makeup-status/${makeupRequestId}`, { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        if (body.status === "success" && body.resultUrl) {
          setMakeupUrl(body.resultUrl);
          setMakeupBusy(false);
          setMakeupRequestId(undefined);
          return;
        }
        if (body.status === "error") {
          setMakeupError(body.code || "TASK_FAILED");
          setMakeupBusy(false);
          setMakeupRequestId(undefined);
          return;
        }
      } catch {
        setMakeupError("SERVICE_UNAVAILABLE");
        setMakeupBusy(false);
        setMakeupRequestId(undefined);
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
  }, [makeupRequestId, screen, makeupPollStartedAt]);

  const retry = () => {
    setTaskError(undefined);
    startVto();
  };

  const reset = async () => {
    if (!window.confirm("Leave this rehearsal and return to the overview? Plans saved in this session will be cleared.")) return;
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setScreen("start");
    setMode("example");
    setContext(exampleBrief);
    setPlans([]);
    setSelectedPlan(undefined);
    setPhotos([]);
    setSelectedPhotoId(undefined);
    setActiveRequestId(undefined);
    setResultUrl(undefined);
    setMakeupPlan(recommendMakeup(exampleBrief, []));
    setMakeupUrl(undefined);
    setMakeupRequestId(undefined);
    setMakeupBusy(false);
    setMakeupError(undefined);
    setTaskError(undefined);
    setRecommendationVersion(1);
    setSolutions([]);
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
        <main className="bg-background pt-14">
          <CanvasDashboard
            mode={mode}
            context={context}
            onContext={setContext}
            photos={photos}
            selectedPhotoId={selectedPhotoId}
            uploadError={uploadError}
            examplePhotoUrl={examplePhotoUrl}
            onAddPhotos={handleAddFiles}
            onSelectPhoto={setSelectedPhotoId}
            onRemovePhoto={removePhoto}
            plans={plans}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            originalUrl={originalUrl}
            resultUrl={resultUrl}
            taskError={taskError}
            slow={slow}
            vtoRunning={Boolean(activeRequestId)}
            onTryOn={() => startVto()}
            onRetry={retry}
            makeupPlan={makeupPlan}
            makeupUrl={makeupUrl}
            makeupBusy={makeupBusy}
            makeupError={makeupError}
            onTryMakeup={startMakeup}
            errorMessages={errorMessages}
            solutions={solutions}
            onAcceptSolution={(solution) => {
              setSolutions((current) =>
                current.map((item) =>
                  item.id === solution.id ? { ...item, status: "accepted" } : item.status === "open" ? { ...item, status: "dismissed" } : item,
                ),
              );
              void startVto(solution.plan);
            }}
            onDismissSolution={(id) => {
              setSolutions((current) => current.map((item) => (item.id === id ? { ...item, status: "dismissed" } : item)));
            }}
          />
          <AgentDock
            context={context}
            onContext={setContext}
            onSolutions={(note, nextPlans) => {
              setSolutions(solutionsFromPlans(note, nextPlans));
            }}
          />
        </main>
      )}
    </>
  );
}

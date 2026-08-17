"use client";

import { useEffect, useRef, useState } from "react";
import { AgentDock, solutionsFromPlans } from "@/components/agent-dock";
import { CanvasDashboard } from "@/components/canvas-dashboard";
import { LandingPage } from "@/components/landing/landing-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StudioToasts, useStudioToasts } from "@/components/studio-toasts";
import { exampleBrief, blankBrief, examplePhotoUrl } from "@/lib/example-brief";
import { preparePhotoFile } from "@/lib/image-prep";
import { type HairPlan } from "@/lib/hair-engine";
import { type MakeupPlan } from "@/lib/makeup-engine";
import { rankWearPlans } from "@/lib/recommendation-engine";
import { jobFromHairPhase, studioStatus, type StudioJob } from "@/lib/studio-status";
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
  const [plans, setPlans] = useState<WearPlan[]>(() => rankWearPlans(exampleBrief, 1, [examplePhotoUrl]));
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
  const [makeupPlans, setMakeupPlans] = useState<MakeupPlan[]>([]);
  const [makeupPlan, setMakeupPlan] = useState<MakeupPlan>();
  const [makeupUrl, setMakeupUrl] = useState<string>();
  const [makeupRequestId, setMakeupRequestId] = useState<string>();
  const [makeupBusy, setMakeupBusy] = useState(false);
  const [makeupError, setMakeupError] = useState<string>();
  const [makeupPollStartedAt, setMakeupPollStartedAt] = useState<number>();
  const [hairPlans, setHairPlans] = useState<HairPlan[]>([]);
  const [hairPlan, setHairPlan] = useState<HairPlan>();
  const [hairUrl, setHairUrl] = useState<string>();
  const [hairRequestId, setHairRequestId] = useState<string>();
  const [hairBusy, setHairBusy] = useState(false);
  const [hairError, setHairError] = useState<string>();
  const [hairPollStartedAt, setHairPollStartedAt] = useState<number>();
  const [hairPhase, setHairPhase] = useState<"hair" | "clothes" | "makeup">("hair");
  const { toasts, show, dismiss, dismissAll } = useStudioToasts();
  const [editUrl, setEditUrl] = useState<string>();
  const [editBeforeUrl, setEditBeforeUrl] = useState<string>();
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string>();
  const [editStartedAt, setEditStartedAt] = useState<number>();
  const [orbitFrames, setOrbitFrames] = useState<string[]>();
  const [orbitBusy, setOrbitBusy] = useState(false);
  const [viewMode, setViewMode] = useState<"compare" | "spin">("compare");
  const [solutions, setSolutions] = useState<AgentSolution[]>([]);
  const vtoLock = useRef(false);
  const makeupGen = useRef(0);
  const hairGen = useRef(0);
  const orbitGen = useRef(0);
  const editLock = useRef(false);

  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);
  const sourceFile = selectedPhoto?.file;
  const sourcePreview = selectedPhoto?.url;
  const hasSource = mode === "example" || Boolean(sourceFile);
  const originalUrl = sourcePreview || (mode === "example" ? examplePhotoUrl : "");
  const wornImageUrl = editUrl || hairUrl || makeupUrl || resultUrl;

  const notifyJob = (job: StudioJob, tone: "running" | "done") => {
    const copy = studioStatus[job];
    show({
      id: "job",
      tone,
      eyebrow: copy.eyebrow,
      title: tone === "running" ? copy.runningTitle : copy.doneTitle,
      detail: tone === "running" ? copy.runningDetail : copy.doneDetail,
    });
  };

  const notifyError = (eyebrow: string, code?: string) => {
    show({
      id: "job",
      tone: "error",
      eyebrow,
      title: errorMessages[code || ""] || errorMessages.UNEXPECTED_ERROR,
    });
  };

  useEffect(() => {
    if (screen !== "board") {
      dismissAll();
      return;
    }
    if (activeRequestId) notifyJob("look", "running");
    else if (makeupBusy) notifyJob("makeup", "running");
    else if (hairBusy) notifyJob(jobFromHairPhase(hairPhase), "running");
    else if (editBusy) notifyJob("edit", "running");
    else if (orbitBusy) notifyJob("orbit", "running");
  }, [screen, activeRequestId, makeupBusy, hairBusy, hairPhase, editBusy, orbitBusy, dismissAll, show]);

  useEffect(() => {
    const ranked = rankWearPlans(context, recommendationVersion, originalUrl ? [originalUrl] : []);
    setPlans(ranked);
    setSelectedPlan((current) => ranked.find((plan) => plan.lookId === current?.lookId) || ranked[0]);
  }, [context, recommendationVersion, originalUrl]);

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
      notifyError("Look", "PHOTO_GUIDANCE_NEEDED");
      return;
    }
    vtoLock.current = true;
    makeupGen.current += 1;
    hairGen.current += 1;
    orbitGen.current += 1;
    setSelectedPlan(plan);
    setTaskError(undefined);
    setSlow(false);
    setResultUrl(undefined);
    setMakeupUrl(undefined);
    setMakeupError(undefined);
    setMakeupBusy(false);
    setMakeupRequestId(undefined);
    setHairUrl(undefined);
    setHairError(undefined);
    setHairBusy(false);
    setHairPhase("hair");
    setHairRequestId(undefined);
    setEditUrl(undefined);
    setEditBeforeUrl(undefined);
    setEditError(undefined);
    setEditBusy(false);
    setOrbitFrames(undefined);
    setOrbitBusy(false);
    setViewMode("compare");
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
        notifyError("Look", body.code || "UNEXPECTED_ERROR");
        return;
      }
      setActiveRequestId(body.requestId);
    } catch {
      setTaskError("SERVICE_UNAVAILABLE");
      notifyError("Look", "SERVICE_UNAVAILABLE");
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
        notifyError("Look", "TASK_FAILED");
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
          notifyJob("look", "done");
          return;
        }
        if (body.status === "error") {
          setTaskError(body.code || "TASK_FAILED");
          setActiveRequestId(undefined);
          notifyError("Look", body.code || "TASK_FAILED");
          return;
        }
      } catch {
        setTaskError("SERVICE_UNAVAILABLE");
        setActiveRequestId(undefined);
        notifyError("Look", "SERVICE_UNAVAILABLE");
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

  const startMakeup = async (plan = makeupPlan) => {
    if (!selectedPlan || !resultUrl || !plan?.templateId) return;
    const gen = ++makeupGen.current;
    setMakeupPlan(plan);
    setMakeupBusy(true);
    setMakeupError(undefined);
    setHairUrl(undefined);
    setHairError(undefined);
    setEditUrl(undefined);
    setMakeupRequestId(undefined);
    setMakeupPollStartedAt(Date.now());
    try {
      const form = new FormData();
      form.append("lookId", selectedPlan.lookId);
      form.append("sourceUrl", resultUrl);
      form.append("context", JSON.stringify(context));
      form.append("templateId", plan.templateId);
      const response = await fetch("/api/makeup", { method: "POST", body: form });
      const body = await response.json();
      if (makeupGen.current !== gen) return;
      if (!response.ok) {
        setMakeupError(body.code || "UNEXPECTED_ERROR");
        setMakeupBusy(false);
        notifyError("Makeup", body.code || "UNEXPECTED_ERROR");
        return;
      }
      setMakeupRequestId(body.requestId);
    } catch {
      if (makeupGen.current !== gen) return;
      setMakeupError("SERVICE_UNAVAILABLE");
      setMakeupBusy(false);
      notifyError("Makeup", "SERVICE_UNAVAILABLE");
    }
  };

  useEffect(() => {
    if (screen !== "board") return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/makeup-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context }),
        });
        const body = await response.json();
        if (cancelled || !response.ok) return;
        const next: MakeupPlan[] = (Array.isArray(body.plans) ? body.plans : body.plan ? [body.plan] : []).filter(
          (plan: MakeupPlan) => plan?.templateId,
        );
        setMakeupPlans(next);
        setMakeupPlan((current) => next.find((plan) => plan.templateId === current?.templateId) || next[0]);
      } catch {
        if (cancelled) return;
        setMakeupPlans([]);
        setMakeupPlan(undefined);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [screen, context]);

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
        notifyError("Makeup", "TASK_FAILED");
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
          notifyJob("makeup", "done");
          return;
        }
        if (body.status === "error") {
          setMakeupError(body.code || "TASK_FAILED");
          setMakeupBusy(false);
          setMakeupRequestId(undefined);
          notifyError("Makeup", body.code || "TASK_FAILED");
          return;
        }
      } catch {
        setMakeupError("SERVICE_UNAVAILABLE");
        setMakeupBusy(false);
        setMakeupRequestId(undefined);
        notifyError("Makeup", "SERVICE_UNAVAILABLE");
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

  const startHair = async (plan = hairPlan) => {
    const worn = makeupUrl || resultUrl;
    if (!selectedPlan || !worn || !plan?.templateId || !hasSource) return;
    const gen = ++hairGen.current;
    setHairPlan(plan);
    setHairBusy(true);
    setHairPhase("hair");
    setHairError(undefined);
    setEditUrl(undefined);
    setHairRequestId(undefined);
    setHairPollStartedAt(Date.now());
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
      form.append("context", JSON.stringify(context));
      form.append("templateId", plan.templateId);
      if (makeupUrl && makeupPlan?.templateId) form.append("makeupTemplateId", makeupPlan.templateId);
      const response = await fetch("/api/hair", { method: "POST", body: form });
      const body = await response.json();
      if (hairGen.current !== gen) return;
      if (!response.ok) {
        setHairError(body.code || "UNEXPECTED_ERROR");
        setHairBusy(false);
        notifyError("Hair", body.code || "UNEXPECTED_ERROR");
        return;
      }
      setHairRequestId(body.requestId);
    } catch {
      if (hairGen.current !== gen) return;
      setHairError("SERVICE_UNAVAILABLE");
      setHairBusy(false);
      notifyError("Hair", "SERVICE_UNAVAILABLE");
    }
  };

  useEffect(() => {
    if (screen !== "board") return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/hair-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context }),
        });
        const body = await response.json();
        if (cancelled || !response.ok) return;
        const next: HairPlan[] = (Array.isArray(body.plans) ? body.plans : body.plan ? [body.plan] : []).filter(
          (plan: HairPlan) => plan?.templateId,
        );
        setHairPlans(next);
        setHairPlan((current) => next.find((plan) => plan.templateId === current?.templateId) || next[0]);
      } catch {
        if (cancelled) return;
        setHairPlans([]);
        setHairPlan(undefined);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [screen, context]);

  useEffect(() => {
    if (!hairRequestId) return;
    let cancelled = false;
    const delays = [2000, 3000, 5000];
    let attempt = 0;
    const poll = async () => {
      if (cancelled) return;
      const started = hairPollStartedAt || Date.now();
      const elapsed = Date.now() - started;
      if (elapsed >= 240000) {
        setHairError("TASK_FAILED");
        setHairBusy(false);
        setHairRequestId(undefined);
        notifyError("Hair", "TASK_FAILED");
        return;
      }
      try {
        const response = await fetch(`/api/hair-status/${hairRequestId}`, { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        if (body.phase === "hair" || body.phase === "clothes" || body.phase === "makeup") {
          setHairPhase(body.phase);
        }
        if (body.status === "success" && body.resultUrl) {
          setHairUrl(body.resultUrl);
          setHairBusy(false);
          setHairRequestId(undefined);
          notifyJob("hair", "done");
          return;
        }
        if (body.status === "error") {
          setHairError(body.code || "TASK_FAILED");
          setHairBusy(false);
          setHairRequestId(undefined);
          notifyError("Hair", body.code || "TASK_FAILED");
          return;
        }
      } catch {
        setHairError("SERVICE_UNAVAILABLE");
        setHairBusy(false);
        setHairRequestId(undefined);
        notifyError("Hair", "SERVICE_UNAVAILABLE");
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
  }, [hairRequestId, screen, hairPollStartedAt]);

  useEffect(() => {
    if (screen !== "board" || !wornImageUrl || !resultUrl) return;
    if (activeRequestId || makeupBusy || hairBusy || editBusy) return;
    const gen = ++orbitGen.current;
    setOrbitBusy(true);
    setOrbitFrames(undefined);
    setViewMode("compare");
    const load = async () => {
      try {
        const response = await fetch("/api/orbit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: wornImageUrl }),
        });
        const body = await response.json();
        if (orbitGen.current !== gen) return;
        if (!response.ok || !Array.isArray(body.frames) || body.frames.length < 2) {
          setOrbitBusy(false);
          show({
            id: "job",
            tone: "error",
            eyebrow: "360",
            title: "The spin did not build",
            detail: "Compare is still here.",
          });
          return;
        }
        setOrbitFrames(body.frames);
        setViewMode("spin");
        setOrbitBusy(false);
        notifyJob("orbit", "done");
      } catch {
        if (orbitGen.current !== gen) return;
        setOrbitBusy(false);
        show({
          id: "job",
          tone: "error",
          eyebrow: "360",
          title: "The spin did not build",
          detail: "Compare is still here.",
        });
      }
    };
    void load();
  }, [screen, wornImageUrl, resultUrl, activeRequestId, makeupBusy, hairBusy, editBusy]);

  const startEdit = async (prompt: string) => {
    const source = wornImageUrl;
    if (!source || editLock.current) return;
    editLock.current = true;
    setEditBeforeUrl(source);
    setEditBusy(true);
    setEditError(undefined);
    setEditStartedAt(Date.now());
    try {
      const response = await fetch("/api/edit-look", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: source, prompt }),
      });
      const body = await response.json();
      if (!response.ok) {
        setEditError(body.code || "UNEXPECTED_ERROR");
        setEditBusy(false);
        notifyError("Edit", body.code || "UNEXPECTED_ERROR");
        return;
      }
      setEditUrl(body.resultUrl);
      notifyJob("edit", "done");
    } catch {
      setEditError("SERVICE_UNAVAILABLE");
      notifyError("Edit", "SERVICE_UNAVAILABLE");
    } finally {
      setEditBusy(false);
      editLock.current = false;
    }
  };

  const retry = () => {
    setTaskError(undefined);
    startVto();
  };

  const reset = async () => {
    if (!window.confirm("Leave this studio and return home? Plans in this session will be cleared.")) return;
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
    setMakeupPlans([]);
    setMakeupPlan(undefined);
    setMakeupUrl(undefined);
    setMakeupRequestId(undefined);
    setMakeupBusy(false);
    setMakeupError(undefined);
    setHairPlans([]);
    setHairPlan(undefined);
    setHairUrl(undefined);
    setHairRequestId(undefined);
    setHairBusy(false);
    setHairPhase("hair");
    setHairError(undefined);
    dismissAll();
    setEditUrl(undefined);
    setEditBeforeUrl(undefined);
    setEditBusy(false);
    setEditError(undefined);
    setOrbitFrames(undefined);
    setOrbitBusy(false);
    setViewMode("compare");
    setTaskError(undefined);
    setRecommendationVersion(1);
    setSolutions([]);
  };

  return (
    <>
      <SiteHeader onStart={startExample} showReset={screen !== "start"} onReset={reset} />
      <StudioToasts toasts={toasts} onDismiss={dismiss} />
      {screen === "start" ? (
        <>
          <main className="flex flex-col bg-background pt-14">
            <LandingPage onExample={startExample} onUpload={startUpload} />
          </main>
          <SiteFooter />
        </>
      ) : (
        <main className="flex h-[100svh] flex-col bg-background pt-14">
          <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
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
            vtoStartedAt={pollStartedAt}
            makeupStartedAt={makeupPollStartedAt}
            onTryOn={() => startVto()}
            onRetry={retry}
            makeupPlan={makeupPlan}
            makeupPlans={makeupPlans}
            onSelectMakeup={(plan) => {
              setMakeupPlan(plan);
              setMakeupUrl(undefined);
              setMakeupError(undefined);
              setHairUrl(undefined);
              setEditUrl(undefined);
              setContext((current) => ({ ...current, makeupFinish: true }));
              if (resultUrl) void startMakeup(plan);
            }}
            makeupUrl={makeupUrl}
            makeupBusy={makeupBusy}
            makeupError={makeupError}
            onTryMakeup={startMakeup}
            hairPlan={hairPlan}
            hairPlans={hairPlans}
            onSelectHair={(plan) => {
              setHairPlan(plan);
              setHairUrl(undefined);
              setHairError(undefined);
              setEditUrl(undefined);
              if (resultUrl) void startHair(plan);
            }}
            hairUrl={hairUrl}
            hairBusy={hairBusy}
            hairError={hairError}
            hairPhase={hairPhase}
            hairStartedAt={hairPollStartedAt}
            onTryHair={startHair}
            editUrl={editUrl}
            editBeforeUrl={editBeforeUrl}
            editBusy={editBusy}
            editError={editError}
            editStartedAt={editStartedAt}
            onEditLook={startEdit}
            orbitFrames={orbitFrames}
            orbitBusy={orbitBusy}
            viewMode={viewMode}
            onViewMode={setViewMode}
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
          </div>
          <AgentDock
            context={context}
            onContext={setContext}
            solutions={solutions}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            canTryOn={hasSource}
            busy={Boolean(activeRequestId)}
            canTryMakeup={Boolean(resultUrl && makeupPlan && !makeupUrl && !makeupBusy)}
            makeupBusy={makeupBusy}
            makeupTitle={makeupPlan?.title}
            onAcceptMakeup={() => void startMakeup()}
            canTryHair={Boolean(resultUrl && hairPlan?.templateId && !hairUrl && !hairBusy && !makeupBusy)}
            hairBusy={hairBusy}
            hairTitle={hairPlan?.title}
            onAcceptHair={() => void startHair()}
            wornImageUrl={wornImageUrl}
            onEditResult={(url) => {
              if (!url) return;
              setEditBeforeUrl(wornImageUrl);
              setEditUrl(url);
              setEditError(undefined);
              setEditBusy(false);
            }}
            onAcceptSolution={(solution) => {
              setSolutions((current) =>
                current.map((item) =>
                  item.id === solution.id ? { ...item, status: "accepted" } : item.status === "open" ? { ...item, status: "dismissed" } : item,
                ),
              );
              void startVto(solution.plan);
            }}
            onSolutions={(note, nextPlans, _nextContext, nextMakeup, nextHair) => {
              setSolutions(solutionsFromPlans(note, nextPlans));
              if (nextMakeup?.length) {
                setMakeupPlans(nextMakeup);
                setMakeupPlan(nextMakeup[0]);
              }
              if (nextHair?.length) {
                setHairPlans(nextHair);
                setHairPlan(nextHair[0]);
              }
            }}
          />
        </main>
      )}
    </>
  );
}

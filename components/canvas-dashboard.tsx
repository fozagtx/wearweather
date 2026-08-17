"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
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

const DashCtx = createContext<DashboardProps | null>(null);

function useDash() {
  const value = useContext(DashCtx);
  if (!value) throw new Error("Canvas dashboard context missing");
  return value;
}

const SIZE = {
  photos: { w: 340 },
  brief: { w: 380 },
  plan: { w: 300 },
  stage: { w: 360 },
  suggest: { w: 280 },
};

function nodeBox(id: string, type: string, x: number, y: number, width: number, data: Record<string, string> = {}): Node {
  return {
    id,
    type,
    position: { x, y },
    data,
    style: { width },
    width,
  };
}

function layoutNodes(width: number, plans: WearPlan[]): Node[] {
  const stacked = width < 960;
  const photosW = SIZE.photos.w;
  const briefW = SIZE.brief.w;
  const planW = SIZE.plan.w;
  const stageW = SIZE.stage.w;
  const core = stacked
    ? [
        nodeBox("photos", "photos", 32, 32, photosW),
        nodeBox("brief", "brief", 32, 720, briefW),
        nodeBox("stage", "stage", 32, 1680, stageW),
      ]
    : [
        nodeBox("photos", "photos", 40, 40, photosW),
        nodeBox("brief", "brief", 40, 760, briefW),
        nodeBox("stage", "stage", 40 + photosW + 96 + planW + 96, 40, stageW),
      ];
  const planX = stacked ? 32 + Math.max(photosW, briefW) + 80 : 40 + photosW + 96;
  const planNodes = plans.map((item, index) =>
    nodeBox(`plan-${item.lookId}`, "plan", planX, 40 + index * 560, planW, { lookId: item.lookId }),
  );
  return [...core, ...planNodes];
}

function layoutEdges(plans: WearPlan[], selectedPlan?: WearPlan): Edge[] {
  const marker = { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#c4c4b4" };
  const active = { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#d25611" };
  return [
    { id: "e-photos-stage", source: "photos", target: "stage", markerEnd: marker },
    ...plans.flatMap((plan) => {
      const on = selectedPlan?.lookId === plan.lookId;
      return [
        { id: `e-brief-${plan.lookId}`, source: "brief", target: `plan-${plan.lookId}`, markerEnd: marker },
        {
          id: `e-plan-${plan.lookId}-stage`,
          source: `plan-${plan.lookId}`,
          target: "stage",
          animated: on,
          markerEnd: on ? active : marker,
          style: on ? { stroke: "#d25611", strokeWidth: 2 } : undefined,
        },
      ];
    }),
  ];
}

function Station({
  kicker,
  title,
  hint,
  children,
  selected = false,
  source,
  target,
}: {
  kicker: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  selected?: boolean;
  source?: Position;
  target?: Position;
}) {
  return (
    <section className={`relative rounded-2xl border bg-card shadow-[0_1px_2px_rgba(26,26,20,0.04),0_12px_32px_rgba(26,26,20,0.05)] ${selected ? "border-foreground/40" : "border-border"}`}>
      {target && <Handle type="target" position={target} className="ww-handle" />}
      {source && <Handle type="source" position={source} className="ww-handle" />}
      <header className="flex cursor-grab items-center justify-between gap-3 px-4 pt-3 pb-1 active:cursor-grabbing">
        <span className="flex items-center gap-3">
          <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="size-0.5 rounded-full bg-muted-foreground/70" />
            ))}
          </span>
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">{kicker}</p>
        </span>
        <h2 className="text-sm font-medium tracking-[-0.2px]">{title}</h2>
      </header>
      {hint && <p className="px-4 pb-2 text-[11px] leading-relaxed text-muted-foreground">{hint}</p>}
      <div className="nodrag nopan nowheel px-4 pb-4">{children}</div>
    </section>
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

function PhotosNode({ selected }: NodeProps) {
  const dash = useDash();
  return (
    <Station kicker="01" title="Photos" hint="Pick the photo YouCam will dress." selected={selected} source={Position.Right}>
      <PhotoStudio
        photos={dash.photos}
        selectedId={dash.selectedPhotoId}
        error={dash.uploadError}
        examplePhotoUrl={dash.examplePhotoUrl}
        onAdd={dash.onAddPhotos}
        onSelect={dash.onSelectPhoto}
        onRemove={dash.onRemovePhoto}
      />
    </Station>
  );
}

function BriefNode({ selected }: NodeProps) {
  const { context, onContext } = useDash();
  return (
    <Station kicker="02" title="Brief" hint="The three looks re-rank as you change this." selected={selected} source={Position.Right}>
      <div className="grid gap-4">
        <label className="block">
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
        <label className="block">
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
        <div className="grid gap-3">
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
        </div>
        <div>
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
    </Station>
  );
}

function PlanNode({ selected, data }: NodeProps) {
  const { plans, selectedPlan, onSelectPlan } = useDash();
  const plan = plans.find((item) => item.lookId === String(data.lookId || ""));
  if (!plan) return null;
  const active = selectedPlan?.lookId === plan.lookId;
  return (
    <Station kicker={`0${plan.rank}`} title={plan.title} selected={selected || active} target={Position.Left} source={Position.Right}>
      <img src={plan.sourceImageUrl} alt="" className="block h-auto w-full rounded-xl" />
      <ul className="mt-3 space-y-1.5">
        {plan.reasons.slice(0, 2).map((reason) => (
          <li key={reason} className="text-[12px] leading-relaxed text-muted-foreground">
            {reason}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-mono tracking-[0.12em] text-brand-light">Before you buy </span>
        {plan.checkBeforeBuying}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PrimaryButton className="min-h-9 px-3 py-2 text-xs" onClick={() => onSelectPlan(plan)}>
          {active ? "Look connected" : "Use this look"}
        </PrimaryButton>
        <RetailerLink href={plan.productUrl} compact />
      </div>
    </Station>
  );
}

function StageNode({ selected }: NodeProps) {
  const dash = useDash();
  const [compare, setCompare] = useState(46);
  const [over, setOver] = useState(false);
  const showingMakeup = Boolean(dash.makeupUrl);
  const leftSrc = showingMakeup ? dash.resultUrl || dash.originalUrl : dash.originalUrl;
  const rightSrc = showingMakeup ? dash.makeupUrl || dash.resultUrl || dash.originalUrl : dash.resultUrl || dash.originalUrl;
  const status = dash.taskError ? "error" : dash.vtoRunning ? "running" : dash.resultUrl ? "done" : "idle";

  const takeDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setOver(false);
    const photoId = event.dataTransfer.getData(PHOTO_DRAG_TYPE);
    if (photoId) {
      dash.onSelectPhoto(photoId);
      return;
    }
    if (event.dataTransfer.files?.length) dash.onAddPhotos(event.dataTransfer.files);
  };

  const nextStep = !dash.originalUrl
    ? "Add or drop a photo first."
    : dash.solutions.some((item) => item.status === "open")
      ? "Accept a stylist card to try that look on this photo."
      : !dash.selectedPlan
        ? "Click Use this look on one of the ranked looks."
        : status === "running"
          ? "Stay here. YouCam is dressing this photo."
          : status === "done"
            ? "Drag the slider. Try makeup if you asked for a finish."
            : `Ready: dress this photo in ${dash.selectedPlan.title}.`;

  return (
    <Station kicker="04" title="Try-on" hint={nextStep} selected={selected} target={Position.Left}>
      <div>
        <div
          className={`relative rounded-xl border bg-[#ecece4] ${over ? "border-foreground" : "border-border"}`}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={takeDrop}
        >
          {status === "running" && (
            <div className="p-5 text-center">
              <p className="text-sm font-medium">Rendering on your photo</p>
              <p className="mt-2 text-[12px] text-muted-foreground">This can take up to two minutes.</p>
            </div>
          )}
          {status === "error" && (
            <div className="p-5 text-center">
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
          {status === "idle" && (
            <div className="relative">
              {dash.originalUrl ? (
                <img src={dash.originalUrl} alt="Photo that will be dressed" className="block h-auto w-full" />
              ) : (
                <p className="px-4 py-16 text-center text-[12px] text-muted-foreground">Drop a photo here.</p>
              )}
              {over && (
                <div className="absolute inset-0 grid place-items-center bg-background/70 text-[12px] font-medium">Drop to use</div>
              )}
            </div>
          )}
        </div>
        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2">
          <PrimaryButton disabled={!dash.selectedPlan || dash.vtoRunning || !dash.originalUrl} onClick={dash.onTryOn}>
            {dash.vtoRunning ? "Rendering…" : "Try this look on me"}
          </PrimaryButton>
          {dash.resultUrl && (dash.context.makeupFinish || dash.context.makeupPrompt.trim()) && (
            <GhostButton disabled={dash.makeupBusy} onClick={dash.onTryMakeup}>
              {dash.makeupBusy ? "Applying makeup…" : "Try this makeup on me"}
            </GhostButton>
          )}
          {dash.selectedPlan && <RetailerLink href={dash.selectedPlan.productUrl} compact />}
        </div>
        {dash.makeupError && <p className="mt-2 text-xs text-[#c43b3e]">{dash.errorMessages[dash.makeupError] || dash.errorMessages.UNEXPECTED_ERROR}</p>}
      </div>
    </Station>
  );
}

function SuggestionNode({ selected, data }: NodeProps) {
  const dash = useDash();
  const solution = dash.solutions.find((item) => item.id === String(data.solutionId || ""));
  if (!solution || solution.status !== "open") return null;
  return (
    <Station kicker="STYLIST" title={solution.plan.title} selected={selected} target={Position.Left} source={Position.Right}>
      <img src={solution.plan.sourceImageUrl} alt="" className="block h-auto w-full rounded-xl" />
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
    </Station>
  );
}

const nodeTypes: NodeTypes = {
  photos: PhotosNode,
  brief: BriefNode,
  plan: PlanNode,
  stage: StageNode,
  suggest: SuggestionNode,
};

function FlowBoard({ value }: { value: DashboardProps }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);
  const { setViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes(1280, value.plans));
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges(value.plans, value.selectedPlan));

  const seedLayout = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || seeded.current) return;
    const width = shell.clientWidth;
    if (width < 200) return;
    seeded.current = true;
    setNodes(layoutNodes(width, value.plans));
    setEdges(layoutEdges(value.plans, value.selectedPlan));
    requestAnimationFrame(() => setViewport({ x: 20, y: 16, zoom: 1 }, { duration: 0 }));
  }, [setEdges, setNodes, setViewport, value.plans, value.selectedPlan]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    seedLayout();
    const observer = new ResizeObserver(() => {
      if (!seeded.current) seedLayout();
    });
    observer.observe(shell);
    return () => observer.disconnect();
  }, [seedLayout]);

  useEffect(() => {
    if (!seeded.current) return;
    const open = value.solutions.filter((item) => item.status === "open");
    setNodes((current) => {
      const keep = current.filter((node) => node.type !== "plan" && node.type !== "suggest");
      const stage = current.find((node) => node.id === "stage");
      const photos = current.find((node) => node.id === "photos");
      const planNodes = value.plans.map((plan, index) => {
        const id = `plan-${plan.lookId}`;
        const prev = current.find((node) => node.id === id);
        if (prev) return { ...prev, data: { lookId: plan.lookId } };
        const x = (photos?.position.x || 40) + SIZE.photos.w + 96;
        const y = 40 + index * 560;
        return nodeBox(id, "plan", x, y, SIZE.plan.w, { lookId: plan.lookId });
      });
      const suggestNodes = open.map((solution, index) => {
        const id = `suggest-${solution.id}`;
        const prev = current.find((node) => node.id === id);
        if (prev) return { ...prev, data: { solutionId: solution.id } };
        const x = (stage?.position.x || 800) + SIZE.stage.w + 80;
        const y = (stage?.position.y || 40) + index * 420;
        return nodeBox(id, "suggest", x, y, SIZE.suggest.w, { solutionId: solution.id });
      });
      return [...keep, ...planNodes, ...suggestNodes];
    });
    const suggestEdges: Edge[] = open.map((solution) => ({
      id: `e-suggest-${solution.id}-stage`,
      source: `suggest-${solution.id}`,
      target: "stage",
      animated: true,
      style: { stroke: "#d25611", strokeWidth: 1.5 },
    }));
    setEdges([...layoutEdges(value.plans, value.selectedPlan), ...suggestEdges]);
  }, [setEdges, setNodes, value.plans, value.selectedPlan, value.solutions]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => addEdge({ ...connection, type: "smoothstep" }, current));
      if (connection.source?.startsWith("plan-") && connection.target === "stage") {
        const lookId = connection.source.slice("plan-".length);
        const plan = value.plans.find((item) => item.lookId === lookId);
        if (plan) value.onSelectPlan(plan);
      }
      if (connection.source?.startsWith("suggest-") && connection.target === "stage") {
        const solutionId = connection.source.slice("suggest-".length);
        const solution = value.solutions.find((item) => item.id === solutionId);
        if (solution) value.onAcceptSolution(solution);
      }
    },
    [setEdges, value],
  );

  return (
    <DashCtx.Provider value={value}>
      <div ref={shellRef} className="ww-flow h-[calc(100svh-3.5rem)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          nodesDraggable
          nodesConnectable
          elementsSelectable
          elevateNodesOnSelect
          autoPanOnNodeDrag
          panOnDrag
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          zoomOnDoubleClick={false}
          preventScrolling
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{ type: "smoothstep", style: { stroke: "#c4c4b4", strokeWidth: 1.5 } }}
          minZoom={0.35}
          maxZoom={1.6}
          defaultViewport={{ x: 20, y: 16, zoom: 1 }}
          deleteKeyCode={null}
          selectionOnDrag={false}
        >
          <Background id="dots" variant={BackgroundVariant.Dots} gap={22} size={1.15} color="#c9c9bc" />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>
      </div>
    </DashCtx.Provider>
  );
}

export function CanvasDashboard(props: DashboardProps) {
  return (
    <ReactFlowProvider>
      <FlowBoard value={props} />
    </ReactFlowProvider>
  );
}

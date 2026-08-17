"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PrimaryButton } from "@/components/ui";
import type { WearUIMessage } from "@/lib/agent-tools";
import type { HairPlan } from "@/lib/hair-engine";
import type { MakeupPlan } from "@/lib/makeup-engine";
import type { AgentSolution, WearContext, WearPlan } from "@/lib/types";

type ProposeOutput = {
  note: string;
  context: WearContext;
  plans: WearPlan[];
  makeupPlans?: MakeupPlan[];
  hairPlans?: HairPlan[];
};

type EditOutput = {
  resultUrl?: string;
  prompt?: string;
  error?: string;
};

function isProposeTool(part: WearUIMessage["parts"][number]): part is Extract<
  WearUIMessage["parts"][number],
  { type: "tool-proposeWearSolutions" } | { type: "dynamic-tool"; toolName: string }
> {
  return part.type === "tool-proposeWearSolutions" || (part.type === "dynamic-tool" && part.toolName === "proposeWearSolutions");
}

function proposeOutput(part: WearUIMessage["parts"][number]): (ProposeOutput & { toolCallId: string }) | null {
  if (!isProposeTool(part) || part.state !== "output-available" || !part.output) return null;
  const output = part.output as ProposeOutput;
  if (!output.plans?.length) return null;
  return { ...output, toolCallId: part.toolCallId };
}

function isEditTool(part: WearUIMessage["parts"][number]): part is Extract<
  WearUIMessage["parts"][number],
  { type: "tool-editWornLook" } | { type: "dynamic-tool"; toolName: string }
> {
  return part.type === "tool-editWornLook" || (part.type === "dynamic-tool" && part.toolName === "editWornLook");
}

function editOutput(part: WearUIMessage["parts"][number]): (EditOutput & { toolCallId: string }) | null {
  if (!isEditTool(part) || part.state !== "output-available" || !part.output) return null;
  const output = part.output as EditOutput;
  if (!output.resultUrl) return null;
  return { ...output, toolCallId: part.toolCallId };
}

function messageText(message: WearUIMessage) {
  return message.parts
    .filter((part) => part.type === "text" && part.text.trim())
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
}

function turnsFrom(messages: WearUIMessage[]) {
  const turns: { id: string; ask: string; reply: string }[] = [];
  let pendingAsk = "";
  let pendingId = "";
  for (const message of messages) {
    const text = messageText(message);
    if (message.role === "user" && text) {
      if (pendingAsk) turns.push({ id: pendingId, ask: pendingAsk, reply: "" });
      pendingAsk = text;
      pendingId = message.id;
    }
    if (message.role === "assistant" && pendingAsk) {
      turns.push({ id: pendingId, ask: pendingAsk, reply: text });
      pendingAsk = "";
      pendingId = "";
    }
  }
  if (pendingAsk) turns.push({ id: pendingId, ask: pendingAsk, reply: "" });
  return turns;
}

function Dots({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2" aria-live="polite" aria-busy="true">
      <span className="stylist-dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      {label ? <span className="font-mono text-[11px] tracking-[0.12em] text-brand">{label}</span> : null}
    </span>
  );
}

export function AgentDock({
  context,
  onContext,
  onSolutions,
  solutions = [],
  selectedPlan,
  onSelectPlan,
  onAcceptSolution,
  canTryOn = false,
  busy = false,
  canTryMakeup = false,
  makeupBusy = false,
  makeupTitle,
  onAcceptMakeup,
  canTryHair = false,
  hairBusy = false,
  hairTitle,
  onAcceptHair,
  wornImageUrl,
  onEditResult,
}: {
  context: WearContext;
  onContext: (next: WearContext) => void;
  onSolutions: (note: string, plans: WearPlan[], nextContext: WearContext, makeupPlans?: MakeupPlan[], hairPlans?: HairPlan[]) => void;
  solutions?: AgentSolution[];
  selectedPlan?: WearPlan;
  onSelectPlan?: (plan: WearPlan) => void;
  onAcceptSolution?: (solution: AgentSolution) => void;
  canTryOn?: boolean;
  busy?: boolean;
  canTryMakeup?: boolean;
  makeupBusy?: boolean;
  makeupTitle?: string;
  onAcceptMakeup?: () => void;
  canTryHair?: boolean;
  hairBusy?: boolean;
  hairTitle?: string;
  onAcceptHair?: () => void;
  wornImageUrl?: string;
  onEditResult?: (resultUrl: string) => void;
}) {
  const prompts = [
    "Client meeting, hot, long commute. What should I wear?",
    "Honeymoon, hot resort, I want something light.",
    "Weekend, cool outside, I run warm.",
  ];
  const [input, setInput] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const contextRef = useRef(context);
  contextRef.current = context;
  const wornRef = useRef(wornImageUrl);
  wornRef.current = wornImageUrl;
  const seen = useRef(new Set<string>());

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, context: contextRef.current, wornImageUrl: wornRef.current },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat<WearUIMessage>({ transport });
  const waiting = status === "submitted" || status === "streaming";
  const turns = turnsFrom(messages);

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        const output = proposeOutput(part);
        if (output && !seen.current.has(output.toolCallId)) {
          seen.current.add(output.toolCallId);
          if (output.plans?.length) {
            onContext(output.context);
            onSolutions(output.note, output.plans, output.context, output.makeupPlans, output.hairPlans);
            onSelectPlan?.(output.plans[0]);
            setOpenId(null);
          }
        }
        const edited = editOutput(part);
        if (edited && !seen.current.has(edited.toolCallId)) {
          seen.current.add(edited.toolCallId);
          onEditResult?.(edited.resultUrl!);
        }
      }
    }
  }, [messages, onContext, onSolutions, onSelectPlan, onEditResult]);

  useEffect(() => {
    const last = turns[turns.length - 1];
    if (last && !last.reply && waiting) setOpenId(last.id);
  }, [turns, waiting]);

  const pending = solutions.filter((item) => item.status === "open");
  const acceptTarget = pending.find((item) => item.plan.lookId === selectedPlan?.lookId) || pending[0];

  const errorText = (() => {
    const message = error?.message || "";
    if (/STYLIST_KEY_INVALID|authentication|api key/i.test(message)) {
      return "AIMLAPI rejected the API key. Add AIMLAPI_KEY from aimlapi.com on the server, then ask again.";
    }
    if (/internet|failed to fetch|network|disconnected|offline/i.test(message)) {
      return "No network right now. Reconnect and ask again.";
    }
    if (message.includes("STYLIST_FAILED") || error) {
      return "Could not reach the stylist. Try again.";
    }
    return "";
  })();

  const ask = (text: string) => {
    if (!text || waiting) return;
    setShowPrompts(false);
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <div className="pointer-events-auto mx-auto max-w-[1600px] px-4 sm:px-5">
        {turns.length === 0 && showPrompts && !waiting && !errorText && (
          <div className="divide-y divide-border border-b border-border">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-6 py-3 text-left text-sm tracking-[-0.2px] text-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => ask(prompt)}
              >
                <span>{prompt}</span>
                <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </div>
        )}

        {turns.length > 0 && (
          <div className="max-h-40 overflow-auto divide-y divide-border border-b border-border">
            {turns.map((turn) => {
              const open = openId === turn.id;
              return (
                <div key={turn.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    className="flex min-h-12 w-full items-center justify-between gap-6 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setOpenId(open ? null : turn.id)}
                  >
                    <span className="text-sm font-medium tracking-[-0.2px] text-foreground">{turn.ask}</span>
                    <span className="grid size-8 shrink-0 place-items-center text-muted-foreground" aria-hidden>
                      {open ? <X className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                  {open && (
                    <div className="pb-4">
                      {turn.reply ? (
                        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{turn.reply}</p>
                      ) : waiting ? (
                        <Dots label="LOOKING" />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {errorText && <p className="py-3 text-sm text-[#c43b3e]">{errorText}</p>}

        <form
          className="flex items-center gap-2 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            ask(input.trim());
          }}
        >
          <label className="sr-only" htmlFor="stylist-ask">
            Ask what to wear
          </label>
          <input
            id="stylist-ask"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={waiting}
            placeholder="What should I wear today?"
            onFocus={() => {
              if (turns.length === 0) setShowPrompts(true);
            }}
            className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          />
          {acceptTarget && (
            <PrimaryButton
              type="button"
              className="min-h-9 px-3 py-1.5 text-xs"
              disabled={busy || !canTryOn}
              onClick={() => {
                onSelectPlan?.(acceptTarget.plan);
                onAcceptSolution?.(acceptTarget);
              }}
            >
              {!canTryOn ? "Add a photo first" : busy ? "Dressing…" : "Accept"}
            </PrimaryButton>
          )}
          {!acceptTarget && canTryMakeup && (
            <PrimaryButton type="button" className="min-h-9 px-3 py-1.5 text-xs" disabled={makeupBusy} onClick={() => onAcceptMakeup?.()}>
              {makeupBusy ? "Makeup…" : "Accept"}
            </PrimaryButton>
          )}
          {!acceptTarget && !canTryMakeup && canTryHair && (
            <PrimaryButton type="button" className="min-h-9 px-3 py-1.5 text-xs" disabled={hairBusy} onClick={() => onAcceptHair?.()}>
              {hairBusy ? "Hair…" : "Accept"}
            </PrimaryButton>
          )}
          <PrimaryButton className="min-h-9 min-w-16 px-3 py-1.5 text-xs" disabled={waiting || !input.trim()} type="submit">
            {waiting ? <Dots /> : "Ask"}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}

export function solutionsFromPlans(note: string, plans: WearPlan[]): AgentSolution[] {
  return plans.map((plan) => ({
    id: `sol_${plan.lookId}_${plan.planId}`,
    note,
    plan,
    status: "open" as const,
  }));
}

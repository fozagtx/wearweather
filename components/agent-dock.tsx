"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@/components/prompt-kit/loader";
import { Message, MessageContent } from "@/components/prompt-kit/message";
import { PromptInput, PromptInputActions, PromptInputTextarea } from "@/components/prompt-kit/prompt-input";
import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion";
import { SystemMessage } from "@/components/prompt-kit/system-message";
import { Button } from "@/components/ui/button";
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

  const acceptLabel = acceptTarget
    ? !canTryOn
      ? "Add a photo first"
      : busy
        ? "Dressing…"
        : "Accept"
    : canTryMakeup
      ? makeupBusy
        ? "Makeup…"
        : "Accept"
      : canTryHair
        ? hairBusy
          ? "Hair…"
          : "Accept"
        : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <div className="pointer-events-auto mx-auto max-w-[1600px] px-4 sm:px-5">
        {turns.length === 0 && showPrompts && !waiting && !errorText && (
          <div className="flex flex-col gap-1 border-b border-border py-2">
            {prompts.map((prompt) => (
              <PromptSuggestion
                key={prompt}
                highlight={input}
                variant="ghost"
                size="sm"
                className="h-auto min-h-11 w-full justify-between rounded-xl px-1 py-2 text-left text-sm font-normal tracking-[-0.2px]"
                onClick={() => ask(prompt)}
              >
                {prompt}
              </PromptSuggestion>
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
                    <Message className="min-w-0 flex-1">
                      <MessageContent className="bg-transparent p-0 text-sm font-medium tracking-[-0.2px] text-foreground">
                        {turn.ask}
                      </MessageContent>
                    </Message>
                    <span className="grid size-10 shrink-0 place-items-center text-muted-foreground" aria-hidden>
                      {open ? <X className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                  {open && (
                    <div className="pb-4">
                      {turn.reply ? (
                        <Message>
                          <MessageContent className="max-w-3xl bg-transparent p-0 text-sm leading-relaxed text-muted-foreground">
                            {turn.reply}
                          </MessageContent>
                        </Message>
                      ) : waiting ? (
                        <Loader variant="loading-dots" size="sm" text="LOOKING" />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {errorText && (
          <SystemMessage
            className="my-2"
            variant="error"
            fill
            cta={{
              label: "Ask again",
              onClick: () => {
                const last = turns[turns.length - 1]?.ask || input.trim();
                if (last) ask(last);
              },
            }}
          >
            {errorText}
          </SystemMessage>
        )}

        <PromptInput
          className="rounded-none border-0 bg-transparent p-0 py-2 shadow-none"
          value={input}
          onValueChange={setInput}
          isLoading={waiting}
          disabled={waiting}
          maxHeight={88}
          onSubmit={() => ask(input.trim())}
        >
          <label className="sr-only" htmlFor="stylist-ask">
            Ask what to wear
          </label>
          <PromptInputTextarea
            id="stylist-ask"
            placeholder="What should I wear today?"
            onFocus={() => {
              if (turns.length === 0) setShowPrompts(true);
            }}
          />
          <PromptInputActions className="p-0">
            {acceptTarget && (
              <Button
                size="sm"
                disabled={busy || !canTryOn}
                onClick={() => {
                  onSelectPlan?.(acceptTarget.plan);
                  onAcceptSolution?.(acceptTarget);
                }}
              >
                {acceptLabel}
              </Button>
            )}
            {!acceptTarget && canTryMakeup && (
              <Button size="sm" disabled={makeupBusy} onClick={() => onAcceptMakeup?.()}>
                {acceptLabel}
              </Button>
            )}
            {!acceptTarget && !canTryMakeup && canTryHair && (
              <Button size="sm" disabled={hairBusy} onClick={() => onAcceptHair?.()}>
                {acceptLabel}
              </Button>
            )}
            <Button size="sm" disabled={waiting || !input.trim()} onClick={() => ask(input.trim())}>
              {waiting ? <Loader variant="dots" size="sm" /> : "Ask"}
            </Button>
          </PromptInputActions>
        </PromptInput>
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

"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { PrimaryButton } from "@/components/ui";
import type { WearUIMessage } from "@/lib/agent-tools";
import type { AgentSolution, WearContext, WearPlan } from "@/lib/types";

type ProposeOutput = {
  note: string;
  context: WearContext;
  plans: WearPlan[];
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
}: {
  context: WearContext;
  onContext: (next: WearContext) => void;
  onSolutions: (note: string, plans: WearPlan[], nextContext: WearContext) => void;
  solutions?: AgentSolution[];
  selectedPlan?: WearPlan;
  onSelectPlan?: (plan: WearPlan) => void;
  onAcceptSolution?: (solution: AgentSolution) => void;
  canTryOn?: boolean;
  busy?: boolean;
}) {
  const prompts = [
    "Client meeting, hot, long commute. What should I wear?",
    "Weekend, cool outside, I run warm.",
    "Need coverage and easy movement for a long walk.",
  ];
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const contextRef = useRef(context);
  contextRef.current = context;
  const seen = useRef(new Set<string>());
  const bottom = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, context: contextRef.current },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat<WearUIMessage>({ transport });

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        const output = proposeOutput(part);
        if (!output || seen.current.has(output.toolCallId)) continue;
        seen.current.add(output.toolCallId);
        if (!output.plans?.length) continue;
        onContext(output.context);
        onSolutions(output.note, output.plans, output.context);
        setOpen(true);
        onSelectPlan?.(output.plans[0]);
      }
    }
  }, [messages, onContext, onSolutions, onSelectPlan]);

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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-[0_16px_40px_rgba(26,26,20,0.12)]">
        <button
          type="button"
          className="flex w-full min-h-11 items-center justify-between px-4 py-2 text-left"
          onClick={() => setOpen((value) => !value)}
        >
          <span>
            <span className="block font-mono text-[10px] tracking-[0.16em] text-muted-foreground">STYLIST</span>
            <span className="text-sm font-medium">Ask what to wear</span>
          </span>
          <span className="text-xs text-muted-foreground">{open ? "Hide tips" : "Show tips"}</span>
        </button>
        {(open || messages.length > 0 || errorText) && (
          <div className="max-h-40 space-y-2 overflow-auto border-t border-border px-4 py-3 text-[13px] leading-relaxed">
            {open && messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Say the day in plain words. Ranked looks land in step 3. Accept appears in this box. That starts try-on.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="min-h-10 rounded-full border border-border px-3 py-2 text-left text-[11px] leading-snug text-muted-foreground hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        if (status === "streaming" || status === "submitted") return;
                        setOpen(true);
                        sendMessage({ text: prompt });
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id}>
                <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                  {message.role === "user" ? "YOU" : "STYLIST"}
                </p>
                {message.parts.map((part, index) => {
                  if (part.type === "text" && part.text.trim()) {
                    return (
                      <p key={`${message.id}-${index}`} className="mt-0.5">
                        {part.text}
                      </p>
                    );
                  }
                  if (isProposeTool(part)) {
                    return (
                      <p key={part.toolCallId} className="mt-0.5 text-muted-foreground">
                        {part.state === "output-available" ? "Looks are ready. Accept in the box to try one on." : "Choosing looks…"}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
            {errorText && <p className="text-[#c43b3e]">{errorText}</p>}
            <div ref={bottom} />
          </div>
        )}
        <form
          className="flex gap-2 border-t border-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const text = input.trim();
            if (!text || status === "streaming" || status === "submitted") return;
            setOpen(true);
            sendMessage({ text });
            setInput("");
          }}
        >
          <label className="sr-only" htmlFor="stylist-ask">
            Ask what to wear
          </label>
          <div className="flex min-h-10 min-w-0 flex-1 items-center rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
            <input
              id="stylist-ask"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={status === "streaming" || status === "submitted"}
              placeholder={acceptTarget ? acceptTarget.plan.title : "What should I wear today?"}
              className="min-h-10 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm outline-none"
            />
            {acceptTarget && (
              <PrimaryButton
                type="button"
                className="mr-1 min-h-8 px-3 py-1.5 text-xs"
                disabled={busy || !canTryOn}
                onClick={() => {
                  onSelectPlan?.(acceptTarget.plan);
                  onAcceptSolution?.(acceptTarget);
                }}
              >
                {!canTryOn ? "Add a photo first" : busy ? "Dressing…" : "Accept"}
              </PrimaryButton>
            )}
          </div>
          <PrimaryButton className="min-h-10 px-3 py-2 text-xs" disabled={status === "streaming" || status === "submitted" || !input.trim()} type="submit">
            {status === "streaming" || status === "submitted" ? "…" : "Ask"}
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

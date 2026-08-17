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
}: {
  context: WearContext;
  onContext: (next: WearContext) => void;
  onSolutions: (note: string, plans: WearPlan[], nextContext: WearContext) => void;
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(true);
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
      }
    }
  }, [messages, onContext, onSolutions]);

  const errorText = (() => {
    const message = error?.message || "";
    if (/STYLIST_KEY_INVALID|authentication|api key/i.test(message)) {
      return "DeepSeek rejected the API key. Add a key from platform.deepseek.com. It starts with sk-.";
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
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-[0_16px_40px_rgba(26,26,20,0.12)]">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setOpen((value) => !value)}
        >
          <span>
            <span className="block font-mono text-[10px] tracking-[0.16em] text-muted-foreground">STYLIST</span>
            <span className="text-sm font-medium">Ask what to wear</span>
          </span>
          <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
        </button>
        {open && (
          <div className="border-t border-border">
            <div className="max-h-48 space-y-2 overflow-auto px-4 py-3 text-[13px] leading-relaxed">
              {messages.length === 0 && (
                <p className="text-muted-foreground">Tell the day. Looks land as cards. Accept one to try it on.</p>
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
                          {part.state === "output-available" ? "Looks are on the board." : "Choosing looks…"}
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
            <form
              className="flex gap-2 border-t border-border p-3"
              onSubmit={(event) => {
                event.preventDefault();
                const text = input.trim();
                if (!text || status === "streaming" || status === "submitted") return;
                sendMessage({ text });
                setInput("");
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={status === "streaming" || status === "submitted"}
                placeholder="What should I wear today?"
                className="min-h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <PrimaryButton className="min-h-10 px-3 py-2 text-xs" disabled={status === "streaming" || status === "submitted" || !input.trim()} type="submit">
                {status === "streaming" || status === "submitted" ? "…" : "Ask"}
              </PrimaryButton>
            </form>
          </div>
        )}
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

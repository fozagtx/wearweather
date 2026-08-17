import { tool, type InferUITools, type UIMessage } from "ai";
import { z } from "zod";
import { rankWearPlans } from "@/lib/recommendation-engine";
import {
  FORMALITY_LEVELS,
  OUTDOOR_DURATIONS,
  PREFERENCES,
  TEMPERATURE_BANDS,
  WEAR_MOMENTS,
  type PreferenceId,
  type WearContext,
} from "@/lib/types";

const briefPatch = z.object({
  wearMoment: z.enum(WEAR_MOMENTS).optional(),
  temperatureBand: z.enum(TEMPERATURE_BANDS).optional(),
  outdoorDuration: z.enum(OUTDOOR_DURATIONS).optional(),
  formality: z.enum(FORMALITY_LEVELS).optional(),
  preferences: z.array(z.enum(PREFERENCES)).max(3).optional(),
  makeupFinish: z.boolean().optional(),
  lookPrompt: z.string().max(280).optional(),
  makeupPrompt: z.string().max(280).optional(),
});

export function mergeBrief(base: WearContext, patch: z.infer<typeof briefPatch>): WearContext {
  const preferences = (patch.preferences || base.preferences).slice(0, 3) as PreferenceId[];
  return {
    wearMoment: patch.wearMoment ?? base.wearMoment,
    temperatureBand: patch.temperatureBand ?? base.temperatureBand,
    outdoorDuration: patch.outdoorDuration ?? base.outdoorDuration,
    formality: patch.formality ?? base.formality,
    preferences,
    makeupFinish: patch.makeupFinish ?? (patch.makeupPrompt?.trim() ? true : base.makeupFinish),
    lookPrompt: patch.lookPrompt ?? base.lookPrompt,
    makeupPrompt: patch.makeupPrompt ?? base.makeupPrompt,
  };
}

export function wearAgentTools(current: WearContext) {
  return {
    proposeWearSolutions: tool({
      description:
        "Put 1 to 3 catalogue wear solutions on the user's canvas. Call this when you can recommend what they should wear. The user can accept a card to run virtual try-on.",
      inputSchema: briefPatch.extend({
        note: z.string().max(220).describe("One short pitch for why these looks fit the day."),
      }),
      execute: async ({ note, ...patch }) => {
        const context = mergeBrief(current, patch);
        const plans = rankWearPlans(context, Date.now());
        return { note, context, plans };
      },
    }),
  };
}

export type WearAgentTools = ReturnType<typeof wearAgentTools>;
export type WearUIMessage = UIMessage<never, never, InferUITools<WearAgentTools>>;

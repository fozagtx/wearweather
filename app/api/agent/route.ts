import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from "ai";
import { getActiveCatalogue } from "@/lib/catalogue";
import { wearAgentTools, type WearUIMessage } from "@/lib/agent-tools";
import { blankBrief } from "@/lib/example-brief";
import { contextLabels, preferenceLabels, type WearContext } from "@/lib/types";

export const maxDuration = 60;

function aimlApiKey() {
  return process.env.AIMLAPI_KEY || process.env.AIML_API_KEY || process.env.DEEPSEEK_API_KEY;
}

function aimlModel() {
  const raw = process.env.AIMLAPI_MODEL || process.env.DEEPSEEK_MODEL || "deepseek/deepseek-v4-flash";
  if (raw.includes("/")) return raw;
  if (raw.startsWith("deepseek")) return `deepseek/${raw}`;
  return raw;
}

function instructions(context: WearContext, wornImageUrl?: string) {
  const looks = getActiveCatalogue()
    .map((look) => `${look.id}: ${look.title}`)
    .join("\n");
  return `You are the WearWeather stylist. You sit with the user's photos, day brief, ranked looks, and try-on.

Help them decide what to wear for the day they actually have. Ask only what you still need: setting, outside temperature, commute time, polish, and up to three priorities (I run warm, I avoid cling, I need easy movement, I prefer coverage, I need low-maintenance care). Fashion notes and makeup notes are optional.

When they name any day, including honeymoon, resort, weekend, dinner, or travel, call proposeWearSolutions. Map honeymoon, resort, beach, or travel to vacation and smart casual unless they ask for dinner polish. Put their words in lookPrompt.
If they already have a try-on on screen and they want to change that outfit (color, length, fabric, drop a layer), call editWornLook. Do not call that until a look is on them.

Always rank the closest three looks on this rack. Never refuse. Never say the catalogue is only business or that you lack resort wear. Do not invent a garment that is not in the catalogue. Never infer gender from a photo. Makeup and hair are optional. Keep replies short. American spelling. Do not use em dashes.

Catalogue:
${looks}

Current brief:
Day: ${contextLabels.wearMoment[context.wearMoment]}
Outside: ${contextLabels.temperatureBand[context.temperatureBand]}
Commute: ${contextLabels.outdoorDuration[context.outdoorDuration]}
Polish: ${contextLabels.formality[context.formality]}
Priorities: ${context.preferences.map((id) => preferenceLabels[id]).join(", ") || "none"}
Makeup: ${context.makeupFinish ? "opt-in" : "off"}
Fashion note: ${context.lookPrompt || "none"}
Makeup note: ${context.makeupPrompt || "none"}
Hair note: ${context.hairPrompt || "none"}
Try-on on screen: ${wornImageUrl ? "yes, you can editWornLook" : "no"}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { messages?: WearUIMessage[]; context?: WearContext; wornImageUrl?: string };
  const messages = body.messages || [];
  const context = body.context || blankBrief;
  const wornImageUrl = typeof body.wornImageUrl === "string" ? body.wornImageUrl : undefined;
  const apiKey = aimlApiKey();

  if (!apiKey) {
    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({ type: "text-start", id: "offline" });
          writer.write({
            type: "text-delta",
            id: "offline",
            delta: "Stylist is offline. Add AIMLAPI_KEY on the server, then ask again.",
          });
          writer.write({ type: "text-end", id: "offline" });
        },
      }),
    });
  }

  const tools = wearAgentTools(context, wornImageUrl);
  const aiml = createOpenAICompatible({
    name: "aimlapi",
    baseURL: "https://api.aimlapi.com/v1",
    apiKey,
  });

  const result = streamText({
    model: aiml.chatModel(aimlModel()),
    instructions: instructions(context, wornImageUrl),
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: isStepCount(4),
    onError: ({ error }) => {
      console.error("stylist", error);
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      tools,
      onError: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (/authentication|api key|401/i.test(message)) return "STYLIST_KEY_INVALID";
        return "STYLIST_FAILED";
      },
    }),
  });
}

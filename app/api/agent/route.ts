import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from "ai";
import { deepSeek } from "@ai-sdk/deepseek";
import { getActiveCatalogue } from "@/lib/catalogue";
import { wearAgentTools, type WearUIMessage } from "@/lib/agent-tools";
import { blankBrief } from "@/lib/example-brief";
import { contextLabels, preferenceLabels, type WearContext } from "@/lib/types";

export const maxDuration = 60;

function instructions(context: WearContext) {
  const looks = getActiveCatalogue()
    .map((look) => `${look.id}: ${look.title}`)
    .join("\n");
  return `You are the WearWeather stylist. You sit on a canvas with the user's photos, day brief, ranked looks, and try-on.

Help them decide what to wear for the day they actually have. Ask only what you still need: setting, outside temperature, commute time, polish, and up to three priorities (I run warm, I avoid cling, I need easy movement, I prefer coverage, I need low-maintenance care). Fashion notes and makeup notes are optional.

When you can recommend, call proposeWearSolutions. That tool ranks the labeled catalogue and drops solution cards on the canvas. The user taps Accept to connect a look and run virtual try-on on their selected photo.

Never invent a garment, retailer, or look that is not in the catalogue. Never infer gender from a photo. Makeup is opt-in. Keep replies short. American spelling. Do not use em dashes.

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
Makeup note: ${context.makeupPrompt || "none"}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { messages?: WearUIMessage[]; context?: WearContext };
  const messages = body.messages || [];
  const context = body.context || blankBrief;

  if (!process.env.DEEPSEEK_API_KEY) {
    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({ type: "text-start", id: "offline" });
          writer.write({
            type: "text-delta",
            id: "offline",
            delta: "Stylist is offline. Add DEEPSEEK_API_KEY on the server, then ask again.",
          });
          writer.write({ type: "text-end", id: "offline" });
        },
      }),
    });
  }

  const tools = wearAgentTools(context);
  const modelId = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  const result = streamText({
    model: deepSeek(modelId),
    instructions: instructions(context),
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: isStepCount(4),
    providerOptions: {
      deepseek: { thinking: { type: "disabled" } },
    },
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

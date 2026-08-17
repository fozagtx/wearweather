import { contextLabels, type WearContext } from "./types";
import { expandHairTokens, scoreHaystack } from "./prompt-match";

export type HairTemplate = {
  id: string;
  thumb?: string;
  title: string;
  category_name: string;
  keep_users_color?: boolean;
};

export type HairPlan = {
  title: string;
  templateId: string;
  category: string;
  thumb?: string;
  reasons: string[];
  keepColor: boolean;
};

type FinishKind = "slick" | "loose" | "set";

function finishKind(context: WearContext): FinishKind {
  const prompt = (context.hairPrompt || "").toLowerCase();
  if (/updo|bun|slick|sleek|pulled|knot|twist/.test(prompt)) return "slick";
  if (/loose|wave|layers|long|blowout|soft/.test(prompt)) return "loose";
  if (/evening|glam|party|set|volume/.test(prompt)) return "set";
  if (context.formality === "formal" || context.wearMoment === "client_meeting") return "slick";
  if (context.wearMoment === "vacation" || context.wearMoment === "weekend") return "loose";
  if (context.temperatureBand === "hot_humid" || context.formality === "smart_casual") return "loose";
  if (context.wearMoment === "long_event") return "set";
  return "slick";
}

function profileFor(kind: FinishKind, context: WearContext) {
  const moment = contextLabels.wearMoment[context.wearMoment].toLowerCase();
  const polish = contextLabels.formality[context.formality].toLowerCase();
  const weather = contextLabels.temperatureBand[context.temperatureBand].toLowerCase();

  if (kind === "loose") {
    return {
      title: "Heat-day loose",
      category: "Loose",
      keywords: ["loose", "wave", "layers", "long", "soft", "blowout", "natural"],
      reasons: [
        `A ${weather} day keeps hair off a heavy set so the look stays light outdoors.`,
        `Matched to a ${moment}: movement first, not a formal slick.`,
      ],
    };
  }

  if (kind === "set") {
    return {
      title: "Evening set",
      category: "Set",
      keywords: ["volume", "wave", "glam", "evening", "party", "curl", "set"],
      reasons: [
        `A ${polish} night wants more shape than a commute style.`,
        `Kept for a ${moment}: present, not a daytime slick.`,
      ],
    };
  }

  return {
    title: "Slicked polish",
    category: "Slick",
    keywords: ["slick", "sleek", "bun", "updo", "pulled", "knot", "twist", "bob"],
    reasons: [
      `Business-polished ${moment}: hair stays clear of the collar and the brief.`,
      `Scored against the same day as the outfit: ${polish}, ${weather}.`,
    ],
  };
}

function scoreTemplate(template: HairTemplate, keywords: string[], context: WearContext) {
  const hay = `${template.title} ${template.category_name} ${template.id}`.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (hay.includes(keyword)) score += 3;
  }
  if (context.formality === "formal" && /slick|sleek|bun|updo|bob/.test(hay)) score += 2;
  if (context.formality === "business_polished" && /slick|bob|sleek|neat/.test(hay)) score += 2;
  if (context.temperatureBand === "hot_humid" && /loose|wave|layers|short|pixie/.test(hay)) score += 2;
  if (context.wearMoment === "long_event" && /volume|wave|set|curl/.test(hay)) score += 2;
  return score;
}

export function hairPlanForTemplate(context: WearContext, template: HairTemplate): HairPlan {
  const chosen = profileFor(finishKind(context), context);
  const promptNote = (context.hairPrompt || "").trim() ? [`Your hair note: "${context.hairPrompt.trim()}".`] : [];
  return {
    title: template.title,
    templateId: template.id,
    category: template.category_name,
    thumb: template.thumb,
    reasons: [...promptNote, ...chosen.reasons].slice(0, 3),
    keepColor: template.keep_users_color !== false,
  };
}

export function rankHairPlans(context: WearContext, templates: HairTemplate[], count = 3): HairPlan[] {
  if (!templates.length) return [];
  const promptTokens = expandHairTokens(context.hairPrompt || "");
  const kinds = ([finishKind(context), "slick", "loose", "set"] as FinishKind[]).filter(
    (kind, index, list) => list.indexOf(kind) === index,
  );
  const used = new Set<string>();
  const usedThumbs = new Set<string>();
  const plans: HairPlan[] = [];

  for (const kind of kinds) {
    if (plans.length >= count) break;
    const chosen = profileFor(kind, context);
    const ranked = [...templates]
      .filter((template) => !used.has(template.id) && (!template.thumb || !usedThumbs.has(template.thumb)))
      .map((template) => {
        const hay = `${template.title} ${template.category_name} ${template.id}`;
        return { template, score: scoreTemplate(template, chosen.keywords, context) + scoreHaystack(hay, promptTokens) };
      })
      .sort((a, b) => b.score - a.score || a.template.id.localeCompare(b.template.id));
    const selected = ranked[0]?.template;
    if (!selected) continue;
    used.add(selected.id);
    if (selected.thumb) usedThumbs.add(selected.thumb);
    plans.push(hairPlanForTemplate(context, selected));
  }
  return plans;
}

export function recommendHair(context: WearContext, templates: HairTemplate[]): HairPlan | undefined {
  return rankHairPlans(context, templates, 1)[0];
}

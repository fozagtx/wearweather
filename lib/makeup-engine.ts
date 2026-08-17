import { contextLabels, type WearContext } from "./types";
import { expandMakeupTokens, scoreHaystack } from "./prompt-match";

export type LookTemplate = {
  id: string;
  thumb?: string;
  title: string;
  category_name: string;
};

export type MakeupEffect = Record<string, unknown>;

export type MakeupSwatch = { name: string; hex: string };

export type MakeupPlan = {
  title: string;
  templateId: string;
  category: string;
  thumb?: string;
  reasons: string[];
  effects: MakeupEffect[];
  swatches: MakeupSwatch[];
  source: "look-vto" | "makeup-vto-fallback";
};

const FALLBACK_TEMPLATE_ID = "all_rosy_chic";

type FinishKind = "meeting" | "sheer" | "evening";

function finishKind(context: WearContext): FinishKind {
  const prompt = (context.makeupPrompt || "").toLowerCase();
  if (/smoky|glam|evening|red lip|bold|berry|night|party/.test(prompt)) return "evening";
  if (/natural|sheer|nude|glass|fresh|soft|no makeup/.test(prompt)) return "sheer";
  if (context.formality === "formal" || context.wearMoment === "long_event") return "evening";
  if (context.temperatureBand === "hot_humid" || context.formality === "smart_casual") return "sheer";
  return "meeting";
}

function blush(color: string, intensity: number): MakeupEffect {
  return {
    category: "blush",
    pattern: { name: "1color1" },
    palettes: [{ color, texture: "matte", colorIntensity: intensity }],
  };
}

function lip(color: string, intensity: number, gloss: number): MakeupEffect {
  return {
    category: "lip_color",
    shape: { name: "plump" },
    morphology: { fullness: 20, wrinkless: 20 },
    style: { type: "full" },
    palettes: [{ color, texture: "gloss", colorIntensity: intensity, gloss }],
  };
}

function skin(strength: number, colorIntensity: number): MakeupEffect {
  return { category: "skin_smooth", skinSmoothStrength: strength, skinSmoothColorIntensity: colorIntensity };
}

function profileFor(kind: FinishKind, context: WearContext) {
  const moment = contextLabels.wearMoment[context.wearMoment].toLowerCase();
  const polish = contextLabels.formality[context.formality].toLowerCase();
  const weather = contextLabels.temperatureBand[context.temperatureBand].toLowerCase();

  if (kind === "evening") {
    return {
      title: "Evening polish",
      category: "Evening",
      keywords: ["evening", "glam", "night", "bold", "red", "berry", "party", "chic"],
      reasons: [
        `Your ${polish} brief wants more presence than a daytime sheer.`,
        `Matched to a ${moment}: a stronger lip and blush than the commute look.`,
      ],
      effects: [skin(42, 38), blush("#C45B6A", 52), lip("#A83A4A", 68, 55)],
      swatches: [
        { name: "Blush", hex: "#C45B6A" },
        { name: "Lip", hex: "#A83A4A" },
      ],
    };
  }

  if (kind === "sheer") {
    return {
      title: "Heat-day sheer",
      category: "Daily",
      keywords: ["daily", "natural", "fresh", "sheer", "nude", "soft", "rosy"],
      reasons: [
        `A ${weather} day gets a lighter finish so the look does not read heavy outdoors.`,
        `Kept close to a ${moment}: visible, not a full evening makeup.`,
      ],
      effects: [skin(22, 18), blush("#E0A8A8", 28), lip("#D4A5A5", 30, 22)],
      swatches: [
        { name: "Blush", hex: "#E0A8A8" },
        { name: "Lip", hex: "#D4A5A5" },
      ],
    };
  }

  return {
    title: "Meeting polish",
    category: "Daily",
    keywords: ["chic", "rosy", "daily", "nude", "soft", "berry", "office", "natural"],
    reasons: [
      `Business-polished ${moment}: a defined lip and a quiet blush, not a night look.`,
      `Scored against the same brief as the outfit: ${polish}, ${weather}.`,
    ],
    effects: [skin(34, 28), blush("#C97B84", 40), lip("#C4787A", 44, 32)],
    swatches: [
      { name: "Blush", hex: "#C97B84" },
      { name: "Lip", hex: "#C4787A" },
    ],
  };
}

function scoreTemplate(template: LookTemplate, keywords: string[], context: WearContext) {
  const hay = `${template.title} ${template.category_name} ${template.id}`.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (hay.includes(keyword)) score += 3;
  }
  if (context.formality === "formal" && /evening|glam|night|bold/.test(hay)) score += 2;
  if (context.formality === "business_polished" && /chic|rosy|daily|office|nude|soft/.test(hay)) score += 2;
  if (context.temperatureBand === "hot_humid" && /natural|sheer|daily|fresh/.test(hay)) score += 2;
  if (context.wearMoment === "long_event" && /evening|glam|party/.test(hay)) score += 2;
  return score;
}

function buildPlan(context: WearContext, kind: FinishKind, template?: LookTemplate): MakeupPlan {
  const chosen = profileFor(kind, context);
  const promptNote = context.makeupPrompt.trim() ? [`Your makeup note: "${context.makeupPrompt.trim()}".`] : [];
  return {
    title: template?.title || chosen.title,
    templateId: template?.id || FALLBACK_TEMPLATE_ID,
    category: template?.category_name || chosen.category,
    thumb: template?.thumb,
    reasons: [...promptNote, ...chosen.reasons].slice(0, 3),
    effects: chosen.effects,
    swatches: chosen.swatches,
    source: template ? "look-vto" : "makeup-vto-fallback",
  };
}

export function rankMakeupPlans(context: WearContext, templates: LookTemplate[], count = 3): MakeupPlan[] {
  const promptTokens = expandMakeupTokens(context.makeupPrompt || "");
  const kinds = ([finishKind(context), "meeting", "sheer", "evening"] as FinishKind[]).filter(
    (kind, index, list) => list.indexOf(kind) === index,
  );
  const used = new Set<string>();

  return kinds.slice(0, count).map((kind) => {
    const chosen = profileFor(kind, context);
    const ranked = [...templates]
      .filter((template) => !used.has(template.id))
      .map((template) => {
        const hay = `${template.title} ${template.category_name} ${template.id}`;
        return { template, score: scoreTemplate(template, chosen.keywords, context) + scoreHaystack(hay, promptTokens) };
      })
      .sort((a, b) => b.score - a.score || a.template.id.localeCompare(b.template.id));
    const selected = ranked[0]?.template;
    if (selected) used.add(selected.id);
    return buildPlan(context, kind, selected);
  });
}

export function recommendMakeup(context: WearContext, templates: LookTemplate[]): MakeupPlan {
  return rankMakeupPlans(context, templates, 1)[0] || buildPlan(context, finishKind(context));
}

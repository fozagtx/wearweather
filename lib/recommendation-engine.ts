import type { LookCatalogRecord, PreferenceId, WearContext, WearPlan } from "./types";
import { expandFashionTokens, scoreHaystack } from "./prompt-match";

function hasKnownMovement(look: LookCatalogRecord) {
  return look.movementTags.some((tag) => tag !== "unknown");
}

function metadataSummary(look: LookCatalogRecord) {
  return [
    `${look.layerWeight} layer`,
    look.removableLayer ? "removable layer" : "single layer",
    `${look.silhouette[0]} silhouette`,
    look.careLevel === "unknown" ? "care level to check" : `${look.careLevel}-care tag`,
  ];
}

function reasonForPreference(preference: PreferenceId, look: LookCatalogRecord) {
  if (preference === "runs_warm" && (look.layerWeight === "light" || look.lining === "none")) {
    return "You selected ‘I run warm’; this plan prioritizes lighter construction information.";
  }
  if (preference === "avoid_cling" && look.silhouette.some((value) => ["relaxed", "straight", "loose"].includes(value))) {
    return "You selected ‘I avoid cling’; this plan uses a listed relaxed/straight silhouette.";
  }
  if (preference === "need_movement" && hasKnownMovement(look)) {
    return "This plan includes a listed movement-friendly detail.";
  }
  if (preference === "prefer_coverage" && look.coverageTags.some((tag) => tag !== "none")) {
    return "You selected ‘I prefer coverage’; this plan includes a listed coverage layer.";
  }
  if (preference === "low_maintenance" && look.careLevel === "easy") {
    return "This item is tagged easy-care in the catalogue.";
  }
  return null;
}

function scoreLook(look: LookCatalogRecord, context: WearContext) {
  let score = 0;
  const reasons: string[] = [];
  const promptTokens = expandFashionTokens(context.lookPrompt || "");
  if (promptTokens.length) {
    const hay = `${look.title} ${look.composition} ${look.verifiedFacts.join(" ")} ${look.silhouette.join(" ")} ${look.garmentCategory}`;
    const promptScore = scoreHaystack(hay, promptTokens);
    if (promptScore) {
      score += promptScore;
      reasons.push(`Matched your fashion note: “${context.lookPrompt.trim()}”.`);
    }
  }

  if (look.formality.includes(context.formality)) {
    score += 4;
    reasons.push(`Matches your ${context.formality.replace("_", "-")} setting.`);
  }
  if (context.temperatureBand === "hot_humid" && look.layerWeight === "light") {
    score += 3;
    reasons.push("Uses a lighter layer in your warm-day plan.");
  }
  if (context.temperatureBand === "hot_humid" && look.removableLayer) {
    score += 2;
    reasons.push("Lets you remove a layer after the commute.");
  }
  if (context.outdoorDuration === "extended" && look.layerWeight === "light") {
    score += 1;
  }
  if (context.outdoorDuration === "minimal" && look.layerWeight === "medium") {
    score += 1;
  }

  context.preferences.forEach((preference) => {
    const reason = reasonForPreference(preference, look);
    if (reason) {
      reasons.push(reason);
      score += preference === "runs_warm" || preference === "avoid_cling" ? 3 : preference === "need_movement" || preference === "prefer_coverage" ? 2 : 1;
    }
  });

  if (look.lining === "unknown" || look.careLevel === "unknown" || look.movementTags.includes("unknown")) score -= 2;

  const uniqueReasons = [...new Set(reasons)].slice(0, 3);
  while (uniqueReasons.length < 2) uniqueReasons.push(look.verifiedFacts[uniqueReasons.length] || "Catalogue metadata is available for review.");

  return { score, reasons: uniqueReasons };
}

export function rankWearPlans(context: WearContext, recommendationVersion = 1, excludeImageUrls: string[] = []): WearPlan[] {
  const usedImages = new Set(excludeImageUrls.filter(Boolean));
  const ranked = getRankedLooks(context)
    .filter(({ look }) => {
      if (usedImages.has(look.sourceImageUrl)) return false;
      usedImages.add(look.sourceImageUrl);
      return true;
    })
    .slice(0, 3);
  return ranked.map(({ look, reasons }, index) => ({
    planId: `plan_${recommendationVersion}_${look.id}`,
    recommendationVersion,
    lookId: look.id,
    rank: (index + 1) as 1 | 2 | 3,
    title: look.title,
    reasons,
    checkBeforeBuying: look.preBuyChecks[0],
    productUrl: look.productUrl,
    sourceImageUrl: look.sourceImageUrl,
    garmentMetadataSummary: metadataSummary(look),
  }));
}

export function getRankedLooks(context: WearContext) {
  return getActiveCatalogue()
    .map((look) => ({ look, ...scoreLook(look, context) }))
    .sort((a, b) => b.score - a.score || a.look.id.localeCompare(b.look.id));
}

function getActiveCatalogue() {
  return catalogue.filter((look) => look.active);
}

import { catalogue } from "./catalogue";

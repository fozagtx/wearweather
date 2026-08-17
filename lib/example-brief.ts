import type { WearContext } from "./types";

/** Seeded example brief used by “Try the example” and the landing preview. */
export const exampleBrief: WearContext = {
  wearMoment: "client_meeting",
  temperatureBand: "hot_humid",
  outdoorDuration: "extended",
  formality: "business_polished",
  preferences: ["runs_warm", "need_movement"],
  makeupFinish: true,
  lookPrompt: "",
  makeupPrompt: "",
  hairPrompt: "",
};

export const blankBrief: WearContext = {
  wearMoment: "workday",
  temperatureBand: "mild",
  outdoorDuration: "short",
  formality: "smart_casual",
  preferences: [],
  makeupFinish: false,
  lookPrompt: "",
  makeupPrompt: "",
  hairPrompt: "",
};

export const examplePhotoUrl = "/catalog/office-dark.jpg";
export const GITHUB_REPO = "https://github.com/fozagtx/wearweather";

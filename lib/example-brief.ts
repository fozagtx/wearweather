import type { WearContext } from "./types";

/** Seeded example brief used by “Try the example” and the landing preview. */
export const exampleBrief: WearContext = {
  wearMoment: "client_meeting",
  temperatureBand: "hot_humid",
  outdoorDuration: "extended",
  formality: "business_polished",
  preferences: ["runs_warm", "need_movement"],
};

export const examplePhotoUrl = "/catalog/office-dark.jpg";
export const GITHUB_REPO = "https://github.com/fozagtx/wearweather";

export const WEAR_MOMENTS = ["client_meeting", "presentation", "workday", "long_event"] as const;
export const TEMPERATURE_BANDS = ["cool", "mild", "warm", "hot_humid"] as const;
export const OUTDOOR_DURATIONS = ["minimal", "short", "extended"] as const;
export const FORMALITY_LEVELS = ["smart_casual", "business_polished", "formal"] as const;
export const PREFERENCES = ["runs_warm", "avoid_cling", "need_movement", "prefer_coverage", "low_maintenance"] as const;

export type WearMoment = (typeof WEAR_MOMENTS)[number];
export type TemperatureBand = (typeof TEMPERATURE_BANDS)[number];
export type OutdoorDuration = (typeof OUTDOOR_DURATIONS)[number];
export type Formality = (typeof FORMALITY_LEVELS)[number];
export type PreferenceId = (typeof PREFERENCES)[number];
export type GarmentCategory = "full_body" | "upper_body" | "outerwear";

export type WearContext = {
  wearMoment: WearMoment;
  temperatureBand: TemperatureBand;
  outdoorDuration: OutdoorDuration;
  formality: Formality;
  preferences: PreferenceId[];
};

export type LookCatalogRecord = {
  id: string;
  title: string;
  sourceImageUrl: string;
  productUrl: string;
  licenceRecordUrl: string;
  garmentCategory: GarmentCategory;
  formality: Formality[];
  silhouette: ("relaxed" | "straight" | "tailored" | "loose")[];
  layerWeight: "light" | "medium" | "heavy";
  removableLayer: boolean;
  lining: "none" | "partial" | "full" | "unknown";
  movementTags: ("stretch" | "relaxed_cut" | "sleeveless" | "slit" | "unknown")[];
  coverageTags: ("jacket" | "overshirt" | "sleeve" | "high_neck" | "none")[];
  careLevel: "easy" | "moderate" | "specialist" | "unknown";
  composition: string;
  verifiedFacts: string[];
  preBuyChecks: string[];
  active: boolean;
};

export type WearPlan = {
  planId: string;
  recommendationVersion: number;
  lookId: string;
  rank: 1 | 2 | 3;
  title: string;
  reasons: string[];
  checkBeforeBuying: string;
  productUrl: string;
  sourceImageUrl: string;
  garmentMetadataSummary: string[];
};

export type TaskStatus = "running" | "success" | "error";

export const preferenceLabels: Record<PreferenceId, string> = {
  runs_warm: "I run warm",
  avoid_cling: "I avoid cling",
  need_movement: "I need easy movement",
  prefer_coverage: "I prefer coverage",
  low_maintenance: "I need low-maintenance care",
};

export const contextLabels = {
  wearMoment: {
    client_meeting: "Client meeting",
    presentation: "Presentation",
    workday: "Workday",
    long_event: "Long event",
  },
  temperatureBand: {
    cool: "Cool",
    mild: "Mild",
    warm: "Warm",
    hot_humid: "Hot + humid",
  },
  outdoorDuration: {
    minimal: "Mostly indoors",
    short: "A short commute",
    extended: "An extended commute",
  },
  formality: {
    smart_casual: "Smart casual",
    business_polished: "Business polished",
    formal: "Formal",
  },
} as const;

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

export type ExamplePhoto = {
  id: string;
  url: string;
  label: string;
  alt: string;
};

export const examplePhotos: ExamplePhoto[] = [
  {
    id: "example-black-woman",
    url: "/examples/example-black-woman.jpg",
    label: "Example 1",
    alt: "Example try-on photo of a Black woman, standing, face and shoulders in frame",
  },
  {
    id: "example-midsize",
    url: "/examples/example-midsize.jpg",
    label: "Example 2",
    alt: "Example try-on photo of a mid-size woman, standing, full body",
  },
  {
    id: "example-plus",
    url: "/examples/example-plus.jpg",
    label: "Example 3",
    alt: "Example try-on photo of a plus-size woman, standing, full body",
  },
];

export const examplePhotoUrl = examplePhotos[0].url;
export const examplePhotoUrls = examplePhotos.map((photo) => photo.url);
export const GITHUB_REPO = "https://github.com/fozagtx/wearweather";

export type StudioJob = "look" | "makeup" | "hair" | "hair-clothes" | "hair-makeup" | "edit" | "orbit";

export const studioStatus: Record<
  StudioJob,
  { eyebrow: string; runningTitle: string; runningDetail: string; doneTitle: string; doneDetail?: string }
> = {
  look: {
    eyebrow: "Look",
    runningTitle: "Trying this outfit on you",
    runningDetail: "YouCam is dressing your photo in the look you picked.",
    doneTitle: "The look is on you",
  },
  makeup: {
    eyebrow: "Makeup",
    runningTitle: "Applying makeup",
    runningDetail: "On the worn look. Your face stays.",
    doneTitle: "Makeup is on",
  },
  hair: {
    eyebrow: "Hair",
    runningTitle: "Changing your hair",
    runningDetail: "On your photo first, so the style card does not take your face.",
    doneTitle: "Hair is on. Your face stayed.",
  },
  "hair-clothes": {
    eyebrow: "Hair",
    runningTitle: "Putting the outfit back on",
    runningDetail: "Hair is set. Same look goes back on that photo.",
    doneTitle: "Hair is on. Your face stayed.",
  },
  "hair-makeup": {
    eyebrow: "Hair",
    runningTitle: "Putting makeup back on",
    runningDetail: "Same face, new hair, then the finish you already picked.",
    doneTitle: "Hair is on. Your face stayed.",
  },
  edit: {
    eyebrow: "Edit",
    runningTitle: "Editing the clothes",
    runningDetail: "Only the change you typed. Face stays.",
    doneTitle: "Edit landed",
  },
  orbit: {
    eyebrow: "360",
    runningTitle: "Building the spin",
    runningDetail: "Turning the worn look so you can drag around it.",
    doneTitle: "360 is ready",
  },
};

export function jobFromHairPhase(phase?: "hair" | "clothes" | "makeup"): StudioJob {
  if (phase === "clothes") return "hair-clothes";
  if (phase === "makeup") return "hair-makeup";
  return "hair";
}

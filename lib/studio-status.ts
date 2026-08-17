export type StudioJob = "look" | "makeup" | "hair" | "hair-clothes" | "hair-makeup" | "edit" | "orbit";

export const studioStatus: Record<
  StudioJob,
  {
    eyebrow: string;
    runningTitle: string;
    runningDetail: string;
    doneTitle: string;
    doneDetail?: string;
    failedTitle: string;
    failedDetail: string;
  }
> = {
  look: {
    eyebrow: "Look",
    runningTitle: "Trying this outfit on you",
    runningDetail: "YouCam is dressing your photo in the look you picked.",
    doneTitle: "The look is on you",
    failedTitle: "The outfit did not land on your photo",
    failedDetail: "The look you picked is still selected. Try again.",
  },
  makeup: {
    eyebrow: "Makeup",
    runningTitle: "Applying makeup",
    runningDetail: "On the worn look. Your face stays.",
    doneTitle: "Makeup is on",
    failedTitle: "Makeup did not apply",
    failedDetail: "The worn look is still on the board. Try again.",
  },
  hair: {
    eyebrow: "Hair",
    runningTitle: "Changing your hair",
    runningDetail: "On your photo first, so the style card does not take your face.",
    doneTitle: "Hair is on. Your face stayed.",
    failedTitle: "Hair did not apply",
    failedDetail: "The worn look is still on the board. Try again.",
  },
  "hair-clothes": {
    eyebrow: "Hair",
    runningTitle: "Putting the outfit back on",
    runningDetail: "Hair is set. Same look goes back on that photo.",
    doneTitle: "Hair is on. Your face stayed.",
    failedTitle: "Hair did not finish",
    failedDetail: "The worn look is still on the board. Try again.",
  },
  "hair-makeup": {
    eyebrow: "Hair",
    runningTitle: "Putting makeup back on",
    runningDetail: "Same face, new hair, then the finish you already picked.",
    doneTitle: "Hair is on. Your face stayed.",
    failedTitle: "Hair did not finish",
    failedDetail: "The worn look is still on the board. Try again.",
  },
  edit: {
    eyebrow: "Edit",
    runningTitle: "Editing the clothes",
    runningDetail: "Only the change you typed. Face stays.",
    doneTitle: "Edit landed",
    failedTitle: "The edit did not land",
    failedDetail: "The last look is still on the board. Try again.",
  },
  orbit: {
    eyebrow: "360",
    runningTitle: "Building the spin",
    runningDetail: "Turning the worn look so you can drag around it.",
    doneTitle: "360 is ready",
    failedTitle: "The spin did not build",
    failedDetail: "Compare is still here.",
  },
};

export function jobFromHairPhase(phase?: "hair" | "clothes" | "makeup"): StudioJob {
  if (phase === "clothes") return "hair-clothes";
  if (phase === "makeup") return "hair-makeup";
  return "hair";
}

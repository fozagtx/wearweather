import { asDataUrl, kontextEdit } from "./look-edit";

export const ORBIT_YAWS = [45, 90, 135, 180, 225, 270, 315] as const;

function orbitPrompt(degrees: number) {
  return [
    `Keep the same person, face, hair, skin, and the exact same clothing from the photo.`,
    `Do not change identity. Do not infer gender. Do not invent garments, logos, or accessories.`,
    `Only move the camera ${degrees} degrees around the person, clockwise, so this is a new viewing angle of the same worn look.`,
    `Full body in frame. Same lighting and background family. Photoreal.`,
  ].join(" ");
}

export async function generateOrbitFrames(imageUrl: string): Promise<string[]> {
  const source = await asDataUrl(imageUrl);
  const sides = await Promise.all(ORBIT_YAWS.map((degrees) => kontextEdit(source, orbitPrompt(degrees))));
  if (sides.some((url) => !url)) throw new Error("TASK_FAILED");
  return [imageUrl, ...sides];
}

import { FORMALITY_LEVELS, OUTDOOR_DURATIONS, PREFERENCES, TEMPERATURE_BANDS, WEAR_MOMENTS, type PreferenceId, type WearContext } from "./types";

const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validatePhoto(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false as const, code: "PHOTO_FORMAT_INVALID" as const };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false as const, code: "PHOTO_TOO_LARGE" as const };
  return { ok: true as const };
}

export function isValidContext(value: unknown): value is WearContext {
  if (!value || typeof value !== "object") return false;
  const context = value as Record<string, unknown>;
  return (
    typeof context.wearMoment === "string" && WEAR_MOMENTS.includes(context.wearMoment as WearContext["wearMoment"]) &&
    typeof context.temperatureBand === "string" && TEMPERATURE_BANDS.includes(context.temperatureBand as WearContext["temperatureBand"]) &&
    typeof context.outdoorDuration === "string" && OUTDOOR_DURATIONS.includes(context.outdoorDuration as WearContext["outdoorDuration"]) &&
    typeof context.formality === "string" && FORMALITY_LEVELS.includes(context.formality as WearContext["formality"]) &&
    Array.isArray(context.preferences) &&
    context.preferences.length <= 3 &&
    context.preferences.every((preference) => typeof preference === "string" && PREFERENCES.includes(preference as PreferenceId)) &&
    typeof context.makeupFinish === "boolean" &&
    typeof context.lookPrompt === "string" &&
    context.lookPrompt.length <= 280 &&
    typeof context.makeupPrompt === "string" &&
    context.makeupPrompt.length <= 280 &&
    (context.hairPrompt === undefined || (typeof context.hairPrompt === "string" && context.hairPrompt.length <= 280))
  );
}

export function parseContext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return isValidContext(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

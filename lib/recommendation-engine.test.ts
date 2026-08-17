import assert from "node:assert/strict";
import test from "node:test";
import { rankWearPlans } from "./recommendation-engine";
import type { WearContext } from "./types";

const honeymoon: WearContext = {
  wearMoment: "honeymoon",
  temperatureBand: "hot_humid",
  outdoorDuration: "extended",
  formality: "smart_casual",
  preferences: ["runs_warm"],
  makeupFinish: false,
  lookPrompt: "honeymoon",
  makeupPrompt: "",
  hairPrompt: "",
};

const meeting: WearContext = {
  wearMoment: "client_meeting",
  temperatureBand: "mild",
  outdoorDuration: "short",
  formality: "business_polished",
  preferences: [],
  makeupFinish: false,
  lookPrompt: "",
  makeupPrompt: "",
  hairPrompt: "",
};

test("honeymoon ranks resort looks, not office suits", () => {
  const plans = rankWearPlans(honeymoon);
  assert.equal(plans.length, 3);
  assert.ok(plans.every((plan) => !/suit|blazer|navy|tailor/i.test(plan.title)));
  assert.ok(plans.some((plan) => /dress|maxi|sundress|wrap|stripe/i.test(plan.title)));
});

test("client meeting still ranks work looks", () => {
  const plans = rankWearPlans(meeting);
  assert.equal(plans.length, 3);
  assert.ok(plans.some((plan) => /blazer|suit|tailor|navy|structure/i.test(plan.title)));
  assert.ok(plans.every((plan) => !/sundress|maxi|wrap dress/i.test(plan.title)));
});

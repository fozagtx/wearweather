import assert from "node:assert/strict";
import test from "node:test";
import { hairPlanForTemplate, rankHairPlans, recommendHair } from "./hair-engine";
import { rankMakeupPlans, recommendMakeup } from "./makeup-engine";
import type { WearContext } from "./types";
import { hairTaskPayload } from "./youcam";

const brief: WearContext = {
  wearMoment: "client_meeting",
  temperatureBand: "hot_humid",
  outdoorDuration: "extended",
  formality: "business_polished",
  preferences: ["runs_warm"],
  makeupFinish: false,
  lookPrompt: "",
  makeupPrompt: "",
  hairPrompt: "",
};

test("empty hair templates do not invent demo cards", () => {
  assert.deepEqual(rankHairPlans(brief, [], 3), []);
  assert.equal(recommendHair(brief, []), undefined);
});

test("ranked hair plans keep the real template the user would pick", () => {
  const templates = [
    { id: "hair-slick", title: "Slick bun", category_name: "Slick", thumb: "/slick.jpg" },
    { id: "hair-loose", title: "Loose waves", category_name: "Loose", thumb: "/loose.jpg" },
    { id: "hair-set", title: "Evening set", category_name: "Set", thumb: "/set.jpg" },
  ];
  const plans = rankHairPlans(brief, templates, 3);
  assert.equal(plans.length, 3);
  assert.ok(plans.every((plan) => plan.templateId && plan.thumb));
  assert.equal(new Set(plans.map((plan) => plan.templateId)).size, 3);
  const chosen = hairPlanForTemplate(brief, templates[1]);
  assert.equal(chosen.templateId, "hair-loose");
  assert.equal(chosen.title, "Loose waves");
});

test("empty makeup templates do not invent the rosy-chic demo", () => {
  assert.deepEqual(rankMakeupPlans(brief, [], 3), []);
  assert.equal(recommendMakeup(brief, []), undefined);
});

test("hair task keeps the user photo as src and only asks for their color when the template allows it", () => {
  const withColor = hairTaskPayload({ srcFileId: "user-face", templateId: "bob", keepUserColor: true });
  assert.equal(withColor.src_file_id, "user-face");
  assert.equal(withColor.template_id, "bob");
  assert.equal(withColor.hair_color, "src");
  const styleOnly = hairTaskPayload({ srcFileUrl: "https://example.com/me.jpg", templateId: "pixie", keepUserColor: false });
  assert.equal(styleOnly.src_file_url, "https://example.com/me.jpg");
  assert.equal("hair_color" in styleOnly, false);
});

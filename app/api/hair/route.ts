import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getLookById } from "@/lib/catalogue";
import { recommendHair, type HairPlan } from "@/lib/hair-engine";
import { addTaskMapping } from "@/lib/task-cookie";
import { isValidContext, validatePhoto } from "@/lib/validation";
import { createHairTask, listHairTemplates, mapYouCamError, type HairTemplate } from "@/lib/youcam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolvePlan(context: unknown, templateId?: string): Promise<HairPlan> {
  if (!isValidContext(context)) throw new Error("UNEXPECTED_ERROR");
  let templates: HairTemplate[] = [];
  try {
    templates = await listHairTemplates();
  } catch {
    templates = [];
  }
  const plan = recommendHair(context, templates);
  if (templateId) return { ...plan, templateId };
  return plan;
}

async function startHair(input: { sourceUrl?: string; photo?: File; templateId: string }) {
  if (input.sourceUrl) {
    try {
      return await createHairTask({ srcFileUrl: input.sourceUrl, templateId: input.templateId });
    } catch {
      // Clothes or makeup result URLs can expire; fall through to the original photo.
    }
  }
  if (!input.photo) throw new Error("YOUCAM_TASK_RESPONSE_INVALID");
  return createHairTask({ sourceFile: input.photo, templateId: input.templateId });
}

export async function POST(request: Request) {
  const correlationId = crypto.randomUUID();
  try {
    const form = await request.formData();
    const photo = form.get("photo");
    const lookId = form.get("lookId");
    const sourceUrl = typeof form.get("sourceUrl") === "string" ? String(form.get("sourceUrl")) : undefined;
    const templateId = typeof form.get("templateId") === "string" ? String(form.get("templateId")) : undefined;
    let context: unknown = null;
    try {
      context = JSON.parse(String(form.get("context") || ""));
    } catch {
      context = null;
    }
    if (typeof lookId !== "string") {
      return NextResponse.json({ code: "UNEXPECTED_ERROR", correlationId }, { status: 400 });
    }
    if (photo instanceof File) {
      const validation = validatePhoto(photo);
      if (!validation.ok) return NextResponse.json({ code: validation.code, correlationId }, { status: 400 });
    } else if (!sourceUrl) {
      return NextResponse.json({ code: "UNEXPECTED_ERROR", correlationId }, { status: 400 });
    }
    const look = getLookById(lookId);
    if (!look) return NextResponse.json({ code: "REFERENCE_INVALID", correlationId }, { status: 400 });
    const plan = await resolvePlan(context, templateId);
    if (!plan.templateId) {
      return NextResponse.json({ code: "SERVICE_UNAVAILABLE", correlationId }, { status: 503 });
    }
    const photoFile = photo instanceof File ? photo : undefined;
    const started = await startHair({ sourceUrl, photo: photoFile, templateId: plan.templateId });
    const requestId = `req_${crypto.randomBytes(12).toString("hex")}`;
    await addTaskMapping(requestId, { providerTaskId: started.providerTaskId, lookId: look.id, createdAt: Date.now(), kind: "hair" });
    console.info(JSON.stringify({ event: "hair_requested", correlationId, lookId: look.id, templateId: plan.templateId }));
    return NextResponse.json({ requestId, status: "running", plan });
  } catch (error) {
    const code = mapYouCamError(error);
    console.error(JSON.stringify({ event: "hair_failed", correlationId, code }));
    const status = code === "RATE_LIMITED" ? 429 : code === "SERVICE_UNAVAILABLE" ? 503 : 502;
    return NextResponse.json({ code, correlationId }, { status });
  }
}

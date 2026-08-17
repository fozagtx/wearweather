import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getLookById } from "@/lib/catalogue";
import { hairPlanForTemplate } from "@/lib/hair-engine";
import { addTaskMapping } from "@/lib/task-cookie";
import { isValidContext, validatePhoto } from "@/lib/validation";
import { createHairTask, listHairTemplates, mapYouCamError } from "@/lib/youcam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const correlationId = crypto.randomUUID();
  try {
    const form = await request.formData();
    const photo = form.get("photo");
    const lookId = form.get("lookId");
    const templateId = typeof form.get("templateId") === "string" ? String(form.get("templateId")) : "";
    const makeupTemplateId = typeof form.get("makeupTemplateId") === "string" ? String(form.get("makeupTemplateId")) : "";
    let context: unknown = null;
    try {
      context = JSON.parse(String(form.get("context") || ""));
    } catch {
      context = null;
    }
    if (!(photo instanceof File) || typeof lookId !== "string" || !templateId) {
      return NextResponse.json({ code: "UNEXPECTED_ERROR", correlationId }, { status: 400 });
    }
    const validation = validatePhoto(photo);
    if (!validation.ok) return NextResponse.json({ code: validation.code, correlationId }, { status: 400 });
    if (!isValidContext(context)) {
      return NextResponse.json({ code: "UNEXPECTED_ERROR", correlationId }, { status: 400 });
    }
    const look = getLookById(lookId);
    if (!look) return NextResponse.json({ code: "REFERENCE_INVALID", correlationId }, { status: 400 });
    const templates = await listHairTemplates();
    const template = templates.find((item) => item.id === templateId);
    if (!template) return NextResponse.json({ code: "REFERENCE_INVALID", correlationId }, { status: 400 });
    const plan = hairPlanForTemplate(context, template);
    const started = await createHairTask({
      sourceFile: photo,
      templateId: plan.templateId,
      keepUserColor: plan.keepColor,
    });
    const requestId = `req_${crypto.randomBytes(12).toString("hex")}`;
    await addTaskMapping(requestId, {
      providerTaskId: started.providerTaskId,
      lookId: look.id,
      createdAt: Date.now(),
      kind: "hair",
      phase: "hair",
      makeupTemplateId: makeupTemplateId || undefined,
    });
    console.info(JSON.stringify({ event: "hair_requested", correlationId, lookId: look.id, templateId: plan.templateId }));
    return NextResponse.json({ requestId, status: "running", plan });
  } catch (error) {
    const code = mapYouCamError(error);
    console.error(JSON.stringify({ event: "hair_failed", correlationId, code }));
    const status = code === "RATE_LIMITED" ? 429 : code === "SERVICE_UNAVAILABLE" ? 503 : 502;
    return NextResponse.json({ code, correlationId }, { status });
  }
}

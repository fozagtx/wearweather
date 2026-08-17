import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getLookById } from "@/lib/catalogue";
import { makeupPlanForTemplate } from "@/lib/makeup-engine";
import { addTaskMapping } from "@/lib/task-cookie";
import { isValidContext } from "@/lib/validation";
import { createLookTask, fileFromImageUrl, listLookTemplates, mapYouCamError } from "@/lib/youcam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const correlationId = crypto.randomUUID();
  try {
    const form = await request.formData();
    const lookId = form.get("lookId");
    const sourceUrl = typeof form.get("sourceUrl") === "string" ? String(form.get("sourceUrl")) : "";
    const templateId = typeof form.get("templateId") === "string" ? String(form.get("templateId")) : "";
    let context: unknown = null;
    try {
      context = JSON.parse(String(form.get("context") || ""));
    } catch {
      context = null;
    }
    if (typeof lookId !== "string" || !templateId || !sourceUrl) {
      return NextResponse.json({ code: "UNEXPECTED_ERROR", correlationId }, { status: 400 });
    }
    if (!isValidContext(context)) {
      return NextResponse.json({ code: "UNEXPECTED_ERROR", correlationId }, { status: 400 });
    }
    const look = getLookById(lookId);
    if (!look) return NextResponse.json({ code: "REFERENCE_INVALID", correlationId }, { status: 400 });
    const templates = await listLookTemplates();
    const template = templates.find((item) => item.id === templateId);
    if (!template) return NextResponse.json({ code: "REFERENCE_INVALID", correlationId }, { status: 400 });
    const plan = makeupPlanForTemplate(context, template);
    const worn = await fileFromImageUrl(sourceUrl);
    const started = await createLookTask({ sourceFile: worn, templateId: plan.templateId });
    const requestId = `req_${crypto.randomBytes(12).toString("hex")}`;
    await addTaskMapping(requestId, { providerTaskId: started.providerTaskId, lookId: look.id, createdAt: Date.now(), kind: "look" });
    console.info(JSON.stringify({ event: "makeup_requested", correlationId, lookId: look.id, kind: "look", templateId: plan.templateId }));
    return NextResponse.json({ requestId, status: "running", plan, kind: "look" });
  } catch (error) {
    const code = mapYouCamError(error);
    console.error(JSON.stringify({ event: "makeup_failed", correlationId, code }));
    const status = code === "RATE_LIMITED" ? 429 : code === "SERVICE_UNAVAILABLE" ? 503 : 502;
    return NextResponse.json({ code, correlationId }, { status });
  }
}

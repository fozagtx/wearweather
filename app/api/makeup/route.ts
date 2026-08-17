import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getLookById } from "@/lib/catalogue";
import { recommendMakeup, type LookTemplate, type MakeupPlan } from "@/lib/makeup-engine";
import { MAX_TASKS, addTaskMapping, taskCount } from "@/lib/task-cookie";
import { isValidContext, validatePhoto } from "@/lib/validation";
import { createLookTask, createMakeupTask, listLookTemplates, mapYouCamError } from "@/lib/youcam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolvePlan(context: unknown, templateId?: string): Promise<MakeupPlan> {
  if (!isValidContext(context)) throw new Error("UNEXPECTED_ERROR");
  let templates: LookTemplate[] = [];
  try {
    templates = await listLookTemplates();
  } catch {
    templates = [];
  }
  const plan = recommendMakeup(context, templates);
  if (templateId) return { ...plan, templateId };
  return plan;
}

async function startLook(input: { sourceUrl?: string; photo?: File; templateId: string }) {
  if (input.sourceUrl) {
    try {
      return { ...(await createLookTask({ srcFileUrl: input.sourceUrl, templateId: input.templateId })), kind: "look" as const };
    } catch {
      // Clothes result URLs can expire; fall through to the original photo.
    }
  }
  if (!input.photo) throw new Error("YOUCAM_TASK_RESPONSE_INVALID");
  return { ...(await createLookTask({ sourceFile: input.photo, templateId: input.templateId })), kind: "look" as const };
}

async function startMakeupFallback(input: { sourceUrl?: string; photo?: File; effects: MakeupPlan["effects"] }) {
  if (input.sourceUrl) {
    try {
      return { ...(await createMakeupTask({ srcFileUrl: input.sourceUrl, effects: input.effects })), kind: "makeup" as const };
    } catch {
      // Fall through to uploaded photo.
    }
  }
  if (!input.photo) throw new Error("YOUCAM_TASK_RESPONSE_INVALID");
  return { ...(await createMakeupTask({ sourceFile: input.photo, effects: input.effects })), kind: "makeup" as const };
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
    if ((await taskCount()) >= MAX_TASKS) {
      return NextResponse.json(
        { code: "TASK_FAILED", correlationId, message: "This demo session has reached its task limit. Reset the session to begin again." },
        { status: 429 },
      );
    }

    const plan = await resolvePlan(context, templateId);
    const photoFile = photo instanceof File ? photo : undefined;
    let started: { providerTaskId: string; kind: "look" | "makeup" };
    try {
      started = await startLook({ sourceUrl, photo: photoFile, templateId: plan.templateId });
    } catch {
      started = await startMakeupFallback({ sourceUrl, photo: photoFile, effects: plan.effects });
    }

    const requestId = `req_${crypto.randomBytes(12).toString("hex")}`;
    await addTaskMapping(requestId, { providerTaskId: started.providerTaskId, lookId: look.id, createdAt: Date.now(), kind: started.kind });
    console.info(JSON.stringify({ event: "makeup_requested", correlationId, lookId: look.id, kind: started.kind, templateId: plan.templateId }));
    return NextResponse.json({ requestId, status: "running", plan, kind: started.kind });
  } catch (error) {
    const code = mapYouCamError(error);
    console.error(JSON.stringify({ event: "makeup_failed", correlationId, code }));
    return NextResponse.json({ code, correlationId }, { status: code === "SERVICE_UNAVAILABLE" ? 503 : 502 });
  }
}

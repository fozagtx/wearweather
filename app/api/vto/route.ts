import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getLookById } from "@/lib/catalogue";
import { addTaskMapping } from "@/lib/task-cookie";
import { mapYouCamError, createClothesTask } from "@/lib/youcam";
import { validatePhoto } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const correlationId = crypto.randomUUID();
  try {
    const form = await request.formData();
    const photo = form.get("photo");
    const lookId = form.get("lookId");
    if (!(photo instanceof File) || typeof lookId !== "string") {
      return NextResponse.json({ code: "UNEXPECTED_ERROR", correlationId }, { status: 400 });
    }
    const validation = validatePhoto(photo);
    if (!validation.ok) return NextResponse.json({ code: validation.code, correlationId }, { status: 400 });
    const look = getLookById(lookId);
    if (!look) return NextResponse.json({ code: "REFERENCE_INVALID", correlationId }, { status: 400 });

    const { providerTaskId } = await createClothesTask({
      sourceFile: photo,
      referenceImageUrl: look.sourceImageUrl,
      referenceName: `${look.id}.jpg`,
      garmentCategory: look.garmentCategory,
    });
    const requestId = `req_${crypto.randomBytes(12).toString("hex")}`;
    await addTaskMapping(requestId, { providerTaskId, lookId: look.id, createdAt: Date.now(), kind: "clothes" });
    console.info(JSON.stringify({ event: "vto_requested", correlationId, lookId: look.id }));
    return NextResponse.json({ requestId, status: "running" });
  } catch (error) {
    const code = mapYouCamError(error);
    console.error(JSON.stringify({ event: "vto_failed", correlationId, code, message: error instanceof Error ? error.message : "unknown" }));
    const status = code === "RATE_LIMITED" ? 429 : code === "SERVICE_UNAVAILABLE" ? 503 : 502;
    return NextResponse.json({ code, correlationId }, { status });
  }
}

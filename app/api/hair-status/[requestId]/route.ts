import { NextResponse } from "next/server";
import { getLookById } from "@/lib/catalogue";
import { addTaskMapping, getTaskMapping } from "@/lib/task-cookie";
import { createClothesTask, createLookTask, fileFromImageUrl, getClothesTask, getHairTask, getLookTask, mapYouCamError } from "@/lib/youcam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await context.params;
  const mapping = await getTaskMapping(requestId);
  if (!mapping || mapping.kind !== "hair") {
    return NextResponse.json({ status: "error", code: "SESSION_EXPIRED" }, { status: 404 });
  }
  const phase = mapping.phase || "hair";
  try {
    if (phase === "hair") {
      const task = await getHairTask(mapping.providerTaskId);
      if (task.status === "error") {
        return NextResponse.json({ status: "error", code: mapYouCamError(new Error(task.providerErrorCode || "TASK_FAILED")) });
      }
      if (task.status !== "success" || !task.resultUrl) return NextResponse.json({ status: "running" });
      const look = getLookById(mapping.lookId);
      if (!look) return NextResponse.json({ status: "error", code: "REFERENCE_INVALID" });
      const haired = await fileFromImageUrl(task.resultUrl, "haired.jpg");
      const clothes = await createClothesTask({
        sourceFile: haired,
        referenceImageUrl: look.sourceImageUrl,
        referenceName: `${look.id}.jpg`,
        garmentCategory: look.garmentCategory,
      });
      await addTaskMapping(requestId, {
        providerTaskId: clothes.providerTaskId,
        lookId: mapping.lookId,
        createdAt: mapping.createdAt,
        kind: "hair",
        phase: "clothes",
        makeupTemplateId: mapping.makeupTemplateId,
      });
      console.info(JSON.stringify({ event: "hair_redress_started", requestId, lookId: mapping.lookId }));
      return NextResponse.json({ status: "running" });
    }

    if (phase === "clothes") {
      const task = await getClothesTask(mapping.providerTaskId);
      if (task.status === "error") {
        return NextResponse.json({ status: "error", code: mapYouCamError(new Error(task.providerErrorCode || "TASK_FAILED")) });
      }
      if (task.status !== "success" || !task.resultUrl) return NextResponse.json({ status: "running" });
      if (mapping.makeupTemplateId) {
        const worn = await fileFromImageUrl(task.resultUrl);
        const makeup = await createLookTask({ sourceFile: worn, templateId: mapping.makeupTemplateId });
        await addTaskMapping(requestId, {
          providerTaskId: makeup.providerTaskId,
          lookId: mapping.lookId,
          createdAt: mapping.createdAt,
          kind: "hair",
          phase: "makeup",
        });
        console.info(JSON.stringify({ event: "hair_makeup_started", requestId, lookId: mapping.lookId }));
        return NextResponse.json({ status: "running" });
      }
      console.info(JSON.stringify({ event: "hair_completed", requestId, lookId: mapping.lookId }));
      return NextResponse.json({ status: "success", resultUrl: task.resultUrl, lookId: mapping.lookId });
    }

    const task = await getLookTask(mapping.providerTaskId);
    if (task.status === "success" && task.resultUrl) {
      console.info(JSON.stringify({ event: "hair_completed", requestId, lookId: mapping.lookId, phase: "makeup" }));
      return NextResponse.json({ status: "success", resultUrl: task.resultUrl, lookId: mapping.lookId });
    }
    if (task.status === "error") {
      return NextResponse.json({ status: "error", code: mapYouCamError(new Error(task.providerErrorCode || "TASK_FAILED")) });
    }
    return NextResponse.json({ status: "running" });
  } catch (error) {
    const code = mapYouCamError(error);
    console.error(JSON.stringify({ event: "hair_status_failed", requestId, code, phase }));
    if (code === "RATE_LIMITED") return NextResponse.json({ status: "running" });
    return NextResponse.json({ status: "error", code }, { status: code === "SERVICE_UNAVAILABLE" ? 503 : 502 });
  }
}

import { NextResponse } from "next/server";
import { getTaskMapping } from "@/lib/task-cookie";
import { getClothesTask, mapYouCamError } from "@/lib/youcam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await context.params;
  const mapping = await getTaskMapping(requestId);
  if (!mapping) return NextResponse.json({ status: "error", code: "SESSION_EXPIRED" }, { status: 404 });
  try {
    if (mapping.kind && mapping.kind !== "clothes") {
      return NextResponse.json({ status: "error", code: "SESSION_EXPIRED" }, { status: 404 });
    }
    const task = await getClothesTask(mapping.providerTaskId);
    if (task.status === "success" && task.resultUrl) {
      console.info(JSON.stringify({ event: "vto_completed", requestId, lookId: mapping.lookId }));
      return NextResponse.json({ status: "success", resultUrl: task.resultUrl, lookId: mapping.lookId });
    }
    if (task.status === "error") return NextResponse.json({ status: "error", code: mapYouCamError(new Error(task.providerErrorCode || "TASK_FAILED")) });
    return NextResponse.json({ status: "running" });
  } catch (error) {
    const code = mapYouCamError(error);
    console.error(JSON.stringify({ event: "vto_status_failed", requestId, code }));
    if (code === "RATE_LIMITED") return NextResponse.json({ status: "running" });
    return NextResponse.json({ status: "error", code }, { status: code === "SERVICE_UNAVAILABLE" ? 503 : 502 });
  }
}

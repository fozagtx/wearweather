import { NextResponse } from "next/server";
import { getTaskMapping } from "@/lib/task-cookie";
import { getLookTask, getMakeupTask, mapYouCamError } from "@/lib/youcam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await context.params;
  const mapping = await getTaskMapping(requestId);
  if (!mapping || (mapping.kind !== "look" && mapping.kind !== "makeup")) {
    return NextResponse.json({ status: "error", code: "SESSION_EXPIRED" }, { status: 404 });
  }
  try {
    const task = mapping.kind === "look" ? await getLookTask(mapping.providerTaskId) : await getMakeupTask(mapping.providerTaskId);
    if (task.status === "success" && task.resultUrl) {
      console.info(JSON.stringify({ event: "makeup_completed", requestId, lookId: mapping.lookId, kind: mapping.kind }));
      return NextResponse.json({ status: "success", resultUrl: task.resultUrl, lookId: mapping.lookId, kind: mapping.kind });
    }
    if (task.status === "error") {
      return NextResponse.json({ status: "error", code: mapYouCamError(new Error(task.providerErrorCode || "TASK_FAILED")) });
    }
    return NextResponse.json({ status: "running" });
  } catch (error) {
    const code = mapYouCamError(error);
    console.error(JSON.stringify({ event: "makeup_status_failed", requestId, code }));
    return NextResponse.json({ status: "error", code }, { status: code === "SERVICE_UNAVAILABLE" ? 503 : 502 });
  }
}

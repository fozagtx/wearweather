import { NextResponse } from "next/server";
import { editLookImage } from "@/lib/look-edit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imageUrl?: string; prompt?: string };
    if (!body.imageUrl || !body.prompt?.trim()) {
      return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 400 });
    }
    const resultUrl = await editLookImage(body.imageUrl, body.prompt);
    return NextResponse.json({ resultUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TASK_FAILED";
    const code = message === "STYLIST_OFFLINE" || message === "STYLIST_KEY_INVALID" ? "SERVICE_UNAVAILABLE" : message === "RATE_LIMITED" ? "RATE_LIMITED" : "TASK_FAILED";
    const status = code === "RATE_LIMITED" ? 429 : code === "SERVICE_UNAVAILABLE" ? 503 : 502;
    return NextResponse.json({ code }, { status });
  }
}

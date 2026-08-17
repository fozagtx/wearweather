import { NextResponse } from "next/server";
import { generateOrbitFrames } from "@/lib/look-orbit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imageUrl?: string };
    if (!body.imageUrl) {
      return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 400 });
    }
    const frames = await generateOrbitFrames(body.imageUrl);
    return NextResponse.json({ frames });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TASK_FAILED";
    const code = message === "STYLIST_OFFLINE" || message === "STYLIST_KEY_INVALID" ? "SERVICE_UNAVAILABLE" : message === "RATE_LIMITED" ? "RATE_LIMITED" : "TASK_FAILED";
    const status = code === "RATE_LIMITED" ? 429 : code === "SERVICE_UNAVAILABLE" ? 503 : 502;
    return NextResponse.json({ code }, { status });
  }
}

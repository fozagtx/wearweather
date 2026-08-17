import { NextResponse } from "next/server";
import { clearTaskCookie } from "@/lib/task-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  await clearTaskCookie();
  return NextResponse.json({ ok: true });
}

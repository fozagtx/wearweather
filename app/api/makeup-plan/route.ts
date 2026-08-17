import { NextResponse } from "next/server";
import { recommendMakeup, type LookTemplate } from "@/lib/makeup-engine";
import { isValidContext } from "@/lib/validation";
import { listLookTemplates } from "@/lib/youcam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isValidContext(body?.context)) {
      return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 400 });
    }
    let templates: LookTemplate[] = [];
    try {
      templates = await listLookTemplates();
    } catch {
      templates = [];
    }
    return NextResponse.json({ plan: recommendMakeup(body.context, templates) });
  } catch {
    return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { rankMakeupPlans, type LookTemplate } from "@/lib/makeup-engine";
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
    const plans = rankMakeupPlans(body.context, templates, 3);
    return NextResponse.json({ plan: plans[0] || null, plans });
  } catch {
    return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 400 });
  }
}

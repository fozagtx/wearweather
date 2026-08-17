import { NextResponse } from "next/server";
import { rankHairPlans } from "@/lib/hair-engine";
import { isValidContext } from "@/lib/validation";
import { listHairTemplates, type HairTemplate } from "@/lib/youcam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isValidContext(body?.context)) {
      return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 400 });
    }
    let templates: HairTemplate[] = [];
    try {
      templates = await listHairTemplates();
    } catch {
      templates = [];
    }
    const plans = rankHairPlans(body.context, templates, 3);
    return NextResponse.json({ plan: plans[0] || null, plans });
  } catch {
    return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 400 });
  }
}

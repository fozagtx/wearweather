import { NextResponse } from "next/server";

const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|::1)/i;

function hostOk(src: string) {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    return !PRIVATE.test(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src");
  if (!src || !hostOk(src)) {
    return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 400 });
  }
  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) {
    return NextResponse.json({ code: "TASK_FAILED" }, { status: 502 });
  }
  const type = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  if (!type.startsWith("image/")) {
    return NextResponse.json({ code: "TASK_FAILED" }, { status: 502 });
  }
  return new NextResponse(response.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

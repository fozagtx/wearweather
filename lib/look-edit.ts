function aimlApiKey() {
  return process.env.AIMLAPI_KEY || process.env.AIML_API_KEY || process.env.DEEPSEEK_API_KEY;
}

function editModel() {
  return process.env.AIMLAPI_EDIT_MODEL || "flux/kontext-pro/image-to-image";
}

async function asDataUrl(src: string) {
  if (src.startsWith("data:")) return src;
  const response = await fetch(src, { cache: "no-store" });
  if (!response.ok) throw new Error("IMAGE_FETCH_FAILED");
  const bytes = Buffer.from(await response.arrayBuffer());
  const type = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  return `data:${type};base64,${bytes.toString("base64")}`;
}

function extractImageUrl(body: Record<string, unknown>) {
  const images = body.images as { url?: string }[] | undefined;
  if (images?.[0]?.url) return images[0].url;
  const data = body.data as { url?: string }[] | undefined;
  if (data?.[0]?.url) return data[0].url;
  return undefined;
}

export async function kontextEdit(imageUrl: string, prompt: string) {
  const key = aimlApiKey();
  if (!key) throw new Error("STYLIST_OFFLINE");
  const trimmed = prompt.trim().slice(0, 4000);
  if (!trimmed) throw new Error("EMPTY_EDIT");
  const image = imageUrl.startsWith("data:") ? imageUrl : await asDataUrl(imageUrl);
  const response = await fetch("https://api.aimlapi.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: editModel(),
      image_url: image,
      prompt: trimmed,
      num_images: 1,
      output_format: "jpeg",
      aspect_ratio: "3:4",
    }),
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message = String(body.error || body.message || `HTTP_${response.status}`);
    if (/401|api key|auth/i.test(message)) throw new Error("STYLIST_KEY_INVALID");
    if (response.status === 429) throw new Error("RATE_LIMITED");
    throw new Error("TASK_FAILED");
  }
  const url = extractImageUrl(body);
  if (!url) throw new Error("TASK_FAILED");
  return url;
}

export async function editLookImage(imageUrl: string, prompt: string) {
  const trimmed = prompt.trim().slice(0, 400);
  if (!trimmed) throw new Error("EMPTY_EDIT");
  return kontextEdit(
    imageUrl,
    `Keep the same person, face, pose, and background. Change only the clothing as asked. Do not change identity. Do not infer gender. Edit: ${trimmed}`,
  );
}

export { asDataUrl };

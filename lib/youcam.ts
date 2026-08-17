import fs from "node:fs/promises";
import path from "node:path";
import type { GarmentCategory } from "./types";

const DEFAULT_BASE_URL = "https://yce-api-01.makeupar.com";

type FileUploadResult = { fileId: string; putUrl: string; requiredHeaders: Record<string, string> };

function apiKey() {
  return process.env.YOUCAM_API_KEY;
}

function baseUrl() {
  return (process.env.YOUCAM_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

async function providerJson(url: string, init: RequestInit) {
  const key = apiKey();
  if (!key) throw new Error("MISSING_YOUCAM_API_KEY");
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body?.error_code || body?.error || body?.data?.error || `HTTP_${response.status}`;
    throw new Error(`YOUCAM_${code}`);
  }
  return body;
}

async function createUpload(file: { name: string; type: string; size: number }, endpoint = `${baseUrl()}/s2s/v2.0/file`): Promise<FileUploadResult> {
  const body = await providerJson(endpoint, {
    method: "POST",
    body: JSON.stringify({ files: [{ content_type: file.type === "image/jpeg" ? "image/jpg" : file.type, file_name: file.name, file_size: file.size }] }),
  });
  const item = body?.data?.files?.[0];
  const request = item?.requests?.[0];
  if (!item?.file_id || !request?.url) throw new Error("YOUCAM_FILE_RESPONSE_INVALID");
  return { fileId: item.file_id, putUrl: request.url, requiredHeaders: request.headers || { "Content-Type": file.type } };
}

async function putFile(upload: FileUploadResult, bytes: ArrayBuffer) {
  const response = await fetch(upload.putUrl, { method: "PUT", headers: upload.requiredHeaders, body: bytes });
  if (!response.ok) throw new Error(`YOUCAM_UPLOAD_${response.status}`);
}

async function readReferenceImage(sourceImageUrl: string) {
  if (sourceImageUrl.startsWith("/")) return fs.readFile(path.join(process.cwd(), "public", sourceImageUrl));
  const response = await fetch(sourceImageUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("REFERENCE_DOWNLOAD_FAILED");
  return Buffer.from(await response.arrayBuffer());
}

function toYouCamGarment(category: GarmentCategory) {
  if (category === "outerwear") return "upper_body";
  return category;
}

export async function createClothesTask(input: { sourceFile: File; referenceImageUrl: string; referenceName: string; garmentCategory: GarmentCategory }) {
  const sourceBytes = await input.sourceFile.arrayBuffer();
  const referenceBytes = await readReferenceImage(input.referenceImageUrl);
  const sourceUpload = await createUpload({ name: input.sourceFile.name || "source.jpg", type: input.sourceFile.type, size: input.sourceFile.size });
  const referenceType = input.referenceImageUrl.endsWith(".png") ? "image/png" : "image/jpeg";
  const referenceUpload = await createUpload({ name: input.referenceName, type: referenceType, size: referenceBytes.byteLength });
  await putFile(sourceUpload, sourceBytes);
  await putFile(referenceUpload, referenceBytes.buffer.slice(referenceBytes.byteOffset, referenceBytes.byteOffset + referenceBytes.byteLength));
  const body = await providerJson(`${baseUrl()}/s2s/v2.0/task/cloth-v4`, {
    method: "POST",
    body: JSON.stringify({ src_file_id: sourceUpload.fileId, ref_file_id: referenceUpload.fileId, garment_category: toYouCamGarment(input.garmentCategory) }),
  });
  const providerTaskId = body?.data?.task_id;
  if (!providerTaskId) throw new Error("YOUCAM_TASK_RESPONSE_INVALID");
  return { providerTaskId };
}

function extractResultUrl(data: { results?: unknown }) {
  const results = data?.results as { url?: string; download_url?: string } | { url?: string; download_url?: string }[] | undefined;
  if (Array.isArray(results)) return results[0]?.download_url || results[0]?.url;
  return results?.url || results?.download_url;
}

export async function getClothesTask(providerTaskId: string) {
  const body = await providerJson(`${baseUrl()}/s2s/v2.0/task/cloth-v4/${encodeURIComponent(providerTaskId)}`, { method: "GET" });
  const taskStatus = body?.data?.task_status;
  if (taskStatus === "success") {
    const resultUrl = extractResultUrl(body?.data);
    if (!resultUrl) return { status: "running" as const };
    return { status: "success" as const, resultUrl };
  }
  if (taskStatus === "error" || body?.data?.error) return { status: "error" as const, providerErrorCode: body?.data?.error || "TASK_FAILED" };
  return { status: "running" as const };
}

export type LookTemplate = { id: string; thumb?: string; title: string; category_name: string };

let lookTemplateCache: { at: number; templates: LookTemplate[] } | null = null;
const LOOK_TEMPLATE_TTL_MS = 10 * 60 * 1000;

export async function listLookTemplates(): Promise<LookTemplate[]> {
  if (lookTemplateCache && Date.now() - lookTemplateCache.at < LOOK_TEMPLATE_TTL_MS) return lookTemplateCache.templates;
  const templates: LookTemplate[] = [];
  let token: string | undefined;
  for (let page = 0; page < 5; page += 1) {
    const query = new URLSearchParams({ page_size: "20" });
    if (token) query.set("starting_token", token);
    const body = await providerJson(`${baseUrl()}/s2s/v2.0/task/template/look-vto?${query}`, { method: "GET" });
    const batch = (body?.data?.templates || []) as LookTemplate[];
    templates.push(
      ...batch.map((template) => ({
        id: template.id,
        thumb: template.thumb,
        title: template.title,
        category_name: template.category_name,
      })),
    );
    token = body?.data?.next_token;
    if (!token || !batch.length) break;
  }
  lookTemplateCache = { at: Date.now(), templates };
  return templates;
}

async function uploadSource(file: File, endpoint: string) {
  const upload = await createUpload({ name: file.name || "source.jpg", type: file.type, size: file.size }, endpoint);
  await putFile(upload, await file.arrayBuffer());
  return upload.fileId;
}

export async function createLookTask(input: { srcFileUrl?: string; sourceFile?: File; templateId: string }) {
  let srcFileId: string | undefined;
  if (!input.srcFileUrl && input.sourceFile) {
    try {
      srcFileId = await uploadSource(input.sourceFile, `${baseUrl()}/s2s/v2.0/file/look-vto`);
    } catch {
      srcFileId = await uploadSource(input.sourceFile, `${baseUrl()}/s2s/v2.0/file`);
    }
  }
  const payload = srcFileId
    ? { src_file_id: srcFileId, template_id: input.templateId }
    : { src_file_url: input.srcFileUrl, template_id: input.templateId };
  const body = await providerJson(`${baseUrl()}/s2s/v2.0/task/look-vto`, { method: "POST", body: JSON.stringify(payload) });
  const providerTaskId = body?.data?.task_id;
  if (!providerTaskId) throw new Error("YOUCAM_TASK_RESPONSE_INVALID");
  return { providerTaskId };
}

export async function getLookTask(providerTaskId: string) {
  const body = await providerJson(`${baseUrl()}/s2s/v2.0/task/look-vto/${encodeURIComponent(providerTaskId)}`, { method: "GET" });
  const taskStatus = body?.data?.task_status;
  if (taskStatus === "success") return { status: "success" as const, resultUrl: extractResultUrl(body?.data) };
  if (taskStatus === "error" || body?.data?.error) return { status: "error" as const, providerErrorCode: body?.data?.error || body?.data?.failure_reason || "TASK_FAILED" };
  return { status: "running" as const };
}

export async function createMakeupTask(input: { srcFileUrl?: string; sourceFile?: File; effects: Record<string, unknown>[] }) {
  let srcFileId: string | undefined;
  if (!input.srcFileUrl && input.sourceFile) {
    srcFileId = await uploadSource(input.sourceFile, `${baseUrl()}/s2s/v2.0/file/makeup-vto`);
  }
  const payload = {
    version: "1.0",
    effects: input.effects,
    ...(srcFileId ? { src_file_id: srcFileId } : { src_file_url: input.srcFileUrl }),
  };
  const body = await providerJson(`${baseUrl()}/s2s/v2.0/task/makeup-vto`, { method: "POST", body: JSON.stringify(payload) });
  const providerTaskId = body?.data?.task_id;
  if (!providerTaskId) throw new Error("YOUCAM_TASK_RESPONSE_INVALID");
  return { providerTaskId };
}

export async function getMakeupTask(providerTaskId: string) {
  const body = await providerJson(`${baseUrl()}/s2s/v2.0/task/makeup-vto/${encodeURIComponent(providerTaskId)}`, { method: "GET" });
  const taskStatus = body?.data?.task_status;
  if (taskStatus === "success") return { status: "success" as const, resultUrl: extractResultUrl(body?.data) };
  if (taskStatus === "error" || body?.data?.error || body?.data?.failure_reason) {
    return { status: "error" as const, providerErrorCode: body?.data?.error || body?.data?.failure_reason || "TASK_FAILED" };
  }
  return { status: "running" as const };
}

export function mapYouCamError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("MISSING_YOUCAM_API_KEY")) return "SERVICE_UNAVAILABLE" as const;
  if (
    message.includes("error_pose") ||
    message.includes("error_invalid_src") ||
    message.includes("error_face_position") ||
    message.includes("error_face_angle")
  ) {
    return "PHOTO_GUIDANCE_NEEDED" as const;
  }
  if (message.includes("error_invalid_ref") || message.includes("REFERENCE")) return "REFERENCE_INVALID" as const;
  if (message.includes("InvalidApiKey") || message.includes("InvalidAccessToken") || message.includes("HTTP_401")) {
    return "SERVICE_UNAVAILABLE" as const;
  }
  if (message.includes("HTTP_429") || message.includes("TooMany") || message.includes("rate_limit") || message.includes("RATE_LIMIT")) {
    return "RATE_LIMITED" as const;
  }
  if (message.includes("invalid_parameter") || message.includes("YOUCAM_UPLOAD")) return "TASK_FAILED" as const;
  if (message.includes("HTTP_5") || message.includes("fetch")) return "SERVICE_UNAVAILABLE" as const;
  return "TASK_FAILED" as const;
}

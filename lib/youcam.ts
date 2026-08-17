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
    const code = body?.error_code || body?.data?.error || `HTTP_${response.status}`;
    throw new Error(`YOUCAM_${code}`);
  }
  return body;
}

async function createUpload(file: { name: string; type: string; size: number }): Promise<FileUploadResult> {
  const body = await providerJson(`${baseUrl()}/s2s/v2.0/file`, {
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
    body: JSON.stringify({ src_file_id: sourceUpload.fileId, ref_file_id: referenceUpload.fileId, garment_category: input.garmentCategory }),
  });
  const providerTaskId = body?.data?.task_id;
  if (!providerTaskId) throw new Error("YOUCAM_TASK_RESPONSE_INVALID");
  return { providerTaskId };
}

export async function getClothesTask(providerTaskId: string) {
  const body = await providerJson(`${baseUrl()}/s2s/v2.0/task/cloth-v4/${encodeURIComponent(providerTaskId)}`, { method: "GET" });
  const taskStatus = body?.data?.task_status;
  if (taskStatus === "success") return { status: "success" as const, resultUrl: body?.data?.results?.url as string | undefined };
  if (taskStatus === "error" || body?.data?.error) return { status: "error" as const, providerErrorCode: body?.data?.error || "TASK_FAILED" };
  return { status: "running" as const };
}

export function mapYouCamError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("MISSING_YOUCAM_API_KEY")) return "SERVICE_UNAVAILABLE" as const;
  if (message.includes("error_pose") || message.includes("error_invalid_src")) return "PHOTO_GUIDANCE_NEEDED" as const;
  if (message.includes("error_invalid_ref") || message.includes("REFERENCE")) return "REFERENCE_INVALID" as const;
  if (message.includes("HTTP_5") || message.includes("fetch")) return "SERVICE_UNAVAILABLE" as const;
  return "TASK_FAILED" as const;
}

import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "wearweather_tasks";
export const MAX_TASKS = 6;
const TTL_SECONDS = 60 * 60 * 24;

export type TaskKind = "clothes" | "look" | "makeup";
type TaskMapping = { providerTaskId: string; lookId: string; createdAt: number; kind?: TaskKind };
type CookiePayload = { expiresAt: number; tasks: Record<string, TaskMapping> };

function secret() {
  return process.env.SESSION_COOKIE_SECRET || "wearweather-local-dev-secret-change-me";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function encode(payload: CookiePayload) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${sign(value)}`;
}

function decode(value?: string): CookiePayload {
  if (!value) return { expiresAt: 0, tasks: {} };
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return { expiresAt: 0, tasks: {} };
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as CookiePayload;
    if (!payload.expiresAt || payload.expiresAt < Date.now() / 1000) return { expiresAt: 0, tasks: {} };
    return payload;
  } catch {
    return { expiresAt: 0, tasks: {} };
  }
}

export async function readTaskCookie() {
  const jar = await cookies();
  return decode(jar.get(COOKIE_NAME)?.value);
}

export async function addTaskMapping(requestId: string, mapping: TaskMapping) {
  const jar = await cookies();
  const current = decode(jar.get(COOKIE_NAME)?.value);
  const tasks = { ...current.tasks, [requestId]: mapping };
  const limited = Object.fromEntries(Object.entries(tasks).slice(-MAX_TASKS));
  jar.set(COOKIE_NAME, encode({ expiresAt: Math.floor(Date.now() / 1000) + TTL_SECONDS, tasks: limited }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function clearTaskCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getTaskMapping(requestId: string) {
  const payload = await readTaskCookie();
  return payload.tasks[requestId];
}

export async function taskCount() {
  const payload = await readTaskCookie();
  return Object.keys(payload.tasks).length;
}

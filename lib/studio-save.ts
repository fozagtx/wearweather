import type { WearContext } from "./types";

const DB_NAME = "wearweather";
const STORE = "studio";
const KEY = "current";

export type SavedPhoto = {
  id: string;
  name: string;
  type: string;
  label: string;
  x: number;
  y: number;
  blob: Blob;
};

export type SavedStudio = {
  version: 1;
  savedAt: number;
  mode: "example" | "upload";
  context: WearContext;
  selectedLookId?: string;
  selectedPhotoId?: string;
  selectedExampleId?: string;
  photos: SavedPhoto[];
  result?: Blob;
  makeup?: Blob;
  hair?: Blob;
  edit?: Blob;
  editBefore?: Blob;
  orbit?: Blob[];
  makeupTemplateId?: string;
  hairTemplateId?: string;
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadStudio(): Promise<SavedStudio | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve((request.result as SavedStudio | undefined) || null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function writeStudio(data: SavedStudio) {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(data, KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function clearStudio() {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export function studioHasWork(saved: SavedStudio | null) {
  if (!saved) return false;
  return Boolean(saved.result || saved.makeup || saved.hair || saved.edit || saved.photos.length);
}

export async function blobFromImageSrc(src: string): Promise<Blob | undefined> {
  try {
    const url = src.startsWith("http") ? `/api/img?src=${encodeURIComponent(src)}` : src;
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return blob.type.startsWith("image/") ? blob : undefined;
  } catch {
    return undefined;
  }
}

export async function downloadImage(src: string, name = "wearweather-look.jpg") {
  const blob = src.startsWith("blob:") || src.startsWith("data:") || src.startsWith("/")
    ? await (await fetch(src)).blob()
    : await blobFromImageSrc(src);
  if (!blob) throw new Error("SAVE_FAILED");
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.click();
  URL.revokeObjectURL(href);
}

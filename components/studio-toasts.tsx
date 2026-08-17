"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type StudioToastTone = "running" | "done" | "error";

export type StudioToast = {
  id: string;
  tone: StudioToastTone;
  eyebrow: string;
  title: string;
  detail?: string;
};

export function useStudioToasts() {
  const [toasts, setToasts] = useState<StudioToast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const dismissAll = useCallback(() => {
    Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
    timers.current = {};
    setToasts([]);
  }, []);

  const show = useCallback(
    (toast: StudioToast, ttlMs?: number) => {
      setToasts((current) => {
        const rest = current.filter((item) => item.id !== toast.id);
        return [...rest, toast].slice(-3);
      });
      if (timers.current[toast.id]) window.clearTimeout(timers.current[toast.id]);
      if (toast.tone === "running") return;
      timers.current[toast.id] = window.setTimeout(() => dismiss(toast.id), ttlMs ?? (toast.tone === "error" ? 8000 : 4200));
    },
    [dismiss],
  );

  useEffect(() => () => {
    Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
  }, []);

  return { toasts, show, dismiss, dismissAll };
}

export function StudioToasts({
  toasts,
  onDismiss,
}: {
  toasts: StudioToast[];
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (!toasts.length) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss(toasts[toasts.length - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toasts, onDismiss]);

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-[max(5.75rem,calc(env(safe-area-inset-bottom)+4.75rem))] z-40 flex flex-col gap-2 sm:inset-x-auto sm:top-20 sm:right-4 sm:bottom-auto sm:w-[22rem]"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className="ww-toast pointer-events-auto rounded-2xl border border-border bg-card p-3 shadow-[0_10px_28px_-18px_rgba(26,26,20,0.45)]"
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-1.5 size-2 shrink-0 rounded-full ${
                toast.tone === "running" ? "bg-brand motion-safe:animate-pulse" : toast.tone === "error" ? "bg-destructive" : "bg-foreground"
              }`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{toast.eyebrow}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{toast.title}</p>
              {toast.detail ? <p className="mt-0.5 text-sm text-muted-foreground">{toast.detail}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              aria-label="Dismiss notification"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

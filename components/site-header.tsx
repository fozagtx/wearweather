"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { WwLogo } from "@/components/ww-logo";

const nav = [
  { href: "#demo", label: "Example" },
  { href: "#features", label: "How it works" },
  { href: "#faq", label: "FAQ" },
  { href: "https://github.com/fozagtx/wearweather", label: "GitHub", external: true },
];

export function SiteHeader({
  onStart,
  showReset,
  onReset,
}: {
  onStart: () => void;
  showReset: boolean;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 bg-background transition-colors">
      <div className="px-4 sm:px-8 lg:px-[30px]">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-14 items-center justify-between">
            <a href="#top" className="flex items-center gap-2 text-sm font-medium tracking-[-0.3px]" aria-label="WearWeather home">
              <WwLogo className="size-7" />
              WearWeather
            </a>
            <div className="hidden items-center gap-4 lg:flex">
              <nav className="flex items-center gap-1">
                {nav.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="h-8 rounded-2xl border border-transparent bg-transparent px-3 text-sm text-foreground/90 transition-colors hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              {showReset ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="h-8 rounded-2xl bg-foreground px-3 text-sm font-semibold tracking-[-0.5px] text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Reset session
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStart}
                  className="h-8 rounded-2xl bg-foreground px-3 text-sm font-semibold tracking-[-0.5px] text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Start rehearsal
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 lg:hidden">
              <button
                type="button"
                onClick={onStart}
                className="h-8 rounded-2xl bg-foreground px-3 text-sm font-semibold tracking-[-0.5px] text-background transition-opacity hover:opacity-90"
              >
                Start
              </button>
              <button
                type="button"
                className="-mr-2.5 grid size-11 place-items-center text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="mobile-nav"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {open && (
        <div id="mobile-nav" className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="rounded-2xl px-3 py-3 text-sm hover:bg-muted/60"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

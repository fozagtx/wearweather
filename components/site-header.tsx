"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { WwLogo } from "@/components/ww-logo";

const nav = [
  { href: "#demo", label: "Example" },
  { href: "#features", label: "How it works" },
  { href: "#faq", label: "FAQ" },
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

  const ctaClass =
    "h-8 rounded-2xl bg-foreground px-3 text-sm font-semibold tracking-[-0.5px] text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="px-4 sm:px-8 lg:px-[30px]">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-14 items-center justify-between">
            {showReset ? (
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium tracking-[-0.3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Leave studio and return home"
                onClick={onReset}
              >
                <WwLogo className="size-8" />
                WearWeather
              </button>
            ) : (
              <a href="#top" className="flex items-center gap-2 text-sm font-medium tracking-[-0.3px]" aria-label="WearWeather home">
                <WwLogo className="size-8" />
                WearWeather
              </a>
            )}
            <div className="hidden items-center gap-2 lg:flex">
              {!showReset && (
                <nav className="flex items-center gap-2">
                  {nav.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="inline-flex h-8 items-center rounded-2xl border border-transparent bg-transparent px-3 text-sm text-foreground/90 transition-colors hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              )}
              {showReset ? (
                <button type="button" onClick={onReset} className={ctaClass}>
                  Leave studio
                </button>
              ) : (
                <button type="button" onClick={onStart} className={ctaClass}>
                  Test it
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              {showReset ? (
                <button type="button" onClick={onReset} className={ctaClass}>
                  Leave
                </button>
              ) : (
                <>
                  <button type="button" onClick={onStart} className={ctaClass}>
                    Test it
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {open && !showReset && (
        <div id="mobile-nav" className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
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

"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

export function GlowLoad({
  active,
  startedAt,
  label = "RENDERING",
  className = "aspect-[4/5] min-h-[240px]",
}: {
  active: boolean;
  startedAt?: number;
  label?: string;
  className?: string;
}) {
  const [pct, setPct] = useState(3);

  useEffect(() => {
    if (!active) {
      setPct(3);
      return;
    }
    const origin = startedAt || Date.now();
    const tick = () => {
      const elapsed = Date.now() - origin;
      const t = Math.min(elapsed / 90000, 1);
      const eased = 1 - (1 - t) ** 1.55;
      const extra = elapsed > 90000 ? Math.min(5, (elapsed - 90000) / 8000) : 0;
      setPct(Math.max(3, Math.min(97, Math.round(eased * 92 + extra))));
    };
    tick();
    const id = window.setInterval(tick, 180);
    return () => window.clearInterval(id);
  }, [active, startedAt]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#1a1a14] ${className}`} aria-live="polite" aria-busy="true">
      <ImageIcon className="absolute top-3 left-3 size-4 text-[#fbfbf9]/55" aria-hidden="true" />
      <p className="absolute top-3 right-3 font-mono text-[11px] tracking-[0.08em] text-[#fbfbf9]/70">{pct}%</p>
      <div className="absolute inset-0 grid place-items-center">
        <span className="ww-glow block size-44 rounded-full" />
      </div>
      <p className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.16em] text-[#fbfbf9]/50">{label}</p>
    </div>
  );
}

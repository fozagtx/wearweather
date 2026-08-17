"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "js-cloudimage-360-view/css";

function localFrame(src: string) {
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  return `/api/img?src=${encodeURIComponent(src)}`;
}

export function Look360({
  frames,
  className = "",
}: {
  frames: string[];
  className?: string;
}) {
  const list = frames.map(localFrame);
  const count = list.length;
  const [index, setIndex] = useState(0);
  const drag = useRef<{ x: number; start: number } | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [frames.join("|")]);

  const move = useCallback(
    (clientX: number) => {
      const active = drag.current;
      if (!active || count < 2) return;
      const step = Math.round((clientX - active.x) / 18);
      setIndex((((active.start - step) % count) + count) % count);
    },
    [count],
  );

  if (count < 2) return null;

  return (
    <div
      role="slider"
      aria-label="360 look"
      aria-valuemin={0}
      aria-valuemax={count - 1}
      aria-valuenow={index}
      tabIndex={0}
      className={`ww-360 relative min-h-0 w-full flex-1 touch-none bg-[#ecece4] ${className}`}
      style={{ touchAction: "none", cursor: "ew-resize" }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, start: index };
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        event.preventDefault();
        move(event.clientX);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onDragStart={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setIndex((current) => (current + 1) % count);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          setIndex((current) => (current - 1 + count) % count);
        }
      }}
    >
      <img src={list[index]} alt="" draggable={false} className="pointer-events-none h-full w-full object-contain object-top" />
    </div>
  );
}

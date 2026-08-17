"use client";

import { useEffect, useRef } from "react";

export function CompareCanvas({
  leftSrc,
  rightSrc,
  position,
  leftLabel,
  rightLabel,
  onPosition,
  className = "h-[min(70vh,680px)]",
}: {
  leftSrc: string;
  rightSrc: string;
  position: number;
  leftLabel: string;
  rightLabel: string;
  onPosition: (value: number) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leftImage = useRef<HTMLImageElement | null>(null);
  const rightImage = useRef<HTMLImageElement | null>(null);
  const ready = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const load = (src: string, slot: "left" | "right") => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (cancelled) return;
        if (slot === "left") leftImage.current = image;
        else rightImage.current = image;
        ready.current += 1;
        draw();
      };
      image.src = src;
    };
    ready.current = 0;
    load(leftSrc, "left");
    load(rightSrc, "right");
    return () => {
      cancelled = true;
    };
  }, [leftSrc, rightSrc]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth;
    const parentH = canvas.parentElement?.clientHeight || 0;
    const img = leftImage.current || rightImage.current;
    const height = parentH > 80 ? parentH : img && img.width ? Math.round(width * (img.height / img.width)) : 320;
    if (parentH > 80) canvas.style.height = "100%";
    else canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ecece4";
    ctx.fillRect(0, 0, width, height);
    const paint = (image: HTMLImageElement | null, clip?: number) => {
      if (!image) return;
      const scale = Math.min(width / image.width, height / image.height);
      const dw = image.width * scale;
      const dh = image.height * scale;
      const dx = (width - dw) / 2;
      const dy = 0;
      ctx.save();
      if (clip !== undefined) {
        ctx.beginPath();
        ctx.rect(0, 0, clip, height);
        ctx.clip();
      }
      ctx.drawImage(image, dx, dy, dw, dh);
      ctx.restore();
    };
    const split = (position / 100) * width;
    paint(rightImage.current);
    paint(leftImage.current, split);
    ctx.fillStyle = "#1a1a14";
    ctx.fillRect(split - 1, 0, 2, height);
    ctx.beginPath();
    ctx.arc(split, height / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fbfbf9";
    ctx.beginPath();
    ctx.moveTo(split - 5, height / 2);
    ctx.lineTo(split + 5, height / 2);
    ctx.strokeStyle = "#fbfbf9";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    draw();
  }, [position, leftSrc, rightSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative bg-[#ecece4] ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
      <label className="sr-only" htmlFor="compare-slider">
        Compare original photo and virtual rendering
      </label>
      <input
        id="compare-slider"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(event) => onPosition(Number(event.target.value))}
      />
      <div className="pointer-events-none absolute top-4 left-4 rounded-md border border-border bg-background/80 px-2 py-1.5 font-mono text-[10px] tracking-[0.5px]">
        {leftLabel}
      </div>
      <div className="pointer-events-none absolute top-4 right-4 rounded-md border border-border bg-background/80 px-2 py-1.5 font-mono text-[10px] tracking-[0.5px]">
        {rightLabel}
      </div>
    </div>
  );
}

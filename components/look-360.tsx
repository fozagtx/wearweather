"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "js-cloudimage-360-view/css";

const CI360Viewer = dynamic(() => import("js-cloudimage-360-view/react").then((mod) => mod.CI360Viewer), { ssr: false });

export function Look360({
  frames,
  className = "",
}: {
  frames: string[];
  className?: string;
}) {
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAutoplay(!media.matches);
    const onChange = () => setAutoplay(!media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  if (frames.length < 2) return null;

  return (
    <div className={`ww-360 relative min-h-0 w-full bg-[#ecece4] ${className}`}>
      <CI360Viewer
        key={frames.join("|")}
        imageListX={frames}
        amountX={frames.length}
        autoplay={autoplay}
        speed={140}
        inertia
        keys
        fullscreen
        pinchZoom
        zoomMax={3}
        zoomControls
        zoomControlsPosition="bottom-right"
        bottomCircle
        hints={false}
        scrollHint={false}
        initialIconShown={false}
        hide360Logo
        theme="light"
        brandColor="#d25611"
        aspectRatio="3/4"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

export interface LoaderProps {
  variant?:
    | "circular"
    | "classic"
    | "pulse"
    | "pulse-dot"
    | "dots"
    | "typing"
    | "wave"
    | "bars"
    | "terminal"
    | "text-blink"
    | "text-shimmer"
    | "loading-dots";
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeBox = { sm: "size-4", md: "size-5", lg: "size-6" } as const;

export function CircularLoader({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeBox[size], className)}
      role="status"
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function DotsLoader({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const dots = { sm: "h-1.5 w-1.5", md: "h-2 w-2", lg: "h-2.5 w-2.5" };
  const wrap = { sm: "h-4", md: "h-5", lg: "h-6" };
  return (
    <div className={cn("flex items-center space-x-1", wrap[size], className)} role="status">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn("animate-[bounce-dots_1.4s_ease-in-out_infinite] rounded-full bg-brand", dots[size])}
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TypingLoader({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const dots = { sm: "h-1 w-1", md: "h-1.5 w-1.5", lg: "h-2 w-2" };
  const wrap = { sm: "h-4", md: "h-5", lg: "h-6" };
  return (
    <div className={cn("flex items-center space-x-1", wrap[size], className)} role="status">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn("animate-[typing_1s_infinite] rounded-full bg-brand", dots[size])}
          style={{ animationDelay: `${i * 250}ms` }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TextDotsLoader({
  className,
  text = "Thinking",
  size = "md",
}: {
  className?: string;
  text?: string;
  size?: "sm" | "md" | "lg";
}) {
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  return (
    <div className={cn("inline-flex items-center font-mono tracking-[0.12em] text-brand", textSizes[size], className)} role="status">
      <span>{text}</span>
      <span className="inline-flex w-6">
        <span className="animate-[loading-dots_1.4s_infinite]">.</span>
        <span className="animate-[loading-dots_1.4s_infinite]" style={{ animationDelay: "0.2s" }}>
          .
        </span>
        <span className="animate-[loading-dots_1.4s_infinite]" style={{ animationDelay: "0.4s" }}>
          .
        </span>
      </span>
    </div>
  );
}

export function Loader({ variant = "circular", size = "md", text, className }: LoaderProps) {
  switch (variant) {
    case "dots":
      return <DotsLoader className={className} size={size} />;
    case "typing":
      return <TypingLoader className={className} size={size} />;
    case "loading-dots":
      return <TextDotsLoader className={className} size={size} text={text} />;
    default:
      return <CircularLoader className={className} size={size} />;
  }
}

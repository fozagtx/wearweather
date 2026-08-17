import type { ButtonHTMLAttributes, ReactNode } from "react";

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-semibold tracking-[-0.5px] text-background transition-opacity hover:opacity-90 disabled:opacity-45 ${focus} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-3xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-45 ${focus} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-sm tracking-[0.5px] text-muted-foreground ${className}`}>
      {children}
    </span>
  );
}

export function SectionShell({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative px-4 py-16 sm:px-8 sm:py-20 lg:px-[30px] lg:py-24 ${className}`}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

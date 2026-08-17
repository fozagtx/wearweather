"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const systemMessageVariants = cva("flex flex-row items-center gap-3 rounded-[12px] border py-2 pr-2 pl-3", {
  variants: {
    variant: {
      action: "text-foreground",
      error: "text-destructive",
      warning: "text-brand",
    },
    fill: {
      true: "bg-background",
      false: "",
    },
  },
  compoundVariants: [
    { variant: "action", fill: true, class: "border-transparent bg-muted" },
    { variant: "error", fill: true, class: "border-transparent bg-destructive/10" },
    { variant: "warning", fill: true, class: "border-transparent bg-brand/10" },
    { variant: "action", fill: false, class: "border-border" },
    { variant: "error", fill: false, class: "border-destructive/50" },
    { variant: "warning", fill: false, class: "border-brand/40" },
  ],
  defaultVariants: {
    variant: "action",
    fill: false,
  },
});

export type SystemMessageProps = ComponentProps<"div"> &
  VariantProps<typeof systemMessageVariants> & {
    icon?: ReactNode;
    isIconHidden?: boolean;
    cta?: {
      label: string;
      onClick?: () => void;
      variant?: "solid" | "outline" | "ghost";
    };
  };

export function SystemMessage({
  children,
  variant = "action",
  fill = false,
  icon,
  isIconHidden = false,
  cta,
  className,
  ...props
}: SystemMessageProps) {
  const defaultIcon =
    variant === "error" ? (
      <AlertCircle className="size-4" aria-hidden />
    ) : variant === "warning" ? (
      <AlertTriangle className="size-4" aria-hidden />
    ) : (
      <Info className="size-4" aria-hidden />
    );
  const shownIcon = isIconHidden ? null : (icon ?? defaultIcon);

  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn(systemMessageVariants({ variant, fill }), className)} {...props}>
      {shownIcon ? <div className="shrink-0">{shownIcon}</div> : null}
      <div className="min-w-0 flex-1 text-sm leading-relaxed">{children}</div>
      {cta ? (
        <Button
          size="sm"
          variant={cta.variant === "solid" ? "default" : (cta.variant ?? "outline")}
          onClick={cta.onClick}
        >
          {cta.label}
        </Button>
      ) : null}
    </div>
  );
}

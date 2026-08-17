"use client";

import type { VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PromptSuggestionProps = {
  children: ReactNode;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  highlight?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function PromptSuggestion({ children, variant, size, className, highlight, ...props }: PromptSuggestionProps) {
  const isHighlightMode = highlight !== undefined && highlight.trim() !== "";
  const content = typeof children === "string" ? children : "";

  if (!isHighlightMode) {
    return (
      <Button variant={variant || "outline"} size={size || "lg"} className={cn("rounded-full", className)} {...props}>
        {children}
      </Button>
    );
  }

  if (!content) {
    return (
      <Button
        variant={variant || "ghost"}
        size={size || "sm"}
        className={cn("w-full cursor-pointer justify-start rounded-xl py-2 hover:bg-accent", className)}
        {...props}
      >
        {children}
      </Button>
    );
  }

  const trimmedHighlight = highlight.trim();
  const contentLower = content.toLowerCase();
  const highlightLower = trimmedHighlight.toLowerCase();
  const shouldHighlight = contentLower.includes(highlightLower);

  return (
    <Button
      variant={variant || "ghost"}
      size={size || "sm"}
      className={cn("w-full cursor-pointer justify-start gap-0 rounded-xl py-2 hover:bg-accent", className)}
      {...props}
    >
      {shouldHighlight ? (
        (() => {
          const index = contentLower.indexOf(highlightLower);
          if (index === -1) return <span>{content}</span>;
          const actualHighlightedText = content.substring(index, index + highlightLower.length);
          const before = content.substring(0, index);
          const after = content.substring(index + actualHighlightedText.length);
          return (
            <>
              {before ? <span className="text-muted-foreground">{before}</span> : null}
              <span className="text-foreground">{actualHighlightedText}</span>
              {after ? <span className="text-muted-foreground">{after}</span> : null}
            </>
          );
        })()
      ) : (
        <span className="text-muted-foreground">{content}</span>
      )}
    </Button>
  );
}

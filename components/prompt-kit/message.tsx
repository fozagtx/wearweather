import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MessageProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function Message({ children, className, ...props }: MessageProps) {
  return (
    <div className={cn("flex gap-3", className)} {...props}>
      {children}
    </div>
  );
}

export type MessageContentProps = {
  children: ReactNode;
  markdown?: boolean;
  className?: string;
} & ComponentProps<"div">;

export function MessageContent({ children, className, ...props }: MessageContentProps) {
  return (
    <div className={cn("prose break-words whitespace-normal rounded-lg bg-secondary p-2 text-foreground", className)} {...props}>
      {children}
    </div>
  );
}

export type MessageActionsProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function MessageActions({ children, className, ...props }: MessageActionsProps) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)} {...props}>
      {children}
    </div>
  );
}

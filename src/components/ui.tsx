import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "gold" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3.5 text-base",
        variant === "primary" && "bg-burdeo text-marfil hover:bg-burdeo-600 shadow-sm",
        variant === "gold" && "bg-dorado text-negro hover:bg-dorado-soft shadow-sm",
        variant === "outline" && "border border-[var(--border)] bg-transparent hover:bg-black/5",
        variant === "ghost" && "hover:bg-white/10",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-[var(--border)] bg-card shadow-[0_1px_3px_rgba(20,16,15,0.06)]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dorado/40 bg-dorado/10 px-2.5 py-0.5 text-xs font-medium text-burdeo",
        className,
      )}
      {...props}
    />
  );
}
